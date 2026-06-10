import asyncio
import os
from dotenv import load_dotenv

# Load env before importing ai_agents
root_env = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(root_env, override=True)

from integrations.ai_agents import groq_llm

async def main():
    print("Testing Groq API directly...")
    try:
        response = await groq_llm.ainvoke("Say hello!")
        print("Success!")
        print(response.content)
    except Exception as e:
        print("Groq Error!")
        print(type(e).__name__)
        print(e)

if __name__ == "__main__":
    asyncio.run(main())
