from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
from database import es_client, get_db, supabase
from sqlalchemy.orm import Session
import models

router = APIRouter(
    prefix="/api/search",
    tags=["search"],
)

class SearchRequest(BaseModel):
    query: str
    index: Optional[str] = "scans,findings"
    filters: Optional[Dict[str, Any]] = None
    size: Optional[int] = 20
    from_: Optional[int] = 0

class SyncRequest(BaseModel):
    scanId: str

@router.post("/")
async def search_elastic(req: SearchRequest):
    """
    Query Elasticsearch for scans and findings.
    """
    if not es_client:
        raise HTTPException(status_code=500, detail="Elasticsearch client is not configured")

    try:
        # Build a simple multi_match query
        body = {
            "query": {
                "multi_match": {
                    "query": req.query,
                    "fields": ["domain^3", "title^2", "description", "category", "status"],
                    "fuzziness": "AUTO"
                }
            },
            "highlight": {
                "fields": {
                    "domain": {},
                    "title": {},
                    "description": {}
                }
            },
            "size": req.size,
            "from": req.from_
        }

        # Send to Elasticsearch
        res = es_client.search(index=req.index, body=body)

        # Format to match frontend ElasticSearchResponse interface
        hits = []
        for hit in res.get("hits", {}).get("hits", []):
            hits.append({
                "id": hit["_id"],
                "index": hit["_index"],
                "score": hit["_score"],
                "source": hit["_source"],
                "highlight": hit.get("highlight", {})
            })

        return {
            "total": res.get("hits", {}).get("total", {}).get("value", 0),
            "hits": hits,
            "aggregations": res.get("aggregations", {})
        }
    except Exception as e:
        print(f"[Search] Elasticsearch query failed: {e}")
        # Return empty result gracefully instead of 500 so UI doesn't crash
        return {"total": 0, "hits": [], "aggregations": {}}

@router.post("/sync")
async def sync_to_elastic(req: SyncRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Sync a specific scan and its findings to Elasticsearch.
    """
    if not es_client:
        return {"status": "skipped", "reason": "No Elasticsearch client"}

    # We will fetch data from Supabase/DB and push to ES
    # Do this in background to avoid blocking
    background_tasks.add_task(perform_sync, req.scanId, db)
    return {"status": "sync_started", "scan_id": req.scanId}


def perform_sync(scan_id: str, db: Session):
    try:
        if not supabase:
            print("[ES Sync] Supabase not configured")
            return
            
        # Fetch Scan
        scan_data = supabase.table("scans").select("*").eq("id", scan_id).single().execute()
        if not scan_data.data:
            return
            
        scan = scan_data.data
        
        # Index Scan
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
        
        # Fetch Findings
        findings_data = supabase.table("findings").select("*").eq("scan_id", scan_id).execute()
        if findings_data.data:
            for f in findings_data.data:
                es_client.index(
                    index="findings",
                    id=f["id"],
                    body={
                        "scan_id": scan_id,
                        "domain": scan["domain"],
                        "title": f["title"],
                        "description": f["description"],
                        "severity": f["severity"],
                        "category": f["category"],
                        "created_at": f["created_at"]
                    }
                )
                
        print(f"[ES Sync] Successfully synced scan {scan_id} to Elasticsearch.")
    except Exception as e:
        print(f"[ES Sync] Failed to sync to Elasticsearch: {e}")
