from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

import schemas
import models
from database import get_db

router = APIRouter(
    prefix="/api/scans",
    tags=["scans"],
    responses={404: {"description": "Not found"}},
)

from pydantic import BaseModel
from integrations.scanner import run_scan_pipeline

class AnalyzeRequest(BaseModel):
    scan_id: str
    domain: str

@router.post("/analyze")
def trigger_analysis(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    # Fire and forget the background task
    background_tasks.add_task(run_scan_pipeline, req.scan_id, req.domain)
    return {"status": "started", "scan_id": req.scan_id}

from datetime import datetime, timedelta

@router.get("/quota")
def get_user_quota(db: Session = Depends(get_db)):
    # Since the app is single-tenant for now, count all scans in the last 24 hours
    twenty_four_hours_ago = datetime.utcnow() - timedelta(days=1)
    scans_today = db.query(models.Scan).filter(models.Scan.created_at >= twenty_four_hours_ago).count()
    return {"scansToday": scans_today, "dailyLimit": 10}

@router.post("/", response_model=schemas.Scan)
def create_scan(scan_req: schemas.ScanRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Legacy endpoint (SQLAlchemy)
    db_scan = models.Scan(domain=scan_req.domain, status="crawling")
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    return db_scan

@router.get("/", response_model=List[schemas.Scan])
def read_scans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    scans = db.query(models.Scan).offset(skip).limit(limit).all()
    return scans

@router.get("/{scan_id}", response_model=schemas.Scan)
def read_scan(scan_id: UUID, db: Session = Depends(get_db)):
    db_scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if db_scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")
    return db_scan

from integrations.ai_agents import invoke_llm_with_fallback
from langchain_core.prompts import PromptTemplate

@router.post("/{scan_id}/report")
async def generate_pdf_report(scan_id: UUID, db: Session = Depends(get_db)):
    db_scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if db_scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    prompt = PromptTemplate.from_template(
        "You are an expert Cybersecurity Analyst.\n"
        "Create a formal, detailed Executive Summary and Technical Report in Markdown format based on the following scan data for {domain}.\n"
        "Include an overview of the attack surface, risk score analysis, and detailed remediation steps for the findings.\n\n"
        "Data:\n"
        "Risk Score: {risk_score}\n"
        "URLs Found: {urls_found}\n"
        "Vulnerabilities Found: {vulnerabilities_found}\n"
        "Technologies: {technologies}\n"
        "AI Report: {ai_report}\n"
    )
    
    try:
        response = await invoke_llm_with_fallback(prompt, {
            "domain": db_scan.domain,
            "risk_score": db_scan.risk_score,
            "urls_found": db_scan.urls_found,
            "vulnerabilities_found": db_scan.vulnerabilities_found,
            "technologies": db_scan.technologies,
            "ai_report": db_scan.ai_report
        })
        return {"report": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
