import os
import re
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

gemini_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", 
    google_api_key=GEMINI_API_KEY, 
    temperature=0,
    max_retries=0
) if GEMINI_API_KEY else None

groq_llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    groq_api_key=GROQ_API_KEY,
    temperature=0
) if GROQ_API_KEY else None

# We will handle fallbacks manually in a wrapper function
llm = gemini_llm or groq_llm  # Default LLM for non-critical paths if needed

async def invoke_llm_with_fallback(prompt_template, kwargs):
    """Manually invoke Gemini first, and fall back to Groq if it fails."""
    last_error = None
    
    # Try Gemini
    if gemini_llm:
        try:
            chain = prompt_template | gemini_llm
            return await chain.ainvoke(kwargs)
        except Exception as e:
            print(f"[LLM] Gemini failed: {e}. Falling back to Groq...")
            last_error = e
            
    # Try Groq (Fallback)
    if groq_llm:
        try:
            chain = prompt_template | groq_llm
            return await chain.ainvoke(kwargs)
        except Exception as e:
            print(f"[LLM] Groq failed: {e}.")
            last_error = e
            
    raise Exception(f"All LLMs failed. Last error: {last_error}")

def extract_json(response_text: str) -> dict:
    """Safely extract and parse JSON from a markdown string."""
    try:
        # First try parsing directly
        return json.loads(response_text)
    except json.JSONDecodeError:
        # Try to find JSON block using regex
        match = re.search(r'```(?:json)?(.*?)```', response_text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                pass
        
        # Fallback dictionary if all parsing fails
        return {"raw_analysis": response_text}

async def predict_threat_model(asset_data: dict, cve_data: list):
    """
    Predictive Threat Modeling: Analyze asset exposure and correlate with CVEs.
    """
    if not gemini_llm and not groq_llm:
        return {"error": "No LLM configured"}
        
    prompt = PromptTemplate.from_template(
        "You are an expert Security Analyst.\n"
        "Analyze the following asset data and its known CVEs to predict the most likely attack paths "
        "and calculate a Predictive Risk Score (0-100).\n\n"
        "Asset Data: {asset_data}\n"
        "CVE Data: {cve_data}\n\n"
        "Provide your analysis in JSON format with keys: 'risk_score', 'likely_attack_paths', 'rationale'."
    )
    
    try:
        response = await invoke_llm_with_fallback(prompt, {"asset_data": str(asset_data), "cve_data": str(cve_data)})
        return response.content
    except Exception as e:
        return {"error": str(e)}

async def generate_auto_remediation(vulnerability_details: dict, target_os: str = "linux"):
    """
    Auto-Remediation: Generate mitigation scripts (bash, iptables, ansible)
    """
    if not llm:
        return {"error": "GEMINI_API_KEY not configured"}
        
    prompt = PromptTemplate.from_template(
        "You are an expert DevSecOps Engineer.\n"
        "A critical vulnerability has been detected. Generate a mitigation script (e.g., bash with iptables, or ansible) "
        "to temporarily secure the system while a permanent patch is applied.\n\n"
        "Target OS: {target_os}\n"
        "Vulnerability Details: {vuln_details}\n\n"
        "Provide ONLY the script inside markdown code blocks, and a brief explanation."
    )
    
    try:
        response = await invoke_llm_with_fallback(prompt, {"vuln_details": str(vulnerability_details), "target_os": target_os})
        return response.content
    except Exception as e:
        return {"error": str(e)}

async def simulate_attack_path(topology_data: dict):
    """
    Theoretical Attack Path Simulation based on open ports, services, and network topology.
    """
    if not llm:
        return {"error": "GEMINI_API_KEY not configured"}
        
    prompt = PromptTemplate.from_template(
        "You are an expert Red Team Architect and Penetration Tester.\n"
        "Analyze the following network topology, open ports, and services. "
        "Simulate a theoretical attack path that a hacker might take to compromise the system. "
        "Describe the steps, the vulnerabilities they would exploit, and the ultimate impact.\n\n"
        "Topology Data: {topology_data}\n\n"
        "Provide your analysis in JSON format with keys: 'entry_point', 'lateral_movement', 'privilege_escalation', 'impact', 'mitigation_priority'."
    )
    
    try:
        response = await invoke_llm_with_fallback(prompt, {"topology_data": str(topology_data)})
        return response.content
    except Exception as e:
        return {"error": str(e)}

async def analyze_osint_data(raw_text: str):
    """
    Process raw text/leaks using Gemini NLP to extract Threat Intelligence Indicators.
    """
    if not llm:
        return {"error": "GEMINI_API_KEY not configured"}
        
    prompt = PromptTemplate.from_template(
        "You are an elite Cyber Threat Intelligence Analyst.\n"
        "Analyze the following raw text obtained from a Dark Web / OSINT source. "
        "Extract key Indicators of Compromise (IoCs), identify the threat actors involved, "
        "determine the targeted entities or industries, and summarize the overall threat level.\n\n"
        "Raw Data Snippet: {raw_text}\n\n"
        "Provide your analysis in JSON format with keys: 'threat_level' (Low/Medium/High/Critical), 'threat_actors' (list of strings), 'targeted_entities' (list of strings), 'extracted_iocs' (list of strings/IPs/Hashes), 'summary'."
    )
    
    try:
        response = await invoke_llm_with_fallback(prompt, {"raw_text": raw_text})
        return response.content
    except Exception as e:
        return {"error": str(e)}

async def chat_with_copilot(query: str, context: str = ""):
    """
    General purpose SOC Copilot chat using Gemini NLP.
    """
    if not llm:
        return {"error": "GEMINI_API_KEY not configured"}
        
    prompt = PromptTemplate.from_template(
        "You are an elite, autonomous AI SOC Copilot assisting a cybersecurity analyst.\n"
        "Answer the analyst's question based on your deep cybersecurity knowledge.\n"
        "If any context is provided, use it to ground your answer.\n\n"
        "Context: {context}\n"
        "Analyst Query: {query}\n\n"
        "Provide a concise, highly technical, and actionable response in markdown format."
    )
    
    try:
        response = await invoke_llm_with_fallback(prompt, {"query": query, "context": context})
        return response.content
    except Exception as e:
        return {"error": str(e)}
