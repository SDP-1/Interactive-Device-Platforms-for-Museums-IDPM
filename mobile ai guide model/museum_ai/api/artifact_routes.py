import os
from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
from typing import Optional

from rag.classifier import is_related
from rag.artifact_retriever import retrieve_context
from rag.artifact_generator import generate_answer_with_memory
from utils.session_memory import (
    build_history_block,
    fetch_session_history,
    get_recent_interactions,
    is_repeated_question,
    save_chat_interaction,
)

router = APIRouter(
    prefix="/artifact",
    tags=["Artifact Mode"]
)

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME") or os.getenv("MONGO_DB")
mongo_client = MongoClient(MONGO_URI) if MONGO_URI else None
db = mongo_client[DB_NAME] if mongo_client and DB_NAME else None
ARTIFACTS_COLLECTION = os.getenv("MONGO_COLLECTION", "artifacts")


class AskRequest(BaseModel):
    artifact_id: str
    question: str
    language: str  # "en" or "si"
    session_id: Optional[str] = None


@router.post("/ask")
async def ask(req: AskRequest):
    """
    Ask a question about an artifact using AI Mode. Only the /ask endpoint is exposed.
    """
    try:
        # ----------------------------
        # Validate artifact
        # ----------------------------
        if db is None:
            return {"answer": "Server not configured with MongoDB.", "rejected": True, "reason": "NO_DB"}

        artifact_id = (req.artifact_id or "").strip()
        language = (req.language or "en").lower().strip()

        # Try to fetch the artifact from MongoDB
        coll = db[ARTIFACTS_COLLECTION]
        artifact = coll.find_one({"artifact_id": artifact_id}) or coll.find_one({"Artifact_id": artifact_id})

        if not artifact:
            # Optional: try _id lookup if artifact_id looks like ObjectId
            try:
                artifact = coll.find_one({"_id": ObjectId(artifact_id)})
            except Exception:
                artifact = None

        if not artifact:
            return {"answer": "I don't have information about that artifact.", "rejected": False, "reason": "NO_ARTIFACT"}

        # ----------------------------
        # Session memory (optional)
        # ----------------------------
        session_id = (req.session_id or "").strip()
        interactions = []
        if session_id:
            interactions = fetch_session_history(
                session_id=session_id,
                reference_type="artifact",
                reference_id=artifact_id,
            )

        recent_interactions = get_recent_interactions(interactions)
        conversation_history = build_history_block(recent_interactions)
        repeated_question = is_repeated_question(req.question, recent_interactions)

        # ----------------------------
        # Classify question relevance
        # ----------------------------
        # Build a compact, language-aware artifact summary for the classifier
        def _get_field(key: str) -> str:
            return (
                artifact.get(f"{key}_{language}")
                or artifact.get(key)
                or artifact.get(f"{key}_en")
                or artifact.get(f"{key}_si")
                or ""
            )

        title = _get_field("title") or ""
        origin = _get_field("origin") or ""
        year = artifact.get("year") or ""
        description = _get_field("description")

        artifact_summary = f"{title}. Origin: {origin}. Year: {year}. Description: {description}"

        # Use classifier to ensure the visitor's question is about the artifact
        # (returns YES / NO / GREETING)
        classification = is_related(req.question, artifact_summary)

        # ----------------------------
        # Handle greetings
        # ----------------------------
        if classification == "GREETING":
            greeting_msg = (
                "Hello! I'm your AI museum guide. Feel free to ask me about this artifact!"
                if language == "en"
                else "හායි! මම ඔබගේ කෘතිම බුද්ධි කෞතුකාගාර මාර්ගෝපදේශකයා. ඔබට මේ කලා නිර්මාණය පිළිබඳ මගේ අත්දැකීම් විමසන්න."
            )
            return {"answer": greeting_msg, "rejected": False, "reason": None}

        # ----------------------------
        # Reject out-of-scope questions
        # ----------------------------
        if classification != "YES":
            return {"answer": "I can only answer questions about the artifact you referenced." if language == "en" else "මම ඔබ සඳහන් කළ කලා නිර්මාණය පිළිබඳ ප්‍රශ්නවලට පමණක් පිළිතුරු දිය හැක.", "rejected": True, "reason": "OUT_OF_SCOPE"}

        # ----------------------------
        # Retrieve context (RAG)
        # ----------------------------
        # Fetch relevant document chunks from the vector DB for the artifact
        context = retrieve_context(artifact_id=artifact_id, question=req.question, language=language)

        # If vector retrieval fails, fall back to MongoDB fields
        if not context:
            if language == "si":
                context = (
                    artifact.get("aiKnowlageBase_si")
                    or artifact.get("description_si")
                    or artifact.get("culturalSignificance_si")
                    or ""
                )
            else:
                context = (
                    artifact.get("aiKnowlageBase_en")
                    or artifact.get("description_en")
                    or artifact.get("culturalSignificance_en")
                    or ""
                )

        if not context:
            return {"answer": "I don't have information about that artifact.", "rejected": False, "reason": "NO_CONTEXT_FOUND"}

        # ----------------------------
        # Generate final answer
        # ----------------------------
        # Use the language model with retrieved context to craft the response
        answer = generate_answer_with_memory(
            question=req.question,
            context=context,
            language=language,
            conversation_history=conversation_history,
            repeated_question=repeated_question,
        )

        if session_id:
            save_chat_interaction(
                session_id=session_id,
                question=req.question,
                reply=answer,
                reference_type="artifact",
                reference_id=artifact_id,
                language=language,
            )

        return {"answer": answer, "rejected": False, "reason": None}

    except Exception as e:
        # ----------------------------
        # Error handling
        # ----------------------------
        # Return a safe error response; include debug details only when DEBUG=true
        return {"answer": "An error occurred while processing your question.", "rejected": True, "reason": "INTERNAL_ERROR", "error": str(e) if os.getenv("DEBUG") == "true" else None}
