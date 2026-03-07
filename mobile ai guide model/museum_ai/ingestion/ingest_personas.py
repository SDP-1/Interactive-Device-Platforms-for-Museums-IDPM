import os
import sys
import uuid
from pathlib import Path

# Add project root to Python path so local packages (rag, utils) import correctly
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from pymongo import MongoClient

from rag.embedder import embed_text
from utils.text_utils import chunk_text, combine_text_fields, clean_text


def strip_html(s: str) -> str:
    """Remove simple HTML tags and normalize whitespace."""
    if not s:
        return ""
    # very small sanitizer: remove tags
    import re

    no_tags = re.sub(r"<[^>]+>", "", s)
    return clean_text(no_tags)

# Load .env
load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

# Connect to Qdrant
qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

# Connect to MongoDB
mongo_client = MongoClient(MONGO_URI) if MONGO_URI else None
db = mongo_client[DB_NAME] if mongo_client and DB_NAME else None

COLLECTION = "personas"
MONGO_COLLECTION = "kings"


def create_collection():
    from qdrant_client.models import PayloadSchemaType

    existing = qdrant.get_collections().collections
    names = [c.name for c in existing]

    if COLLECTION not in names:
        print("Creating Qdrant collection:", COLLECTION)
        qdrant.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )
        print("Collection created.")
    else:
        print("Collection already exists.")

    # Create simple payload indexes
    try:
        qdrant.create_payload_index(
            collection_name=COLLECTION,
            field_name="king_id",
            field_schema=PayloadSchemaType.KEYWORD,
        )
    except Exception:
        pass

    try:
        qdrant.create_payload_index(
            collection_name=COLLECTION,
            field_name="language",
            field_schema=PayloadSchemaType.KEYWORD,
        )
    except Exception:
        pass


def ingest():
    """Ingest personas from MongoDB `kings` collection into Qdrant."""
    if db is None:
        print("MongoDB not configured. Set MONGO_URI and DB_NAME in .env")
        return

    collection = db[MONGO_COLLECTION]
    docs = list(collection.find({}))

    if not docs:
        print("No documents found in Mongo collection 'kings'.")
        return

    print(f"Starting ingestion of {len(docs)} personas from MongoDB...")

    for doc in docs:
        king_id = str(doc.get("king_id") or doc.get("king_id") or doc.get("kingId") or "")
        king_name_en = doc.get("name_en") or doc.get("king_name") or ""
        king_name_si = doc.get("name_si") or king_name_en

        # Prefer aiKnowlageBase fields; fall back to biography/capitals
        kb_en_raw = doc.get("aiKnowlageBase_en") or doc.get("aiKnowlageBase") or ""
        kb_si_raw = doc.get("aiKnowlageBase_si") or ""

        bio_en_raw = doc.get("biography_en") or ""
        bio_si_raw = doc.get("biography_si") or ""

        capital_en = doc.get("capital_en") or doc.get("capital") or ""
        capital_si = doc.get("capital_si") or ""

        period_en = doc.get("period_en") or doc.get("reign_period") or ""
        period_si = doc.get("period_si") or doc.get("reign_period") or ""

        # Clean HTML and normalize text
        kb_en = strip_html(kb_en_raw)
        kb_si = strip_html(kb_si_raw)
        bio_en = strip_html(bio_en_raw)
        bio_si = strip_html(bio_si_raw)

        # Build contexts
        # Build English context: prefer the knowledge base text, else combine fields
        context_en = kb_en if kb_en else combine_text_fields(
            f"King Name: {king_name_en}",
            f"Period: {period_en}",
            f"Capital: {capital_en}",
            f"Biography: {bio_en}",
        )

        # Build Sinhala context
        context_si = kb_si if kb_si else combine_text_fields(
            f"රාජ නාමය: {king_name_si}",
            f"කාලය: {period_si}",
            f"රාජධානිය: {capital_si}",
            f"චරිතාපදානය: {bio_si}",
        )

        languages = {"en": context_en, "si": context_si}

        for lang, text in languages.items():
            if not text:
                continue

            print(f"  - Processing {king_id} ({king_name_en}) language={lang}")
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
                                "king_name": king_name_en,
                                "reign_period": doc.get("reign_period", ""),
                                "capital_city": capital_en,
                                "language": lang,
                                "text": chunk,
                            },
                        )
                    ],
                )

    print("\nIngestion complete!")


if __name__ == "__main__":
    create_collection()
    ingest()
