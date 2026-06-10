from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from integrations.ai_agents import simulate_attack_path, extract_json
import json

router = APIRouter(prefix="/api/exposure", tags=["exposure"])

class TopologyDataRequest(BaseModel):
    target_ip: str
    open_ports: list
    running_services: list
    known_vulnerabilities: list

@router.post("/simulate")
async def simulate_attack(request: TopologyDataRequest):
    """
    Simulate theoretical attack paths based on provided network topology and vulnerabilities.
    """
    topology_context = {
        "target_ip": request.target_ip,
        "open_ports": request.open_ports,
        "running_services": request.running_services,
        "known_vulnerabilities": request.known_vulnerabilities
    }

    try:
        ai_response = await simulate_attack_path(topology_context)
        
        if isinstance(ai_response, dict) and "error" in ai_response:
             raise HTTPException(status_code=500, detail=ai_response["error"])
        
        try:
            result = extract_json(ai_response)
        except Exception:
            result = {
                "entry_point": "Unknown",
                "lateral_movement": "Unknown",
                "privilege_escalation": "Unknown",
                "impact": "Unknown",
                "mitigation_priority": "High",
                "raw_analysis": ai_response
            }
            
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
