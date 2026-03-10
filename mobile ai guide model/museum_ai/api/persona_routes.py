import os
from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv
from pymongo import MongoClient
from typing import Optional

from rag.classifier import is_related
from rag.persona_retriever import retrieve_persona_context
from rag.persona_generator import generate_persona_answer_with_memory
from utils.session_memory import (
    build_history_block,
    fetch_session_history,
    get_recent_interactions,
    is_repeated_question,
    save_chat_interaction,
)

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
mongo_client = MongoClient(MONGO_URI) if MONGO_URI else None
db = mongo_client[DB_NAME] if mongo_client and DB_NAME else None
KINGS_COLLECTION = "kings"

router = APIRouter(
    prefix="/persona",
    tags=["Persona Mode"]
)


class PersonaAskRequest(BaseModel):
    king_id: str
    question: str
    language: str  # "en" or "si"
    session_id: Optional[str] = None


@router.post("/ask")
async def ask_persona(req: PersonaAskRequest):
    """Ask a question to a historical persona. Persona data is fetched from MongoDB when needed."""
    # ----------------------------
    # Validate persona
    # ----------------------------
    if db is None:
        return {"answer": "Server not configured with MongoDB.", "rejected": True, "reason": "NO_DB"}

    language = (req.language or "en").lower().strip()

    king = db[KINGS_COLLECTION].find_one({"king_id": req.king_id})
    if not king:
        return {"answer": "Persona not found." if language == "en" else "චරිතය හමු නොවීය.", "rejected": True, "reason": "PERSONA_NOT_FOUND"}

    king_name_en = king.get("name_en")
    king_name_si = king.get("name_si")

    # period fields (new format) with fallbacks
    reign_period_en = king.get("period_en") or ""
    reign_period_si = king.get("period_si") or ""

    capital_en = king.get("capital_en")

    # choose name and period for the requested language
    king_name = king_name_si if language == "si" else king_name_en
    reign_period = reign_period_si if language == "si" else reign_period_en

    # ----------------------------
    # Session memory (optional)
    # ----------------------------
    session_id = (req.session_id or "").strip()
    interactions = []
    if session_id:
        interactions = fetch_session_history(
            session_id=session_id,
            reference_type="king",
            reference_id=req.king_id,
        )

    recent_interactions = get_recent_interactions(interactions)
    conversation_history = build_history_block(recent_interactions)
    repeated_question = is_repeated_question(req.question, recent_interactions)

    # ----------------------------
    # Classify question relevance
    # ----------------------------
    # Compact, language-aware field picker
    def _get_field(key: str) -> str:
        return (
            king.get(f"{key}_{language}")
            or king.get(key)
            or king.get(f"{key}_en")
            or king.get(f"{key}_si")
            or ""
        )

    p_name = _get_field("name") or ""
    p_capital = _get_field("capital")
    p_period = _get_field("period")
    p_bio = _get_field("biography") or ""

    persona_summary = f"{p_name}. Capital: {p_capital}. Reign: {p_period}. Biography: {p_bio}"
    classification = is_related(req.question, persona_summary)

    # ----------------------------
    # Handle greetings
    # ----------------------------
    if classification == "GREETING":
        greeting_msg = (
            f"Greetings, visitor. I am {king_name}, who ruled during {reign_period}. What would you like to know?"
            if language == "en"
            else f"ආයුබෝවන්, මම {king_name}. {reign_period} කාලයේ රජු වුනි. ඔබට මොන වගේ ප්‍රශ්නයක් තියේද?"
        )
        return {"answer": greeting_msg, "rejected": False, "reason": None}

    # ----------------------------
    # Retrieve context (RAG)
    # ----------------------------
    # Try semantic retrieval first
    context = retrieve_persona_context(king_id=req.king_id, question=req.question, language=language)

    # If vector retrieval fails, fall back to MongoDB fields
    # If retrieval empty, fall back to aiKnowlageBase or biography from Mongo
    if not context:
        if language == "si":
            context = king.get("aiKnowlageBase_si") or king.get("biography_si") or ""
        else:
            context = king.get("aiKnowlageBase_en") or king.get("biography_en") or ""

    if not context:
        return {"answer": "I don't have information about that." if language == "en" else "මට එම තොරතුරු නොමැත.", "rejected": False, "reason": "NO_CONTEXT_FOUND"}

    # ----------------------------
    # Generate final answer
    # ----------------------------
    answer = generate_persona_answer_with_memory(
        question=req.question,
        context=context,
        language=language,
        king_name=king_name,
        reign_period=reign_period,
        conversation_history=conversation_history,
        repeated_question=repeated_question,
    )

    if session_id:
        save_chat_interaction(
            session_id=session_id,
            question=req.question,
            reply=answer,
            reference_type="king",
            reference_id=req.king_id,
            language=language,
        )

    # Build persona metadata for response
    persona_meta = {
        "king_id": king.get("king_id") or king.get("_id"),
        "king_name": king_name_en,
        "reign_period": reign_period_en,
        "capital_city": capital_en,
    }

    # include persona object similar to README examples
    return {"answer": answer, "rejected": False, "reason": None, "persona": persona_meta}
