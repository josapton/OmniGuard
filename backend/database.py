import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from elasticsearch import Elasticsearch
from supabase import create_client, Client

# PostgreSQL Setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://admin:adminpassword@localhost:5432/omniguard")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://127.0.0.1:9200")
es_client = Elasticsearch([ELASTICSEARCH_URL])

# Supabase Setup
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
supabase: Client | None = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
