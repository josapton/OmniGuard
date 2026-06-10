from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from integrations.ai_agents import analyze_osint_data, extract_json
import json

router = APIRouter(prefix="/api/osint", tags=["osint"])

class OsintRequest(BaseModel):
    raw_text: str

@router.post("/analyze")
async def analyze_leak(request: OsintRequest):
    """
    Process raw text (e.g. pastebin, dark web scrape) to extract IoCs and threat intel.
    """
    try:
        ai_response = await analyze_osint_data(request.raw_text)
        
        if isinstance(ai_response, dict) and "error" in ai_response:
             raise HTTPException(status_code=500, detail=ai_response["error"])
        
        try:
            result = extract_json(ai_response)
        except Exception:
            result = {
                "threat_level": "Unknown",
                "threat_actors": [],
                "targeted_entities": [],
                "extracted_iocs": [],
                "summary": ai_response
            }
            
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
