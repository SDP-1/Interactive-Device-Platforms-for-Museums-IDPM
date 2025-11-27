"""
Step 1: Setup RAG - Create vector database with artifact contexts
"""
import csv
import os
from dotenv import load_dotenv
from openai import OpenAI
import chromadb
import json

load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize ChromaDB with new API
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Create or get collection
collection = chroma_client.get_or_create_collection(
    name="museum_artifacts"
)

def load_artifact_contexts():
    """Load artifact contexts from original dataset"""
    contexts = {}
    with open('dataset/Dataset - Sheet1.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            artid = row['artifact_id'].lower()
            if artid not in contexts:
                # Create comprehensive context from all artifact fields
                context_parts = [
                    f"Artifact: {row['Name']}",
                    f"Type/Category: {row['type/category']}",
                    f"Period: {row['period']}",
                    f"Historical Time Range: {row['historical time range']}",
                    f"Origin: {row['origin']}",
                    f"Historical Background: {row['historical_background']}",
                    f"Purpose: {row['purpose']}",
                    f"Cultural Significance: {row['cultural_significance']}",
                    f"Related Events: {row['related_events']}"
                ]
                contexts[artid] = {
                    'artifact_id': artid,
                    'name': row['Name'],
                    'context': '\n'.join(context_parts)
                }
    return contexts

def create_embeddings(texts):
    """Create embeddings using OpenAI"""
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )
    return [item.embedding for item in response.data]

def setup_vector_database():
    """Create vector database with artifact contexts"""
    print("Loading artifact contexts...")
    artifacts = load_artifact_contexts()
    
    print(f"Found {len(artifacts)} artifacts")
    
    # Prepare data for embedding
    ids = []
    documents = []
    metadatas = []
    
    for artid, artifact in artifacts.items():
        ids.append(artid)
        # Use context + name for better retrieval
        document = f"{artifact['name']}\n\n{artifact['context']}"
        documents.append(document)
        metadatas.append({
            'artifact_id': artid,
            'name': artifact['name']
        })
    
    print("Creating embeddings...")
    # Create embeddings in batches
    batch_size = 10
    embeddings = []
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i+batch_size]
        batch_embeddings = create_embeddings(batch)
        embeddings.extend(batch_embeddings)
        print(f"Processed {min(i+batch_size, len(documents))}/{len(documents)} documents")
    
    print("Adding to vector database...")
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas
    )
    
    print(f"✅ Vector database created with {len(artifacts)} artifacts")
    print(f"Collection: {collection.name}")
    print(f"Count: {collection.count()}")

if __name__ == "__main__":
    setup_vector_database()

