from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from app.services.ingestion import IngestionPipeline

load_dotenv()

app = FastAPI(title="Kadal AI Backend API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHROMA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Kadal AI Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check_root():
    from app.services.chroma_service import ChromaService
    try:
        chroma = ChromaService(persist_directory=CHROMA_DIR)
        count = chroma.get_collection_count()
        return {"status": "ok", "occurrences": count}
    except Exception as e:
        return {"status": "error", "error": str(e), "occurrences": 0}

@app.get("/search")
async def search(
    query: str = "",
    water_body: str = None,
    scientific_name: str = None,
    min_depth: float = None,
    max_depth: float = None,
    top_k: int = 10,
    similarity_threshold: float = 0.5,
    data_types: str = None
):
    import time
    from app.services.gemini_service import GeminiService
    from app.services.chroma_service import ChromaService
    
    start_time = time.time()
    
    try:
        chroma = ChromaService(persist_directory=CHROMA_DIR)
        
        where_clause = {}
        if water_body:
            where_clause["water_body"] = water_body
        if scientific_name:
            where_clause["scientific_name"] = scientific_name
        
        if data_types and data_types != "ALL":
            types_list = [t.strip() for t in data_types.split(',') if t.strip()]
            if len(types_list) == 1:
                where_clause["data_type"] = types_list[0]
            elif len(types_list) > 1:
                where_clause["data_type"] = {"$in": types_list}
        
        if len(where_clause) == 0:
            where_clause = None

        if query and query.strip():
            gemini = GeminiService()
            query_emb = gemini.embed_text(query)
            results = chroma.search([query_emb], n_results=top_k, where=where_clause)
            candidates = len(results['ids'][0]) if results.get('ids') and results['ids'] else 0
            records = []
            if candidates > 0:
                for idx in range(candidates):
                    meta = results['metadatas'][0][idx]
                    records.append(meta)
        else:
            results = chroma.get_records(limit=top_k, where=where_clause)
            candidates = len(results['ids']) if results.get('ids') else 0
            records = []
            if candidates > 0:
                for idx in range(candidates):
                    meta = results['metadatas'][idx]
                    records.append(meta)

        took_ms = int((time.time() - start_time) * 1000)
        return {
            "query": query,
            "filters": {"water_body": water_body, "scientific_name": scientific_name},
            "candidates": candidates,
            "took_ms": took_ms,
            "results": records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/query")
async def query_endpoint(
    question: str,
    water_body: str = None,
    scientific_name: str = None,
    min_depth: float = None,
    max_depth: float = None,
    top_k: int = 10,
    similarity_threshold: float = 0.5,
    data_types: str = None
):
    import time
    from app.services.gemini_service import GeminiService
    from app.services.chroma_service import ChromaService
    import json
    import re
    
    start_time = time.time()
    
    try:
        gemini = GeminiService()
        chroma = ChromaService(persist_directory=CHROMA_DIR)
        
        where_clause = {}
        if water_body:
            where_clause["water_body"] = water_body
        if scientific_name:
            where_clause["scientific_name"] = scientific_name
        if len(where_clause) == 0:
            where_clause = None

        query_emb = gemini.embed_text(question)
        results = chroma.search([query_emb], n_results=top_k, where=where_clause)

        candidates = len(results['ids'][0]) if results.get('ids') and results['ids'] else 0
        records = []
        if candidates > 0:
            for idx in range(candidates):
                meta = results['metadatas'][0][idx]
                records.append(meta)

        # Generate answer with Gemini
        prompt = f"""
        You are a marine data AI assistant. The user asked: "{question}"
        Based ONLY on the following retrieved records, answer the question and provide a JSON dashboard summary.
        Records:
        {json.dumps(records[:5])}
        
        Return ONLY valid JSON matching this schema:
        {{
            "answer": "Your detailed answer to the question",
            "dashboard_summary": {{
                "executive_summary": "string",
                "key_findings": ["string", "string"],
                "species_analysis": "string",
                "geographic_distribution": "string",
                "depth_analysis": "string",
                "temporal_patterns": "string",
                "research_insights": "string"
            }}
        }}
        """
        llm_response = gemini.generate_response(prompt).strip()
        
        # strip code block markers if present
        cleaned_response = llm_response
        if cleaned_response.startswith('```json'):
            cleaned_response = cleaned_response[7:]
        elif cleaned_response.startswith('```'):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        try:
            parsed_response = json.loads(cleaned_response)
        except json.JSONDecodeError:
            json_match = re.search(r'\{.*\}', cleaned_response, re.DOTALL)
            if json_match:
                parsed_response = json.loads(json_match.group(0))
            else:
                parsed_response = {"answer": cleaned_response, "dashboard_summary": {}}

        took_ms = int((time.time() - start_time) * 1000)
        return {
            "query": question,
            "answer": parsed_response.get("answer", "No answer generated."),
            "relevant_occurrences": records,
            "sources_count": len(records),
            "took_ms": took_ms,
            "dashboard_summary": parsed_response.get("dashboard_summary", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/ingest/sample")
async def ingest_sample_data():
    """Endpoint to trigger ingestion of the public sample data for testing."""
    from app.services.gemini_service import GeminiService
    from app.services.chroma_service import ChromaService
    from app.models.marine_data import MarineBaseRecord
    import json
    
    pipeline = IngestionPipeline()
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    occurrence_path = os.path.join(base_dir, "public", "data", "occurrence.txt")
    aws_path = os.path.join(base_dir, "public", "AWS sample data.txt")
    adcp_path = os.path.join(base_dir, "public", "ADCP-sample data.txt")
    ctd_path = os.path.join(base_dir, "CLMRE-MAIL-DATA", "Datasets", "stn298002.asc")
    
    all_records = []
    
    if os.path.exists(occurrence_path):
        all_records.extend(pipeline.ingest_occurrence_txt(occurrence_path))
    if os.path.exists(aws_path):
        all_records.extend(pipeline.ingest_aws_txt(aws_path))
    if os.path.exists(adcp_path):
        all_records.extend(pipeline.ingest_adcp_txt(adcp_path))
    if os.path.exists(ctd_path):
        all_records.extend(pipeline.ingest_ctd_asc(ctd_path))

    if not all_records:
        raise HTTPException(status_code=404, detail="No sample data found to ingest")

    report = pipeline.get_ingestion_report()
    
    try:
        gemini = GeminiService()
        chroma = ChromaService(persist_directory=CHROMA_DIR)
    except Exception as e:
        return {"message": "Failed to initialize services", "error": str(e), "report": report}
        
    ids = []
    documents = []
    metadatas = []
    
    for rec in all_records:
        ids.append(rec.record_id)
        # Create a textual representation for semantic search
        doc = f"{rec.data_type} record from {rec.water_body} on {rec.timestamp.date()}. Location: {rec.latitude}, {rec.longitude}."
        if hasattr(rec, 'scientific_name'):
            doc += f" Species: {rec.scientific_name}."
        documents.append(doc)
        
        # We need to make datetime serializable or format as string
        meta = rec.model_dump()
        meta['timestamp'] = meta['timestamp'].isoformat()
        metadatas.append(meta)

    # Embed using Gemini (batching required if large)
    try:
        embeddings = []
        batch_size = 100
        for i in range(0, len(documents), batch_size):
            batch_docs = documents[i:i+batch_size]
            emb = gemini.embed_texts(batch_docs)
            embeddings.extend(emb)
            
        chroma.add_records(ids, documents, metadatas, embeddings)
        report['chroma_db_total'] = chroma.get_collection_count()
    except Exception as e:
        return {"message": "Failed during embedding/db insertion", "error": str(e), "report": report}
        
    return {
        "message": "Ingestion and embedding complete",
        "report": report
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
