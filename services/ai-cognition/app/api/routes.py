from fastapi import APIRouter, BackgroundTasks
from ..services.ai_service import AIService
from ..models.schemas import SummarizeRequest, SearchRequest

router = APIRouter()
ai_service = AIService()


@router.post("/nats-webhook")
async def nats_webhook(payload: dict, background_tasks: BackgroundTasks):
    """NATS JetStream pushes messages here asynchronously"""
    background_tasks.add_task(ai_service.process_incoming_message, payload)
    return {"status": "queued_for_processing"}


@router.post("/summarize")
async def summarize_chat(request: SummarizeRequest):
    summary = await ai_service.summarize_chat(request.messages)
    return {"summary": summary}


@router.post("/smart-replies")
async def get_smart_replies(request: SummarizeRequest):
    replies = await ai_service.smart_reply(request.messages)
    return {"replies": replies}


@router.post("/search")
async def semantic_search(request: SearchRequest):
    results = await ai_service.semantic_search_chat(
        query=request.query, chat_id=request.chat_id
    )
    return {"results": results}
