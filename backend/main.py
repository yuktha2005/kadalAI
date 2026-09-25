from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import time
import json
import re
from app.services.ingestion import IngestionPipeline

load_dotenv()

app = FastAPI(title="Kadal AI Backend API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHROMA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")

def ensure_sample_data_ingested():
    from app.services.chroma_service import ChromaService
    try:
        chroma = ChromaService(persist_directory=CHROMA_DIR)
        if chroma.get_collection_count() == 0:
            print("ChromaDB is empty. Ingesting sample marine data...")
            perform_ingestion(chroma)
    except Exception as e:
        print(f"Startup ingestion check failed: {e}")

def perform_ingestion(chroma):
    from app.services.gemini_service import GeminiService
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
        return {"status": "no_data_found"}

    ids = []
    documents = []
    metadatas = []
    
    for rec in all_records:
        ids.append(rec.record_id)
        doc = f"{rec.data_type} record from {rec.water_body} on {rec.timestamp.date()}. Location: {rec.latitude}, {rec.longitude}."
        if hasattr(rec, 'scientific_name'):
            doc += f" Species: {rec.scientific_name}."
        documents.append(doc)
        
        meta = rec.model_dump()
        meta['timestamp'] = meta['timestamp'].isoformat()
        # CamelCase aliases for frontend compatibility
        meta['decimalLatitude'] = rec.latitude
        meta['decimalLongitude'] = rec.longitude
        meta['waterBody'] = rec.water_body
        meta['dataType'] = rec.data_type
        meta['eventDate'] = rec.timestamp.date().isoformat()
        
        if hasattr(rec, 'scientific_name'):
            meta['scientificName'] = rec.scientific_name
        if hasattr(rec, 'locality'):
            meta['locality'] = rec.locality or ''
        if hasattr(rec, 'depth_min'):
            meta['minimumDepthInMeters'] = rec.depth_min or 0.0
        if hasattr(rec, 'depth_max'):
            meta['maximumDepthInMeters'] = rec.depth_max or 0.0
        if hasattr(rec, 'sampling_protocol'):
            meta['samplingProtocol'] = rec.sampling_protocol or ''
        if hasattr(rec, 'identified_by'):
            meta['identifiedBy'] = rec.identified_by or ''
            
        metadatas.append(meta)

    chroma.add_records(ids, documents, metadatas, embeddings=None)
    return {"status": "ok", "total": chroma.get_collection_count()}

