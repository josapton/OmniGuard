import os
import asyncio
import json
import socket
from datetime import datetime
from supabase import create_client, Client

from integrations.ai_agents import invoke_llm_with_fallback, extract_json

# ... (skipping some lines logically but need to replace the import and the function body)
from langchain_core.prompts import PromptTemplate

# Optional: Import shodan, fallback if not available
try:
    import shodan
    SHODAN_API_KEY = os.getenv("SHODAN_API_KEY")
    shodan_client = shodan.Shodan(SHODAN_API_KEY) if SHODAN_API_KEY else None
except ImportError:
    shodan_client = None

# Initialize Supabase Admin Client
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

async def generate_scan_report(domain: str, recon_data: dict):
    """Generate a comprehensive security report using Gemini/Groq"""
        
    prompt = PromptTemplate.from_template(
        "You are an elite Cybersecurity Analyst AI.\n"
        "Analyze the following reconnaissance data for the target domain/IP: {domain}\n"
        "Data: {recon_data}\n\n"
        "Provide your analysis in JSON format with exactly these keys:\n"
        "- 'risk_score' (integer 0-100)\n"
        "- 'report' (string, a detailed markdown security assessment report)\n"
        "- 'vulnerabilities' (list of objects, each with 'title', 'description', 'severity' (Low/Medium/High/Critical), 'category')\n"
    )
    
    try:
        response = await invoke_llm_with_fallback(prompt, {"domain": domain, "recon_data": json.dumps(recon_data)})
        return extract_json(response.content)
    except Exception as e:
        return {"error": str(e), "risk_score": 0, "findings": []}

def resolve_domain(domain: str) -> str:
    try:
        # Simple IP resolution
        return socket.gethostbyname(domain)
    except Exception:
        return domain

import aiohttp
from integrations.firecrawl_parser import scrape_with_firecrawl
from integrations.ai_agents import (
    predict_threat_model, 
    simulate_attack_path, 
    generate_auto_remediation, 
    analyze_osint_data
)

TECH_CPE_MAP = {
    'jQuery': {'vendor': 'jquery', 'product': 'jquery'},
    'WordPress': {'vendor': 'wordpress', 'product': 'wordpress'},
    'React': {'vendor': 'facebook', 'product': 'react'},
    'Angular': {'vendor': 'google', 'product': 'angular'},
    'Vue.js': {'vendor': 'vuejs', 'product': 'vue'},
    'Next.js': {'vendor': 'vercel', 'product': 'next.js'},
    'Bootstrap': {'vendor': 'getbootstrap', 'product': 'bootstrap'},
    'Drupal': {'vendor': 'drupal', 'product': 'drupal'},
    'PHP': {'vendor': 'php', 'product': 'php'},
    'Nginx': {'vendor': 'f5', 'product': 'nginx'},
    'ASP.NET': {'vendor': 'microsoft', 'product': 'asp.net'},
    'Shopify': {'vendor': 'shopify', 'product': 'shopify'},
    'HubSpot': {'vendor': 'hubspot', 'product': 'hubspot'},
    'Stripe': {'vendor': 'stripe', 'product': 'stripe'},
}

async def fetch_nvd_cves(technologies: list) -> list:
    all_cves = []
    async with aiohttp.ClientSession() as session:
        for tech in technologies:
            cpe_info = TECH_CPE_MAP.get(tech)
            if not cpe_info: continue
            
            keyword = f"{cpe_info['vendor']} {cpe_info['product']}"
            url = f"https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch={keyword}&resultsPerPage=5"
            
            try:
                async with session.get(url, headers={'User-Agent': 'OmniGuard/1.0'}) as resp:
                    if resp.status != 200: continue
                    data = await resp.json()
                    for v in data.get("vulnerabilities", []):
                        cve = v.get("cve", {})
                        cvss = cve.get("metrics", {}).get("cvssMetricV31", [{}])[0].get("cvssData", {})
                        if not cvss:
                            cvss = cve.get("metrics", {}).get("cvssMetricV30", [{}])[0].get("cvssData", {})
                        
                        all_cves.append({
                            "title": cve.get("id", "Unknown CVE"),
                            "description": next((d.get("value") for d in cve.get("descriptions", []) if d.get("lang") == "en"), "No description"),
                            "severity": cvss.get("baseSeverity", "Medium").capitalize(),
                            "category": f"CVE ({tech})",
                            "cvss_score": cvss.get("baseScore", 5.0),
                            "details": cve
                        })
            except Exception as e:
                print(f"[NVD] Error fetching {tech}: {e}")
            
            await asyncio.sleep(6.5) # Respect NVD 5 req / 30s rate limit
    
    # Sort by cvss score and cap at 20
    all_cves.sort(key=lambda x: x.get("cvss_score", 0), reverse=True)
    return all_cves[:20]

