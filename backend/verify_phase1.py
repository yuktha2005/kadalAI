import os
import sys
import json
import traceback

print("--- Phase 1 Verification ---")
print("1. Testing Imports...")
try:
    import fastapi
    import pandas as pd
    import chromadb
    from pydantic import BaseModel
    import psycopg2
    import sqlalchemy
    from google import genai
    from langchain_core.messages import HumanMessage
    print("ALL IMPORTS SUCCESSFUL.")
except Exception as e:
    print(f"IMPORT ERROR: {e}")
    sys.exit(1)

print("\n2. Testing Pydantic Models & Unified Schema...")
try:
    from app.models.marine_data import OccurrenceRecord, CTDRecord
    from datetime import datetime
    
    # Test valid occurrence
    valid = OccurrenceRecord(
        record_id="test_001",
        dataset_source="verification",
        data_type="OCCURRENCE",
        timestamp=datetime.now(),
        latitude=45.0,
        longitude=90.0,
        water_body="Indian Ocean",
        scientific_name="Test Species",
        locality=None, depth_min=None, depth_max=None, sampling_protocol=None, identified_by=None
    )
    print("Pydantic Validation PASS")
except Exception as e:
    print(f"PYDANTIC ERROR: {e}")

print("\n3. Testing Ingestion Pipeline...")
try:
    from app.services.ingestion import IngestionPipeline
    pipeline = IngestionPipeline()
    # Path depends on where script is run. Assuming d:/Kadal AI-main/backend
    target_path = "../public/data/occurrence.txt"
    if not os.path.exists(target_path):
        target_path = "d:/Kadal AI-main/public/data/occurrence.txt"
        
    records = pipeline.ingest_occurrence_txt(target_path)
    report = pipeline.get_ingestion_report()
    
    print("\nINGESTION REPORT:")
    print(json.dumps(report, indent=2))
    if records:
        print(f"First record sample: {records[0].model_dump_json(indent=2)}")
except Exception as e:
    print(f"INGESTION ERROR: {e}")
    traceback.print_exc()

print("\n4. Testing Local ChromaDB Initialization...")
try:
    import chromadb
    client = chromadb.PersistentClient(path="./chroma_data")
    col = client.get_or_create_collection("marine_data_test")
    print("ChromaDB Initialization PASS")
except Exception as e:
    print(f"CHROMADB ERROR: {e}")

print("\n5. Testing PostgreSQL Connectivity...")
print("Psycopg2 driver loaded successfully. Active connection requires Supabase credentials (Phase 2).")
