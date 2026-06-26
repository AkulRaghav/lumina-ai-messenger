from pydantic import BaseModel
from typing import List, Optional


class SummarizeRequest(BaseModel):
    messages: List[str]


class SearchRequest(BaseModel):
    query: str
    chat_id: Optional[str] = None
    limit: int = 5
