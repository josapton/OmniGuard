import os
from dotenv import load_dotenv

# Load env variables before any other imports to ensure modules like ai_agents.py get them
root_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(root_env, override=True)

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dependencies import verify_jwt
from contextlib import asynccontextmanager
from scheduler import start_scheduler, stop_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(title="OmniGuard API", version="1.0.0", lifespan=lifespan)

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes import scan, remediation, modeling, exposure, osint, chat, policy, search

# Apply JWT verification to all API routers
app.include_router(scan.router, dependencies=[Depends(verify_jwt)])
app.include_router(remediation.router, dependencies=[Depends(verify_jwt)])
app.include_router(modeling.router, dependencies=[Depends(verify_jwt)])
app.include_router(exposure.router, dependencies=[Depends(verify_jwt)])
app.include_router(osint.router, dependencies=[Depends(verify_jwt)])
app.include_router(chat.router, dependencies=[Depends(verify_jwt)])
app.include_router(policy.router, dependencies=[Depends(verify_jwt)])
app.include_router(search.router, dependencies=[Depends(verify_jwt)])

# Trigger hot reload for .env keys

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Autonomous Security Operations API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