@app.on_event("startup")
async def startup_event():
    ensure_sample_data_ingested()

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
    top_k: int = 50,
    similarity_threshold: float = 0.5,
    data_types: str = None
):
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

        records = []
        if query and query.strip():
            try:
                gemini = GeminiService()
                query_emb = gemini.embed_text(query)
                results = chroma.search(query_embeddings=[query_emb], n_results=top_k, where=where_clause)
            except Exception:
                results = chroma.search(query_texts=[query], n_results=top_k, where=where_clause)
                
            candidates = len(results['ids'][0]) if results.get('ids') and results['ids'] else 0
            if candidates > 0:
                for idx in range(candidates):
                    records.append(results['metadatas'][0][idx])
        else:
            results = chroma.get_records(limit=top_k, where=where_clause)
            candidates = len(results['ids']) if results.get('ids') else 0
            if candidates > 0:
                for idx in range(candidates):
                    records.append(results['metadatas'][idx])

        took_ms = int((time.time() - start_time) * 1000)
        return {
            "query": query,
            "filters": {"water_body": water_body, "scientific_name": scientific_name},
            "candidates": len(records),
            "took_ms": took_ms,
            "results": records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_local_scientific_summary(question: str, records: list) -> dict:
    if not records:
        return {
            "answer": f"No specific marine records were found for '{question}'. Please try adjusting depth, location, or species filters.",
            "dashboard_summary": {
                "executive_summary": f"Query '{question}' yielded 0 matched records in the current database.",
                "key_findings": ["No records found matching query parameters."],
                "species_analysis": "No species data available.",
                "geographic_distribution": "No coordinate points recorded.",
                "depth_analysis": "No bathymetric depth data.",
                "temporal_patterns": "No time series records.",
                "research_insights": "Broaden search parameters or select additional water bodies."
            }
        }
        
    species_list = [r.get('scientificName') or r.get('scientific_name') for r in records if (r.get('scientificName') or r.get('scientific_name'))]
    unique_species = list(set([s for s in species_list if s and s != 'Unknown']))
    water_bodies = list(set([r.get('waterBody') or r.get('water_body') for r in records if (r.get('waterBody') or r.get('water_body'))]))
    
    depths = []
    for r in records:
        for k in ['minimumDepthInMeters', 'depth_min', 'maximumDepthInMeters', 'depth_max', 'depth_meters']:
            val = r.get(k)
            if val is not None and val != '':
                try:
                    fval = float(val)
                    if fval > 0:
                        depths.append(fval)
                except (ValueError, TypeError):
                    pass
            
    depth_str = f"{min(depths):.0f}m - {max(depths):.0f}m" if depths else "Surface to Epipelagic"
    species_preview = ", ".join(unique_species[:6]) if unique_species else "Various marine taxa"
    water_body_str = ", ".join(water_bodies[:3]) if water_bodies else "Indian Ocean Region"
    
    answer = (
        f"Based on {len(records)} retrieved oceanographic and biological records in the {water_body_str}, "
        f"{len(unique_species)} unique species were identified across depths ranging from {depth_str}. "
        f"Key documented species include {species_preview}."
    )
    
    key_findings = [
        f"Identified {len(unique_species)} unique species across {len(records)} matching occurrences.",
        f"Geographic coverage spanning {water_body_str} with depth profiles from {depth_str}.",
        f"Primary recorded taxa: {species_preview}."
    ]
    
    return {
        "answer": answer,
        "dashboard_summary": {
            "executive_summary": answer,
            "key_findings": key_findings,
            "species_analysis": f"Rich species diversity observed including {species_preview}. Total unique taxa: {len(unique_species)}.",
            "geographic_distribution": f"Spatial distribution centered across {water_body_str} oceanographic stations.",
            "depth_analysis": f"Observed depth stratification: {depth_str}, indicating bathymetric biodiversity zonation.",
            "temporal_patterns": "Records collected across multiple research cruises and sampling expeditions.",
            "research_insights": "Analysis supports continuous biodiversity monitoring and habitat preservation protocols."
        }
    }

@app.get("/query")
async def query_endpoint(
    question: str,
    water_body: str = None,
    scientific_name: str = None,
    min_depth: float = None,
    max_depth: float = None,
    top_k: int = 50,
    similarity_threshold: float = 0.5,
    data_types: str = None
):
    from app.services.gemini_service import GeminiService
    from app.services.chroma_service import ChromaService
    
    start_time = time.time()
    
    try:
        chroma = ChromaService(persist_directory=CHROMA_DIR)
        
        # Ingest if empty
        if chroma.get_collection_count() == 0:
            perform_ingestion(chroma)
        
        where_clause = {}
        if water_body:
            where_clause["water_body"] = water_body
        if scientific_name:
            where_clause["scientific_name"] = scientific_name
        if len(where_clause) == 0:
            where_clause = None

        records = []
        # 1. Search ChromaDB using Gemini embedding, falling back to local query_texts
        try:
            gemini = GeminiService()
            query_emb = gemini.embed_text(question)
            results = chroma.search(query_embeddings=[query_emb], n_results=top_k, where=where_clause)
        except Exception:
            results = chroma.search(query_texts=[question], n_results=top_k, where=where_clause)

        candidates = len(results['ids'][0]) if results.get('ids') and results['ids'] else 0
        if candidates > 0:
            for idx in range(candidates):
                records.append(results['metadatas'][0][idx])
        elif where_clause:
            # Try without where_clause if nothing matched
            results = chroma.search(query_texts=[question], n_results=top_k)
            candidates = len(results['ids'][0]) if results.get('ids') and results['ids'] else 0
            for idx in range(candidates):
                records.append(results['metadatas'][0][idx])

        # If still empty, get general records
        if len(records) == 0:
            results = chroma.get_records(limit=top_k)
            candidates = len(results['ids']) if results.get('ids') else 0
            for idx in range(candidates):
                records.append(results['metadatas'][idx])

        # 2. Generate answer with Gemini, falling back to local summary
        parsed_response = None
        try:
            gemini = GeminiService()
            prompt = f"""
            You are a marine data AI assistant. The user asked: "{question}"
            Based ONLY on the following retrieved records, answer the question and provide a JSON dashboard summary.
            Records:
            {json.dumps(records[:15])}
            
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
            
            cleaned_response = llm_response
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response[7:]
            elif cleaned_response.startswith('```'):
                cleaned_response = cleaned_response[3:]
            if cleaned_response.endswith('```'):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()
            
            parsed_response = json.loads(cleaned_response)
        except Exception as err:
            print(f"Gemini response generation unavailable ({err}), using dynamic local synthesis.")
            parsed_response = generate_local_scientific_summary(question, records)

        took_ms = int((time.time() - start_time) * 1000)
        return {
            "query": question,
            "answer": parsed_response.get("answer", "Analysis complete."),
            "relevant_occurrences": records,
            "sources_count": len(records),
            "took_ms": took_ms,
            "dashboard_summary": parsed_response.get("dashboard_summary", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/ingest/sample")
async def ingest_sample_data():
    """Endpoint to trigger ingestion of the public sample data."""
    from app.services.chroma_service import ChromaService
    try:
        chroma = ChromaService(persist_directory=CHROMA_DIR)
        result = perform_ingestion(chroma)
        return {
            "message": "Ingestion complete",
            "result": result,
            "collection_count": chroma.get_collection_count()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
