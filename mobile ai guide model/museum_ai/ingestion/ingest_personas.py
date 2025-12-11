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

COLLECTION = "personas"


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
            field_name="king_id",
            field_schema=PayloadSchemaType.KEYWORD
        )
        print("  - Index created for 'king_id'")
    except Exception as e:
        if "already exists" in str(e).lower() or "already exist" in str(e).lower():
            print("  - Index for 'king_id' already exists")
        else:
            print(f"  - Warning: Could not create index for 'king_id': {e}")
    
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
    csv_path = project_root / "data" / "Ancient_Kings.csv"
    
    # Try different encodings to handle special characters
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    df = None
    
    for encoding in encodings:
        try:
            df = pd.read_csv(csv_path, encoding=encoding)
            print(f"Loaded {len(df)} personas from Ancient_Kings.csv (encoding: {encoding})")
            break
        except UnicodeDecodeError:
            continue
    
    if df is None:
        print("❌ Could not read CSV file with any supported encoding")
        return

    print("Starting ingestion...")
    for _, row in df.iterrows():
        king_id = str(row["king_id"])
        king_name = row["king_name"]
        print(f"\nProcessing persona: {king_name} ({king_id})")

        # Combine English fields using utility function
        context_en = combine_text_fields(
            f"King Name: {row.get('king_name', '')}",
            f"Reign Period: {row.get('reign_period', '')}",
            f"Capital: {row.get('capital_city', '')}",
            f"Biography: {row.get('detailed_description', '')}"
        )
        
        # Create Sinhala context (using available Sinhala translations or English as fallback)
        context_si = combine_text_fields(
            f"රාජ නාමය: {row.get('king_name', '')}",
            f"රාජ්‍ය කාලය: {row.get('reign_period', '')}",
            f"රාජධානිය: {row.get('capital_city', '')}",
            f"චරිතාපදානය: {row.get('detailed_description', '')}"
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
                                "king_id": king_id,
                                "king_name": king_name,
                                "reign_period": row.get("reign_period", ""),
                                "capital_city": row.get("capital_city", ""),
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
