import asyncio
import os
from dotenv import load_dotenv

# Load env before importing ai_agents
root_env = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(root_env, override=True)

from integrations.ai_agents import chat_with_copilot

async def main():
    print("Testing chat_with_copilot...")
    response = await chat_with_copilot("What are the most recent critical CVEs?", "")
    print("RESPONSE:")
    print(response)

if __name__ == "__main__":
    asyncio.run(main())
