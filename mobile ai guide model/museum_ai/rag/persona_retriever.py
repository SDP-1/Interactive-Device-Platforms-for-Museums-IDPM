import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

from rag.embedder import embed_text

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

qdrant = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)


def retrieve_persona_context(king_id: str, question: str, language: str, top_k: int = 2):
    """
    Retrieve persona context for a specific historical figure.
    
    Args:
        king_id: The unique identifier for the king/persona
        question: The user's question
        language: "en" or "si"
        top_k: Number of chunks to retrieve
        
    Returns:
        Context string containing persona information
    """
    query_vector = embed_text(question)

    try:
        results = qdrant.query_points(
            collection_name="personas",
            query=query_vector,
            limit=top_k,
            query_filter=Filter(
                must=[
                    FieldCondition(key="king_id", match=MatchValue(value=king_id)),
                    FieldCondition(key="language", match=MatchValue(value=language))
                ]
            )
        )
    except Exception as e:
        print(f"Qdrant persona search error: {e}")
        import traceback
        traceback.print_exc()
        return ""

    if not results or not results.points:
        return ""

    # Combine all retrieved chunks
    return " ".join([point.payload.get("text", "") for point in results.points])


def get_persona_info(king_id: str, language: str = "en"):
    """
    Get basic persona information without semantic search.
    Used for displaying persona details when selected.
    
    Args:
        king_id: The unique identifier for the king/persona
        language: "en" or "si"
        
    Returns:
        Dictionary with persona information
    """
    try:
        # Search for any point matching the king_id and language
        results = qdrant.scroll(
            collection_name="personas",
            scroll_filter=Filter(
                must=[
                    FieldCondition(key="king_id", match=MatchValue(value=king_id)),
                    FieldCondition(key="language", match=MatchValue(value=language))
                ]
            ),
            limit=1
        )
        
        if results and results[0]:
            point = results[0][0]  # First point from first page
            payload = point.payload
            return {
                "king_id": payload.get("king_id"),
                "king_name": payload.get("king_name"),
                "reign_period": payload.get("reign_period"),
                "capital_city": payload.get("capital_city"),
                "text": payload.get("text")
            }
    except Exception as e:
        print(f"Error getting persona info: {e}")
        import traceback
        traceback.print_exc()
    
    return None


def list_available_personas(language: str = "en"):
    """
    List all available historical personas.
    
    Args:
        language: "en" or "si"
        
    Returns:
        List of dictionaries with persona information
    """
    try:
        # Scroll through all personas for the specified language
        results = qdrant.scroll(
            collection_name="personas",
            scroll_filter=Filter(
                must=[
                    FieldCondition(key="language", match=MatchValue(value=language))
                ]
            ),
            limit=100  # Adjust if you have more personas
        )
        
        personas = []
        seen_king_ids = set()  # Track unique king IDs
        
        if results and results[0]:
            for point in results[0]:
                payload = point.payload
                king_id = payload.get("king_id")
                
                # Only add if we haven't seen this king_id before
                if king_id not in seen_king_ids:
                    seen_king_ids.add(king_id)
                    personas.append({
                        "king_id": king_id,
                        "king_name": payload.get("king_name"),
                        "reign_period": payload.get("reign_period"),
                        "capital_city": payload.get("capital_city")
                    })
        
        return personas
    except Exception as e:
        print(f"Error listing personas: {e}")
        import traceback
        traceback.print_exc()
        return []
