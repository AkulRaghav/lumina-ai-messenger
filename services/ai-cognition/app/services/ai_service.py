import json
import os
from typing import List
from openai import OpenAI
from ..core.vector_db import VectorEngine


class AIService:
    def __init__(self):
        self.vectordb = VectorEngine()
        self.llm = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def process_incoming_message(self, payload: dict):
        """Called by NATS subscriber to process new messages in the background"""
        self.vectordb.upsert_message(
            message_id=payload.get("id"),
            text=payload.get("content", ""),
            metadata=payload,
        )

    async def summarize_chat(self, messages: List[str]) -> str:
        """Generates a concise summary using prompt chaining"""
        system_prompt = (
            "You are an executive assistant. Read the following chat messages "
            "and provide a highly concise, 3-bullet point summary of what was "
            "decided or discussed. Use business-professional language. "
            "Do not use pronouns without context."
        )
        user_content = "\n".join([f"- {msg}" for msg in messages])

        response = self.llm.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content

    async def smart_reply(self, context_messages: List[str]) -> List[str]:
        """Generates 3 contextual reply suggestions"""
        system_prompt = (
            "Analyze the chat context and provide exactly 3 short, casual reply "
            "suggestions the user might want to send next. Return them as a JSON "
            'object with key "replies" containing an array of strings.'
        )
        context = "\n".join(context_messages[-5:])

        response = self.llm.chat.completions.create(
            model="gpt-3.5-turbo",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": context},
            ],
        )
        try:
            return json.loads(response.choices[0].message.content).get(
                "replies", []
            )
        except Exception:
            return ["Okay", "Thanks", "Got it"]

    async def semantic_search_chat(
        self, query: str, chat_id: str
    ) -> List[dict]:
        """Exposed to Flutter for AI Smart Search"""
        return self.vectordb.semantic_search(query=query, chat_id=chat_id)
