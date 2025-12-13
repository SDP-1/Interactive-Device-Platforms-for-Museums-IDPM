🚀 Setup and Run Guide

Complete guide to set up and run the Museum AI Guide system.

---

📋 Prerequisites

- Python 3.8 or higher
- OpenAI API key
- Qdrant Cloud account (free tier available) or local Qdrant instance

---

1. 🔧 Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pandas` - CSV processing
- `openai` - OpenAI API client
- `qdrant-client` - Qdrant vector database client
- `tiktoken` - Token counting
- `python-dotenv` - Environment variable management
- `langchain-text-splitters` - Text chunking utilities

---

2. 🔑 Configure Environment Variables

Create a `.env` file in the project root directory:

```env
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
QDRANT_URL=https://your-cluster-id.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key-here
DEBUG=false
```

### Getting API Keys

#### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in with your account
3. Click "+ Create new secret key"
4. Copy the key (starts with `sk-proj-...`)

#### Qdrant Cloud
1. Go to https://cloud.qdrant.io/
2. Sign up for a free account
3. Create a new cluster (free tier available)
4. Copy the cluster URL and API key

---

3. 📊 Prepare Data

Ensure your `data/artifacts.csv` file is ready with the following columns:
- `Artifact_id` - Unique identifier (e.g., "ART001")
- `Name` - Artifact name
- `Period` - Historical period
- `origin` - Place of origin
- `Description_en` - English description
- `Description_si` - Sinhala description
- `facts_en` - English facts
- `facts_si` - Sinhala facts
- `faq_en` - English FAQ
- `faq_si` - Sinhala FAQ
- `keywords` - Keywords for search

---

## 4. 📥 Ingest Artifacts into Qdrant

Run the ingestion script to process artifacts and upload them to Qdrant:

```bash
python ingestion/ingest_artifacts.py
```

**What this does:**
- Loads artifacts from `data/artifacts.csv`
- Splits text into chunks (500 chars, 100 overlap)
- Generates embeddings using OpenAI `text-embedding-3-small`
- Creates indexes for `artifact_id` and `language` fields
- Uploads everything to Qdrant vector database

**Expected output:**
```
Collection already exists.
Creating indexes for filter fields...
  - Index created for 'artifact_id'
  - Index created for 'language'
Loading CSV...
Starting ingestion...

Processing artifact: ART001
  - Processing language: en
  - Processing language: si
...

Ingestion complete!
```

**⏱️ Time:** 2-5 minutes (depends on API speed)  

**Note:** You only need to run this once, or when you update `artifacts.csv`.

---

## 5. 🚀 Start the API Server

### Option A: Using Command Line

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Option B: Using Batch File (Windows)

Double-click `start_server.bat` or run:
```bash
./start_server.bat
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Keep the server running!** The API needs to stay active.

---

## 6. 🌐 Access API Documentation

Once the server is running, access the interactive API documentation:

### Swagger UI (Recommended)
**URL:** http://localhost:8000/docs

- Interactive API explorer
- Test endpoints directly in browser
- See request/response schemas
- Try out all endpoints

### ReDoc (Alternative)
**URL:** http://localhost:8000/redoc

- Clean, readable documentation
- Better for reading API specs

### API Root
**URL:** http://localhost:8000/

Shows basic API information and available endpoints.

---

## 7. 🧪 Test the API

### Using Swagger UI (Easiest)

1. Open http://localhost:8000/docs in your browser
2. Click on any endpoint (e.g., `POST /ask`)
3. Click "Try it out"
4. Fill in the request body:
   ```json
   {
     "artifact_id": "ART001",
     "question": "What is a Sandakada Pahana?",
     "language": "en"
   }
   ```
5. Click "Execute"
6. See the response below

### Using cURL

#### Health Check
```bash
curl http://localhost:8000/health
```

#### Get Artifact Info (English)
```bash
curl "http://localhost:8000/artifact/ART001?language=en"
```

#### Get Artifact Info (Sinhala)
```bash
curl "http://localhost:8000/artifact/ART001?language=si"
```

#### Ask a Question (English)
```bash
curl -X POST "http://localhost:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"artifact_id": "ART001", "question": "What is a Sandakada Pahana?", "language": "en"}'
```

