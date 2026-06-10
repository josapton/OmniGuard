from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from integrations.ai_agents import generate_auto_remediation

router = APIRouter(prefix="/api/remediation", tags=["remediation"])

class RemediationRequest(BaseModel):
    vulnerability_details: str
    target_os: str = "linux"

@router.post("/generate")
async def generate_mitigation_script(request: RemediationRequest):
    """
    Generate a mitigation script (e.g., bash, ansible, powershell) based on vulnerability details.
    """
    try:
        script_output = await generate_auto_remediation(
            vulnerability_details=request.vulnerability_details,
            target_os=request.target_os
        )
        if isinstance(script_output, dict) and "error" in script_output:
            raise HTTPException(status_code=500, detail=script_output["error"])
        
        return {"script": script_output, "target_os": request.target_os}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
