from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from integrations.ai_agents import chat_with_copilot

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    query: str
    context: str = ""

@router.post("/")
async def chat_endpoint(request: ChatRequest):
    """
    Global SOC Copilot chat endpoint.
    """
    try:
        response = await chat_with_copilot(request.query, request.context)
        
        if isinstance(response, dict) and "error" in response:
             raise HTTPException(status_code=500, detail=response["error"])
             
        return {"response": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
