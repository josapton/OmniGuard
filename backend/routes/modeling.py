from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from integrations.nvd import get_cve_data
from integrations.ai_agents import predict_threat_model, extract_json
import json

router = APIRouter(prefix="/api/modeling", tags=["modeling"])

class ThreatModelRequest(BaseModel):
    asset_name: str
    cpe_name: str
    environment: str = "production"

@router.post("/predict")
async def predict_threats(request: ThreatModelRequest):
    """
    Predict attack paths based on actual CVEs from NVD for a specific CPE.
    """
    try:
        # 1. Fetch real CVEs from NVD
        cve_records = await get_cve_data(request.cpe_name)
        
        # We limit to the top 5 recent CVEs to avoid overwhelming the LLM prompt
        recent_cves = cve_records[:5]
        
        parsed_cves = []
        for item in recent_cves:
            cve = item.get("cve", {})
            parsed_cves.append({
                "id": cve.get("id"),
                "description": cve.get("descriptions", [{}])[0].get("value"),
                "severity": cve.get("metrics", {}).get("cvssMetricV31", [{}])[0].get("cvssData", {}).get("baseScore", "Unknown")
            })

        asset_data = {
            "name": request.asset_name,
            "cpe": request.cpe_name,
            "environment": request.environment
        }

        # 2. Use Gemini to generate predictive risk model
        ai_response = await predict_threat_model(asset_data, parsed_cves)
        
        if isinstance(ai_response, dict) and "error" in ai_response:
             raise HTTPException(status_code=500, detail=ai_response["error"])
        
        # Parse the JSON response from Gemini
        try:
            result = extract_json(ai_response)
        except Exception:
            # Fallback if Gemini didn't return perfect JSON
            result = {
                "risk_score": 50,
                "likely_attack_paths": [{"vector": "Unknown", "escalation": "Requires manual review", "probability": "Medium"}],
                "rationale": ai_response
            }
            
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
