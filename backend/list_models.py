import os
from dotenv import load_dotenv
import google.generativeai as genai

root_env = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(root_env, override=True)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("No API key found")
    exit(1)

genai.configure(api_key=api_key)

print("Available models:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
