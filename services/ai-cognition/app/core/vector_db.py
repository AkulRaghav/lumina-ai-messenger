import os
import logging
from qdrant_client import QdrantClient
from qdrant_client.http import models
from openai import OpenAI
from typing import List, Optional

logger = logging.getLogger(__name__)


class VectorEngine:
    def __init__(self):
        self.qdrant = QdrantClient(
            host=os.getenv("QDRANT_HOST", "localhost"), port=6333
        )
        self.openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.collection_name = "lumina_knowledge_base"
        self.embedding_model = "text-embedding-3-small"
        self._init_collection()

    def _init_collection(self):
        """Create collection with optimized HNSW index for fast similarity search"""
        try:
            self.qdrant.get_collection(self.collection_name)
        except Exception:
            self.qdrant.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=1536,
                    distance=models.Distance.COSINE,
                    on_disk=False,
                    hnsw_config=models.HnswConfigDiff(m=16, ef_construct=100),
                ),
                optimizers_config=models.OptimizersConfigDiff(
                    indexing_threshold=20000
                ),
            )
            logger.info("Created Qdrant collection")

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding with error handling"""
        try:
            response = self.openai.embeddings.create(
                input=text, model=self.embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            return []

    def upsert_message(self, message_id: str, text: str, metadata: dict):
        """Insert or update a message vector"""
        if not text or len(text) < 3:
            return

        vector = self.embed_text(text)
        if not vector:
            return

        self.qdrant.upsert(
            collection_name=self.collection_name,
            points=[
                models.PointStruct(
                    id=message_id,
                    vector=vector,
                    payload={
                        "text": text,
                        "chat_id": metadata.get("chatId"),
                        "sender_id": metadata.get("senderId"),
                        "timestamp": metadata.get("timestamp"),
                    },
                )
            ],
        )

    def semantic_search(
        self, query: str, chat_id: Optional[str] = None, limit: int = 5
    ) -> List[dict]:
        """Find semantically similar messages"""
        vector = self.embed_text(query)
        if not vector:
            return []

        query_filter = None
        if chat_id:
            query_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="chat_id", match=models.MatchValue(value=chat_id)
                    )
                ]
            )

        hits = self.qdrant.query_points(
            collection_name=self.collection_name,
            query=vector,
            query_filter=query_filter,
            limit=limit,
            with_payload=True,
        ).points

        return [
            {"id": hit.id, "text": hit.payload["text"], "score": hit.score}
            for hit in hits
        ]
