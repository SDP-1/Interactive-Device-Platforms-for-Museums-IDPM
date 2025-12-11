import os
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from rag.persona_retriever import retrieve_persona_context, get_persona_info, list_available_personas
from rag.persona_generator import generate_persona_answer

# Load personas CSV
PERSONAS_PATH = "data/Ancient_Kings.csv"
if os.path.exists(PERSONAS_PATH):
    try:
        personas_df = pd.read_csv(PERSONAS_PATH, encoding='utf-8-sig')
    except:
        try:
            personas_df = pd.read_csv(PERSONAS_PATH, encoding='latin-1')
        except:
            personas_df = pd.DataFrame()
else:
    personas_df = pd.DataFrame()

router = APIRouter(
    prefix="/persona",
    tags=["Persona Mode"]
)


class PersonaAskRequest(BaseModel):
    king_id: str
    question: str
    language: str  # "en" or "si"


@router.get("s")
async def get_personas(language: str = "en"):
    """
    Get list of available historical personas (kings).
    Returns basic information about each persona.
    """
    try:
        # Try to get from vector database first
        personas = list_available_personas(language)
        
        # If vector DB is empty or fails, fall back to CSV
        if not personas and not personas_df.empty:
            personas = []
            for _, row in personas_df.iterrows():
                personas.append({
                    "king_id": str(row["king_id"]),
                    "king_name": row["king_name"],
                    "reign_period": row["reign_period"],
                    "capital_city": row["capital_city"]
                })
        
        return {
            "personas": personas,
            "count": len(personas)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving personas: {str(e)}")


@router.get("/{king_id}")
async def get_persona(king_id: str, language: str = "en"):
    """
    Get detailed information about a specific historical persona.
    """
    try:
        # Try to get from vector database
        persona_info = get_persona_info(king_id, language)
        
        # If not found in vector DB, try CSV
        if not persona_info and not personas_df.empty:
            if king_id not in personas_df["king_id"].astype(str).values:
                raise HTTPException(status_code=404, detail="Persona not found")
            
            row = personas_df[personas_df["king_id"] == king_id].iloc[0]
            persona_info = {
                "king_id": str(row["king_id"]),
                "king_name": row["king_name"],
                "reign_period": row["reign_period"],
                "capital_city": row["capital_city"],
                "description": row["detailed_description"]
            }
        
        if not persona_info:
            raise HTTPException(status_code=404, detail="Persona not found")
        
        return persona_info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving persona: {str(e)}")


@router.post("/ask")
async def ask_persona(req: PersonaAskRequest):
    """
    Ask a question to a historical persona (king).
    The persona will respond in-character using historical context.
    
    Example:
    {
        "king_id": "Kin005",
        "question": "Tell me about your irrigation projects",
        "language": "en"
    }
    """
    try:
        # ----------------------------
        # Validate persona exists
        # ----------------------------
        if personas_df.empty or req.king_id not in personas_df["king_id"].astype(str).values:
            return {
                "answer": "Persona not found." if req.language == "en" else "චරිතය හමු නොවීය.",
                "rejected": True,
                "reason": "PERSONA_NOT_FOUND"
            }

        # Load persona info
        row = personas_df[personas_df["king_id"] == req.king_id].iloc[0]
        king_name = row["king_name"]
        reign_period = row["reign_period"]

        # ----------------------------
        # Handle greetings specially
        # ----------------------------
        question_lower = req.question.lower().strip()
        greetings = ["hello", "hi", "hey", "greetings", "හායි", "ආයුබෝවන්", "හෙලෝ"]
        
        if any(greeting in question_lower for greeting in greetings):
            if req.language == "en":
                greeting_msg = f"Greetings, visitor. I am {king_name}, who ruled Sri Lanka during {reign_period}. I am honored to share the stories of my reign and the glory of our kingdom. What would you like to know?"
            else:
                greeting_msg = f"ආයුබෝවන්, අමුත්තා. මම {king_name}, {reign_period} කාලයේ ශ්‍රී ලංකාව පාලනය කළ රජතුමා. මගේ රාජ්‍යයේ කතා සහ අපේ රාජධානියේ තේජස බෙදා ගැනීමට මට ගෞරවයක්. ඔබ දැන ගැනීමට කැමති කුමක්ද?"
            
            return {
                "answer": greeting_msg,
                "rejected": False,
                "reason": None
            }

        # ----------------------------
        # Retrieve persona context (RAG)
        # ----------------------------
        context = retrieve_persona_context(
            king_id=req.king_id,
            question=req.question,
            language=req.language
        )

        # If DB is empty, use CSV description as fallback
        if not context:
            context = f"""
King Name: {king_name}
Reign Period: {reign_period}
Capital: {row['capital_city']}

Biography:
{row['detailed_description']}
"""

        # ----------------------------
        # Generate in-character answer
        # ----------------------------
        answer = generate_persona_answer(
            question=req.question,
            context=context,
            language=req.language,
            king_name=king_name,
            reign_period=reign_period
        )

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


def get_personas_count():
    """Helper function to get count of loaded personas."""
    return len(personas_df) if not personas_df.empty else 0
