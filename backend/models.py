from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import datetime
from database import Base

class Scan(Base):
    __tablename__ = "scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain = Column(String, index=True)
    status = Column(String, default="crawling")
    risk_score = Column(Integer, default=0)
    urls_found = Column(Integer, default=0)
    vulnerabilities_found = Column(Integer, default=0)
    technologies = Column(JSON, default=list)
    raw_crawl_data = Column(JSON, default=dict)
    parsed_data = Column(JSON, default=dict)
    enrichment = Column(JSON, default=dict)
    ai_report = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id"))
    title = Column(String)
    description = Column(String)
    severity = Column(String)
    category = Column(String)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scan = relationship("Scan", back_populates="findings")


class DomainPolicy(Base):
    __tablename__ = "domain_policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain = Column(String, unique=True, index=True)
    policy_type = Column(String) # allow, block, review
    reason = Column(String)
    ai_evaluated = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ScanAuditLog(Base):
    __tablename__ = "scan_audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain = Column(String, index=True)
    action = Column(String)
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
