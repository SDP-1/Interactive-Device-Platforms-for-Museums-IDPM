import os
import sys
import uuid
import pandas as pd
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct

from rag.embedder import embed_text
from utils.text_utils import chunk_text, combine_text_fields

# Load .env
load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

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
    print("Loading CSV...")
    csv_path = project_root / "data" / "artifacts.csv"
    df = pd.read_csv(csv_path)

    print("Starting ingestion...")
    for _, row in df.iterrows():
        artifact_id = row["Artifact_id"]
        print(f"\nProcessing artifact: {artifact_id}")

        # Combine English and Sinhala fields using utility function
        context_en = combine_text_fields(
            row.get('Description_en', ''),
            row.get('facts_en', ''),
            row.get('faq_en', '')
        )
        context_si = combine_text_fields(
            row.get('Description_si', ''),
            row.get('facts_si', ''),
            row.get('faq_si', '')
        )

        languages = {
            "en": context_en,
            "si": context_si
        }

        for lang, text in languages.items():
            print(f"  - Processing language: {lang}")
            chunks = chunk_text(text)

            for chunk in chunks:
                embedding = embed_text(chunk)
                point_id = str(uuid.uuid4())

                qdrant.upsert(
                    collection_name=COLLECTION,
                    points=[
                        PointStruct(
                            id=point_id,
                            vector=embedding,
                            payload={
                                "artifact_id": artifact_id,
                                "language": lang,
                                "text": chunk
                            }
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