#### Ask a Question (Sinhala)
```bash
curl -X POST "http://localhost:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"artifact_id": "ART001", "question": "සඳකඩපහණ යනු කුමක්ද?", "language": "si"}'
```

---

## 📡 API Endpoints

### `GET /health`
Health check endpoint. Returns system status.

**Response:**
```json
{
  "status": "healthy",
  "artifacts_loaded": 12,
  "data_path": "data/artifacts.csv"
}
```

### `GET /artifact/{artifact_id}`
Get artifact information when QR code is scanned.

**Parameters:**
- `artifact_id` (path): Artifact identifier (e.g., "ART001")
- `language` (query): "en" or "si" (default: "en")

**Example:** http://localhost:8000/artifact/ART001?language=en

**Response:**
```json
{
  "artifact_id": "ART001",
  "name": "Sandakada Pahana (Moonstone)",
  "period": "Anuradhapura Period...",
  "origin": "Ancient Sri Lanka...",
  "description": "...",
  "facts": "...",
  "faq": "..."
}
```

### `POST /ask`
Ask a question about an artifact using AI Mode.

**Request Body:**
```json
{
  "artifact_id": "ART001",
  "question": "What is a Sandakada Pahana?",
  "language": "en"
}
```

**Response (Success):**
```json
{
  "answer": "The Sandakada Pahana, or Moonstone, is a unique...",
  "rejected": false,
  "reason": null
}
```

**Response (Rejected - Out of Scope):**
```json
{
  "answer": "I can only answer questions about the artifact you are viewing.",
  "rejected": true,
  "reason": "OUT_OF_SCOPE"
}
```

**Response (No Context Found):**
```json
{
  "answer": "I don't know that information.",
  "rejected": false,
  "reason": "NO_CONTEXT_FOUND"
}
```

---

## 🔄 Daily Usage

Once everything is set up:

1. **Start the server** (if not running):
   ```bash
   uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Access Swagger UI**: http://localhost:8000/docs

3. **Use the API** from your Flutter app or any HTTP client

**Note:** You only need to run ingestion again if you update `artifacts.csv`.

---

## 🛠️ Troubleshooting

### "Module not found" error
```bash
pip install -r requirements.txt
```

### "Invalid API Key" error
- Check your `.env` file
- Make sure keys are correct (no extra spaces)
- Verify keys are active in OpenAI/Qdrant dashboards

### "Connection refused" for Qdrant
- Verify Qdrant cluster is running
- Check `QDRANT_URL` in `.env`
- For local Qdrant: Make sure Docker container is running

### "Artifact not found"
- Make sure ingestion completed successfully
- Check that artifacts were uploaded to Qdrant
- Verify `artifact_id` matches CSV (e.g., "ART001")

### "NO_CONTEXT_FOUND" responses
- Ensure ingestion script completed without errors
- Check that indexes were created for `artifact_id` and `language`
- Verify Qdrant collection has points (check `/health` endpoint)

### Server won't start
- Check if port 8000 is already in use
- Try a different port: `--port 8001`
- Check Python version: `python --version` (need 3.8+)

---

## 📚 Additional Resources

- **Test Questions**: See `TEST_QUESTIONS.md` for comprehensive test questions
- **API Documentation**: http://localhost:8000/docs (when server is running)
- **OpenAI Docs**: https://platform.openai.com/docs
- **Qdrant Docs**: https://qdrant.tech/documentation/

---

## ✅ Quick Checklist

-  Python 3.8+ installed
-  Dependencies installed (`pip install -r requirements.txt`)
-  `.env` file created with API keys
-  Artifacts ingested (`python ingestion/ingest_artifacts.py`)
-  Server started (`uvicorn api.main:app --reload`)
-  Swagger UI accessible (http://localhost:8000/docs)
-  Test endpoint works

---

## 🎉 You're Ready!

Once the server is running and Swagger UI is accessible, your Museum AI Guide API is ready to use!

**Next Steps:**
- Test endpoints using Swagger UI
- Integrate with your Flutter app
- Check `TEST_QUESTIONS.md` for test questions


