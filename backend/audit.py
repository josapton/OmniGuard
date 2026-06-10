import asyncio
import os
from dotenv import load_dotenv

# Load env
root_env = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(root_env, override=True)

from integrations.ai_agents import chat_with_copilot
from integrations.scanner import supabase, shodan_client

async def main():
    print("=== OMNIGUARD SYSTEM AUDIT ===")
    
    print("\n1. Testing Gemini AI API (gemini-2.0-flash)...")
    try:
        response = await chat_with_copilot("Say 'OmniGuard AI is Online'", "")
        if "error" in response and isinstance(response, dict):
            print("[FAILED] Gemini API Failed:", response["error"])
        else:
            print("[OK] Gemini API is Operational.")
            print(f"   Response: {response}")
    except Exception as e:
        print(f"[FAILED] Gemini API Failed: {e}")

    print("\n2. Testing Supabase Database Connection...")
    if not supabase:
        print("[FAILED] Supabase Client is NOT configured (Check VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).")
    else:
        try:
            res = supabase.table("scans").select("id").limit(1).execute()
            print("[OK] Supabase Database is Operational.")
            print(f"   Found {len(res.data)} existing scans.")
        except Exception as e:
            print(f"[FAILED] Supabase API Failed: {e}")

    print("\n3. Testing Shodan Reconnaissance API...")
    if not shodan_client:
        print("[FAILED] Shodan API is NOT configured (Check SHODAN_API_KEY).")
    else:
        try:
            info = shodan_client.info()
            print("[OK] Shodan API is Operational.")
            print(f"   Scan Credits Available: {info.get('scan_credits')}")
        except Exception as e:
            print(f"[FAILED] Shodan API Failed: {e}")

    print("\n==============================")

if __name__ == "__main__":
    asyncio.run(main())
