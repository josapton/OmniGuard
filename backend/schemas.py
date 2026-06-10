from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class FindingBase(BaseModel):
    title: str
    description: str
    severity: str
    category: str
    details: Dict[str, Any]

class FindingCreate(FindingBase):
    pass

class Finding(FindingBase):
    id: UUID
    scan_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ScanBase(BaseModel):
    domain: str

class ScanCreate(ScanBase):
    pass

class Scan(ScanBase):
    id: UUID
    status: str
    risk_score: int
    urls_found: int
    vulnerabilities_found: int
    technologies: List[str]
    raw_crawl_data: Dict[str, Any]
    parsed_data: Dict[str, Any]
    enrichment: Dict[str, Any]
    ai_report: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    findings: List[Finding] = []

    class Config:
        from_attributes = True

class ScanRequest(BaseModel):
    domain: str
    use_ai_policy: bool = True
