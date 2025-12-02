import os
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from rag.classifier import is_related
from rag.retriever import retrieve_context
from rag.generator import generate_answer

# Load artifacts CSV
DATA_PATH = "data/artifacts.csv"
if os.path.exists(DATA_PATH):
    try:
        df = pd.read_csv(DATA_PATH, encoding='utf-8-sig')
    except:
        df = pd.read_csv(DATA_PATH, encoding='latin-1')
else:
    df = pd.DataFrame()

router = APIRouter(
    prefix="/artifact",
    tags=["Artifact Mode"]
)


class AskRequest(BaseModel):
    artifact_id: str
    question: str
    language: str  # "en" or "si"


@router.get("/{artifact_id}")
async def get_artifact_info(artifact_id: str, language: str = "en"):
    """
    Get artifact information when QR code is scanned.
    Returns basic artifact details in the requested language.
    """
    if df.empty:
        raise HTTPException(status_code=404, detail="No artifacts loaded")
    
    if artifact_id not in df["Artifact_id"].astype(str).values:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    row = df[df["Artifact_id"] == artifact_id].iloc[0]
    
    # Select language-specific fields
    if language == "si":
        return {
            "artifact_id": str(row["Artifact_id"]),
            "name": row.get("Name", ""),
            "period": row.get("Period", ""),
            "origin": row.get("origin", ""),
            "description": row.get("Description_si", ""),
            "facts": row.get("facts_si", ""),
            "faq": row.get("faq_si", "")
        }
    else:
        return {
            "artifact_id": str(row["Artifact_id"]),
            "name": row.get("Name", ""),
            "period": row.get("Period", ""),
            "origin": row.get("origin", ""),
            "description": row.get("Description_en", ""),
            "facts": row.get("facts_en", ""),
            "faq": row.get("faq_en", "")
        }


@router.post("/ask")
async def ask(req: AskRequest):
    """
    Ask a question about an artifact using AI Mode.
    The system will:
    1. Validate the artifact exists
    2. Classify if the question is related to the artifact
    3. Retrieve relevant context using RAG
    4. Generate an answer using GPT-4o-mini
    """
    try:
        # ----------------------------
        # Validate artifact
        # ----------------------------
        if df.empty or req.artifact_id not in df["Artifact_id"].astype(str).values:
            return {
                "answer": "Artifact not found." if req.language == "en" else "කලා නිර්මාණය හමු නොවීය.",
                "rejected": True,
                "reason": "ARTIFACT_NOT_FOUND"
            }

        # Load row
        row = df[df["Artifact_id"] == req.artifact_id].iloc[0]

        # Short artifact summary for classifier
        summary = f"{row['Name']} - {row['Period']} - {row['origin']}"

        # ----------------------------
        # Step 1: Classification
        # ----------------------------
        classification = is_related(req.question, summary)
        
        # Handle greetings with friendly responses
        if classification == "GREETING":
            artifact_name = row['Name']
            greeting_msg = (
                f"Hello! I'm your AI museum guide. You're viewing {artifact_name}. Feel free to ask me anything about this artifact!"
                if req.language == "en"
                else f"හායි! මම ඔබගේ කෘතිම බුද්ධි කෞතුකාගාර මාර්ගෝපදේශකයා. ඔබ දැන් {artifact_name} දෙස බලයි. මේ කලා නිර්මාණය පිළිබඳ ඕනෑම දෙයක් මගෙන් විමසන්න!"
            )
            return {
                "answer": greeting_msg,
                "rejected": False,
                "reason": None
            }
        
        if classification != "YES":
            rejection_msg = (
                "I can only answer questions about the artifact you are viewing."
                if req.language == "en"
                else "මම ඔබ දැක ඇති කලා නිර්මාණය පිළිබඳ ප්‍රශ්නවලට පමණක් පිළිතුරු දිය හැකිය."
            )
            return {
                "answer": rejection_msg,
                "rejected": True,
                "reason": "OUT_OF_SCOPE"
            }

        # ----------------------------
        # Step 2: Retrieval (RAG)
        # ----------------------------
        context = retrieve_context(
            artifact_id=req.artifact_id,
            question=req.question,
            language=req.language
        )

        # If DB empty or context empty
        if not context:
            no_info_msg = (
                "I don't know that information."
                if req.language == "en"
                else "මට එම තොරතුරු නොදනී."
            )
            return {
                "answer": no_info_msg,
                "rejected": False,
                "reason": "NO_CONTEXT_FOUND"
            }

        # ----------------------------
        # Step 3: LLM Answer
        # ----------------------------
        answer = generate_answer(req.question, context, req.language)

        return {
            "answer": answer,
            "rejected": False,
            "reason": None
        }
    
    except Exception as e:
        error_msg = (
            "An error occurred while processing your question."
            if req.language == "en"
            else "ඔබගේ ප්‍රශ්නය සැකසීමේදී දෝෂයක් ඇති විය."
        )
        return {
            "answer": error_msg,
            "rejected": True,
            "reason": "INTERNAL_ERROR",
            "error": str(e) if os.getenv("DEBUG") == "true" else None
        }


def get_artifacts_count():
    """Helper function to get count of loaded artifacts."""
    return len(df) if not df.empty else 0
