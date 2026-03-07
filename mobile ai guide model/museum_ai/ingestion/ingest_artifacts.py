import os
import sys
import uuid
import pandas as pd
from pymongo import MongoClient
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct

from rag.embedder import embed_text
from utils.text_utils import chunk_text, combine_text_fields, clean_text


def strip_html(s: str) -> str:
    if not s:
        return ""
    import re

    no_tags = re.sub(r"<[^>]+>", "", s)
    return clean_text(no_tags)

# Load .env
load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

# MongoDB config (use .env to override)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
# DB_NAME for consistency with ingest_personas; fall back to MONGO_DB if present
DB_NAME = os.getenv("DB_NAME") or os.getenv("MONGO_DB") or "museum"
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "artifacts")
# Connect to Qdrant Cloud
qdrant = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

COLLECTION = "artifacts"


# ----------------------------
# Create collection structure
# ----------------------------
def create_collection():
    from qdrant_client.models import PayloadSchemaType
    
    existing = qdrant.get_collections().collections
    names = [c.name for c in existing]

    if COLLECTION not in names:
        print("Creating Qdrant collection:", COLLECTION)
        qdrant.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(
                size=1536,
                distance=Distance.COSINE
            )
        )
        print("Collection created.")
    else:
        print("Collection already exists.")
    
    # Create indexes for filter fields (required for filtering)
    print("Creating indexes for filter fields...")
    try:
        qdrant.create_payload_index(
            collection_name=COLLECTION,
            field_name="artifact_id",
            field_schema=PayloadSchemaType.KEYWORD
        )
        print("  - Index created for 'artifact_id'")
    except Exception as e:
        if "already exists" in str(e).lower() or "already exist" in str(e).lower():
            print("  - Index for 'artifact_id' already exists")
        else:
            print(f"  - Warning: Could not create index for 'artifact_id': {e}")
    
    try:
        qdrant.create_payload_index(
            collection_name=COLLECTION,
            field_name="language",
            field_schema=PayloadSchemaType.KEYWORD
        )
        print("  - Index created for 'language'")
    except Exception as e:
        if "already exists" in str(e).lower() or "already exist" in str(e).lower():
            print("  - Index for 'language' already exists")
        else:
            print(f"  - Warning: Could not create index for 'language': {e}")




# ----------------------------
# Main ingestion script
# ----------------------------
def ingest():
    print("Connecting to MongoDB...")
    if not MONGO_URI or not DB_NAME:
        print("MongoDB not configured. Set MONGO_URI and DB_NAME in .env")
        return

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    coll = db[MONGO_COLLECTION]

    docs = list(coll.find({}))

    if not docs:
        print(f"No documents found in Mongo collection '{MONGO_COLLECTION}'.")
        return

    print(f"Starting ingestion of {len(docs)} artifacts from MongoDB ({DB_NAME}.{MONGO_COLLECTION})...")

    for doc in docs:
        # Prefer explicit artifact_id field, fall back to Mongo _id
        artifact_id = doc.get("artifact_id") or doc.get("Artifact_id") or str(doc.get("_id"))
        print(f"\nProcessing artifact: {artifact_id}")

        # Build English and Sinhala contexts from common fields in the document
        desc_en = strip_html(doc.get('description_en') or doc.get('Description_en') or "")
        desc_si = strip_html(doc.get('description_si') or doc.get('Description_si') or "")

        cs_en = strip_html(doc.get('culturalSignificance_en') or doc.get('culturalSignificance') or "")
        cs_si = strip_html(doc.get('culturalSignificance_si') or "")

        kb_en = strip_html(doc.get('aiKnowlageBase_en') or doc.get('aiKnowlageBase') or "")
        kb_si = strip_html(doc.get('aiKnowlageBase_si') or "")

        title_en = strip_html(doc.get('title_en') or doc.get('title') or "")
        title_si = strip_html(doc.get('title_si') or "")

        context_en = kb_en if kb_en else combine_text_fields(title_en, desc_en, cs_en)
        context_si = kb_si if kb_si else combine_text_fields(title_si, desc_si, cs_si)

        languages = {
            "en": context_en,
            "si": context_si
        }

        for lang, text in languages.items():
            if not text:
                print(f"  - Skipping empty language: {lang}")
                continue

            print(f"  - Processing language: {lang}")
            chunks = chunk_text(text)

            for chunk in chunks:
                embedding = embed_text(chunk)
                point_id = str(uuid.uuid4())

                # include some common metadata fields in the payload
                payload = {
                    "artifact_id": artifact_id,
                    "language": lang,
                    "text": chunk,
                    "title_en": title_en,
                    "title_si": title_si,
                    "origin": doc.get('origin_en') or doc.get('origin') or doc.get('origin_en', ''),
                    "year": doc.get('year', ''),
                    "category": doc.get('category_en') or doc.get('category', ''),
                    "material": doc.get('material_en') or doc.get('material', ''),
                }

                qdrant.upsert(
                    collection_name=COLLECTION,
                    points=[
                        PointStruct(
                            id=point_id,
                            vector=embedding,
                            payload=payload,
                        )
                    ]
                )

    print("\nIngestion complete!")


if __name__ == "__main__":
    create_collection()
    ingest()



# This script will:

# Load your CSV (data/artifacts.csv)

# Create chunks (Sinhala + English)

# Generate embeddings using OpenAI

# Upload everything to your Qdrant vector DB