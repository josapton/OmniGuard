from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
from integrations.ai_agents import invoke_llm_with_fallback, extract_json
from langchain_core.prompts import PromptTemplate

router = APIRouter(
    prefix="/api/policy",
    tags=["policy"],
)

class EvaluateRequest(BaseModel):
    domain: str

@router.post("/evaluate")
async def evaluate_domain(req: EvaluateRequest):
    """
    Evaluates whether a domain is allowed to be scanned.
    Blocks government (.gov, .go.id) and military (.mil) domains by default
    unless an explicit bypass is provided (not implemented yet).
    """
    prompt = PromptTemplate.from_template(
        "You are an AI Domain Policy Agent for a cybersecurity scanning platform.\n"
        "Evaluate the following domain: {domain}\n\n"
        "Rules:\n"
        "1. Block domains belonging to government (.gov, .go.id) or military (.mil) immediately.\n"
        "2. Allow standard commercial or personal domains (.com, .net, .io, .id, etc.).\n"
        "3. If the domain seems highly suspicious or is a known critical infrastructure, flag for 'review'.\n\n"
        "Return EXACTLY this JSON structure:\n"
        "{{\n"
        "  \"allowed\": true or false,\n"
        "  \"policy\": \"allow\", \"block\", or \"review\",\n"
        "  \"reason\": \"A short explanation of why it was allowed or blocked.\"\n"
        "}}\n"
    )
    
    try:
        response = await invoke_llm_with_fallback(prompt, {"domain": req.domain})
        result = extract_json(response.content)
        return {
            "allowed": result.get("allowed", True),
            "policy": result.get("policy", "allow"),
            "reason": result.get("reason", "Evaluated by AI Policy Agent.")
        }
    except Exception as e:
        # Failsafe: Allow if AI fails, but log it
        print(f"Policy evaluation failed: {e}")
        return {
            "allowed": True, 
            "policy": "allow", 
            "reason": "AI evaluation failed, defaulting to allow."
        }
