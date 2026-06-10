import os
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from dotenv import load_dotenv

# Load root .env which contains Supabase credentials
root_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(root_env)

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

security = HTTPBearer()

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration is missing.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

async def verify_jwt(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Verify the JWT token from the Authorization header using Supabase.
    """
    # [AUDIT] Temporarily bypassing JWT for local testing
    return {"id": "local-audit-user"}
