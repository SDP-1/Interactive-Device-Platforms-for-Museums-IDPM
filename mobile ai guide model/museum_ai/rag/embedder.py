import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
client = OpenAI(api_key=OPENAI_API_KEY)


# ----------------------------
# Generate embeddings using OpenAI
# ----------------------------
def embed_text(text: str, model: str = None):
    """
    Generate embedding vector for a given text.
    
    Args:
        text: The text to embed
        model: OpenAI embedding model (default: from EMBEDDING_MODEL env var)
    
    Returns:
        List of floats representing the embedding vector
    """    
    if model is None:
        model = EMBEDDING_MODEL    
        response = client.embeddings.create(
        model=model,
        input=text
    )
    return response.data[0].embedding


# ----------------------------
# Batch embed multiple texts
# ----------------------------
def embed_batch(texts: list[str], model: str = None):
    """
    Generate embeddings for multiple texts in a single API call.
    
    Args:
        texts: List of texts to embed
        model: OpenAI embedding model (default: from EMBEDDING_MODEL env var)
    
    Returns:
        List of embedding vectors
    """    
    if model is None:
        model = EMBEDDING_MODEL    
        response = client.embeddings.create(
        model=model,
        input=texts
    )
    return [item.embedding for item in response.data]