async def run_scan_pipeline(scan_id: str, domain: str):
    """
    Background Task: 
    1. Reconnaissance (Shodan + Firecrawl)
    2. AI Synthesis (Gemini)
    3. Sync to Supabase
    """
    print(f"[Scanner] Starting scan pipeline for {domain} (ID: {scan_id})")
    
    # 1. Reconnaissance: IP & Shodan
    recon_data = {"domain": domain, "ip": None, "shodan_data": None, "ports": []}
    ip_addr = resolve_domain(domain)
    recon_data["ip"] = ip_addr
    
    if shodan_client and ip_addr:
        try:
            host_info = await asyncio.to_thread(shodan_client.host, ip_addr)
            recon_data["shodan_data"] = {
                "os": host_info.get("os", "Unknown"),
                "ports": host_info.get("ports", []),
                "vulns": host_info.get("vulns", []),
                "hostnames": host_info.get("hostnames", [])
            }
            recon_data["ports"] = host_info.get("ports", [])
        except Exception as e:
            print(f"[Scanner] Shodan error: {e}")
            recon_data["shodan_error"] = str(e)

    # 1b. Reconnaissance: Firecrawl
    print(f"[Scanner] Scraping {domain} with Firecrawl...")
    target_url = domain if domain.startswith('http') else f"https://{domain}"
    fc_result = await scrape_with_firecrawl(target_url)
    
    # Merge findings and technologies
    technologies = fc_result.get("technologies", [])
    rule_findings = fc_result.get("findings", [])
    urls_found = fc_result.get("urls_found", 0)
    
    # 1c. [NEW] NVD CVE Lookup
    print(f"[Scanner] Fetching NVD CVEs for detected technologies: {technologies}...")
    cve_findings = await fetch_nvd_cves(technologies)
    rule_findings.extend(cve_findings)
    
    # Provide the scraped data to the AI
    recon_data["firecrawl_parsed"] = fc_result.get("parsed_data", {})
    recon_data["technologies_detected"] = technologies
    recon_data["rule_based_findings"] = rule_findings

    # 2. AI Synthesis
    print(f"[Scanner] Generating AI Report for {domain}...")
    ai_result = await generate_scan_report(domain, recon_data)
    
    ai_risk_score = ai_result.get("risk_score", 0)
    ai_report_markdown = ai_result.get("report", "No report generated.")
    ai_vulnerabilities = ai_result.get("vulnerabilities", [])
    
    if "error" in ai_result:
        status = "failed"
        ai_report_markdown = f"Scan failed: {ai_result['error']}"
        error_msg = ai_result['error']
    else:
        status = "completed"
        error_msg = None

    # Merge Rule-based findings with AI vulnerabilities
    all_findings = []
    for vuln in ai_vulnerabilities:
        all_findings.append({
            "title": vuln.get("title", "AI Finding"),
            "description": vuln.get("description", ""),
            "severity": vuln.get("severity", "Medium").capitalize(),
            "category": vuln.get("category", "AI Analysis"),
            "details": vuln
        })
    all_findings.extend(rule_findings)

    # Calculate final risk score
    def get_score(sev):
        if sev == "Critical": return 25
        if sev == "High": return 15
        if sev == "Medium": return 8
        if sev == "Low": return 3
        return 1
    
    calculated_risk = sum(get_score(f.get("severity", "Low")) for f in all_findings)
    final_risk_score = min(100, max(ai_risk_score, calculated_risk))

    # ---------------------------------------------------------
    # 3. [NEW] GRAND UNIFICATION: Run all AI Agents Parallelly
    # ---------------------------------------------------------
    print(f"[Scanner] Running Grand Unification AI Agents for {domain}...")
    
    asset_data_for_tm = {"technologies": technologies, "ip": ip_addr, "ports": recon_data["ports"]}
    topology_data_for_em = {"ip": ip_addr, "domain": domain, "ports": recon_data["ports"], "vulnerabilities": all_findings}
    raw_text_for_osint = json.dumps(recon_data["firecrawl_parsed"])[:10000] # Cap length
    
    top_vuln = None
    for sev in ["Critical", "High", "Medium"]:
        for f in all_findings:
            if f.get("severity", "") == sev:
                top_vuln = f
                break
        if top_vuln: break
        
    try:
        # Run agents concurrently
        tm_task = asyncio.create_task(predict_threat_model(asset_data_for_tm, cve_findings))
        em_task = asyncio.create_task(simulate_attack_path(topology_data_for_em))
        osint_task = asyncio.create_task(analyze_osint_data(raw_text_for_osint))
        
        rem_task = None
        if top_vuln:
            rem_task = asyncio.create_task(generate_auto_remediation(top_vuln, "linux"))
            
        tm_result = await tm_task
        em_result = await em_task
        osint_result = await osint_task
        rem_result = await rem_task if rem_task else '{"script": "No critical vulnerabilities to remediate."}'
        
        import re
        def parse_ai_json(text):
            if isinstance(text, dict): return text
            try:
                # Remove markdown formatting if present
                clean_text = re.sub(r'```json\s*', '', text)
                clean_text = re.sub(r'```\s*', '', clean_text)
                return json.loads(clean_text.strip())
            except Exception:
                return {"raw_text": text}

        enrichment_data = {
            "threat_model": parse_ai_json(tm_result),
            "attack_paths": parse_ai_json(em_result),
            "osint": parse_ai_json(osint_result),
            "remediation": parse_ai_json(rem_result)
        }
    except Exception as ai_e:
        print(f"[Scanner] Grand Unification AI Error: {ai_e}")
        enrichment_data = {"error": str(ai_e)}

    # 4. Sync to Supabase
    if not supabase:
        print("[Scanner] Supabase client not configured! Cannot save results.")
        return

    print(f"[Scanner] Saving results to Supabase for scan_id: {scan_id}...")
    
    try:
        update_data = {
            "status": status,
            "risk_score": final_risk_score,
            "urls_found": urls_found,
            "vulnerabilities_found": len(all_findings),
            "technologies": technologies if technologies else ((recon_data.get("shodan_data") or {}).get("os", [])),
            "raw_crawl_data": fc_result.get("raw_crawl_data", recon_data),
            "parsed_data": fc_result.get("parsed_data", ai_result),
            "enrichment": enrichment_data,  # Insert the Grand Unification data
            "ai_report": ai_report_markdown,
            "updated_at": datetime.utcnow().isoformat()
        }
        if error_msg:
            update_data["error_message"] = error_msg

        supabase.table("scans").update(update_data).eq("id", scan_id).execute()
        
        # Insert Findings
        for vuln in all_findings:
            supabase.table("findings").insert({
                "scan_id": scan_id,
                "title": vuln.get("title", "Unknown Vulnerability"),
                "description": vuln.get("description", ""),
                "severity": vuln.get("severity", "Medium"),
                "category": vuln.get("category", "Network"),
                "details": vuln.get("details", {})
            }).execute()
            
        print(f"[Scanner] Scan {scan_id} completed successfully!")
        
        # Trigger Elasticsearch Sync
        try:
            from routes.search import perform_sync
            # Run in a separate thread so we don't block
            import threading
            threading.Thread(target=perform_sync, args=(scan_id, None)).start()
        except Exception as es_e:
            print(f"[Scanner] ES Sync trigger failed: {es_e}")
            
        # Trigger Discord Alert if risk is high
        try:
            from integrations.notifications import send_discord_alert
            critical_count = sum(1 for f in all_findings if f.get("severity", "").lower() == "critical")
            high_count = sum(1 for f in all_findings if f.get("severity", "").lower() == "high")
            if final_risk_score >= 50 or critical_count > 0 or high_count > 0:
                # Run async alert without blocking
                asyncio.create_task(send_discord_alert(domain, scan_id, final_risk_score, critical_count, high_count))
        except Exception as alert_e:
            print(f"[Scanner] Alert trigger failed: {alert_e}")
            
            
    except Exception as e:
        print(f"[Scanner] Error saving to Supabase: {e}")
        try:
            supabase.table("scans").update({
                "status": "failed",
                "error_message": str(e)
            }).eq("id", scan_id).execute()
        except:
            pass
