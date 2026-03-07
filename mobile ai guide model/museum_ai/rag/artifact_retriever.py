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


# ----------------------------
# Retrieve top matching chunks
# ----------------------------
def retrieve_context(artifact_id: str, question: str, language: str, top_k: int = 3):
    query_vector = embed_text(question)
    artifact_id = (artifact_id or "").strip()
    language = (language or "en").lower().strip()

    try:
        # Use query_points method (correct Qdrant API)
        results = qdrant.query_points(
            collection_name="artifacts",
            query=query_vector,
            limit=top_k,
            query_filter=Filter(
                must=[
                    FieldCondition(key="artifact_id", match=MatchValue(value=artifact_id)),
                    FieldCondition(key="language", match=MatchValue(value=language))
                ]
            )
        )
    except Exception as e:
        print(f"Qdrant search error: {e}")
        import traceback
        traceback.print_exc()
        return ""

    # If nothing is found, return empty context
    if not results or not results.points:
        return ""

    # Combine all retrieved chunks into one context
    # results.points contains ScoredPoint objects
    return " ".join([point.payload.get("text", "") for point in results.points])


def artifact_exists(artifact_id: str, language: str = None) -> bool:
    """Check whether any points exist for the given artifact_id (optionally filtered by language).

    Uses Qdrant's count API when available; falls back to a safe False on errors.
    """
    try:
        # Build filter conditions
        artifact_id = (artifact_id or "").strip()
        lang = (language or "").lower().strip()
        must_conditions = [
            FieldCondition(key="artifact_id", match=MatchValue(value=artifact_id))
        ]
        if lang:
            must_conditions.append(FieldCondition(key="language", match=MatchValue(value=lang)))

        count_result = qdrant.count(
            collection_name="artifacts",
            filter=Filter(must=must_conditions)
        )

        # qdrant.count returns an object with a .count attribute
        if hasattr(count_result, "count"):
            if int(count_result.count) > 0:
                return True

        # If language-specific check returned 0, retry without language filter
        if lang:
            count_result = qdrant.count(
                collection_name="artifacts",
                filter=Filter(
                    must=[FieldCondition(key="artifact_id", match=MatchValue(value=artifact_id))]
                ),
            )
            if hasattr(count_result, "count"):
                return int(count_result.count) > 0

        # Fallback: interpret truthy integer
        return int(count_result) > 0
    except Exception:
        # On any errors, be conservative and report False (no artifact)
        return False



# What this does

# Connects to Qdrant Cloud

# When you ask a question, it gets the embedding

# Searches only for chunks with your:

# artifact_id

# language (“en” or “si”)

# Returns the matched context text

# Even if your DB has zero artifacts, the function runs fine.