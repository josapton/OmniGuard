import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from elasticsearch import Elasticsearch
from supabase import create_client, Client

# Hardcoded or Env Config
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://admin:adminpassword@localhost:5432/omniguard")
ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://127.0.0.1:9200")
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")

es_client = Elasticsearch([ELASTICSEARCH_URL])
supabase: Client | None = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

def sync_all():
    if not supabase:
        print("Supabase config missing!")
        return

    print("Fetching all scans from Supabase...")
    scans_res = supabase.table("scans").select("*").execute()
    scans = scans_res.data or []
    
    print(f"Found {len(scans)} scans. Syncing to Elasticsearch...")
    for scan in scans:
        try:
            es_client.index(
                index="scans",
                id=scan["id"],
                body={
                    "domain": scan["domain"],
                    "status": scan["status"],
                    "risk_score": scan["risk_score"],
                    "urls_found": scan["urls_found"],
                    "vulnerabilities_found": scan["vulnerabilities_found"],
                    "created_at": scan["created_at"],
                    "ai_report": scan.get("ai_report", "")
                }
            )
            print(f"Synced scan {scan['id']}")
            
            # Fetch findings
            findings_res = supabase.table("findings").select("*").eq("scan_id", scan["id"]).execute()
            findings = findings_res.data or []
            for f in findings:
                es_client.index(
                    index="findings",
                    id=f["id"],
                    body={
                        "scan_id": scan["id"],
                        "domain": scan["domain"],
                        "title": f["title"],
                        "description": f["description"],
                        "severity": f["severity"],
                        "category": f["category"],
                        "created_at": f["created_at"]
                    }
                )
        except Exception as e:
            print(f"Failed to sync scan {scan['id']}: {e}")

if __name__ == "__main__":
    sync_all()
    print("Done!")
