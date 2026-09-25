import chromadb
from chromadb.config import Settings
import os
import json
from typing import List, Dict, Any

class ChromaService:
    def __init__(self, persist_directory: str = "chroma_db"):
        self.persist_directory = persist_directory
        # Ensure the directory exists
        os.makedirs(self.persist_directory, exist_ok=True)
        
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        
        # Get or create the collection
        self.collection_name = "marine_data"
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def add_records(self, ids: List[str], documents: List[str], metadatas: List[Dict[str, Any]], embeddings: List[List[float]]):
        # Add in batches to avoid overwhelming the API or DB
        batch_size = 100
        for i in range(0, len(ids), batch_size):
            end_idx = min(i + batch_size, len(ids))
            batch_ids = ids[i:end_idx]
            batch_documents = documents[i:end_idx]
            batch_metadatas = metadatas[i:end_idx]
            batch_embeddings = embeddings[i:end_idx]
            
            # stringify non-primitive metadata
            for meta in batch_metadatas:
                for k, v in meta.items():
                    if v is None:
                        meta[k] = ""
                    elif isinstance(v, (dict, list)):
                        meta[k] = json.dumps(v)
            
            self.collection.add(
                ids=batch_ids,
                documents=batch_documents,
                metadatas=batch_metadatas,
                embeddings=batch_embeddings
            )

    def search(self, query_embeddings: List[List[float]], n_results: int = 10, where: Dict = None) -> Dict[str, Any]:
        return self.collection.query(
            query_embeddings=query_embeddings,
            n_results=n_results,
            where=where
        )

    def get_records(self, limit: int = 10, where: Dict = None) -> Dict[str, Any]:
        kwargs = {"limit": limit}
        if where:
            kwargs["where"] = where
        return self.collection.get(**kwargs)

    def get_collection_count(self) -> int:
        return self.collection.count()
