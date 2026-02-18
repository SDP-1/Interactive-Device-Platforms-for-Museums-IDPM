# Complete RAG Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Technologies Used](#technologies-used)
3. [Architecture](#architecture)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup](#installation--setup)
6. [API Documentation](#api-documentation)
7. [Testing with cURL](#testing-with-curl)
8. [Troubleshooting](#troubleshooting)
9. [Deployment](#deployment)

---

## Overview

This is a **RAG (Retrieval-Augmented Generation)** system that generates topic-based responses for museum artifacts. The system uses vector embeddings to retrieve relevant artifact context and GPT models to generate structured answers with 3 distinct topics.

**What this system does:**
- Retrieves artifact information using semantic search
- Generates contextual "What-If" scenario responses
- Returns structured JSON with 3 topics and detailed descriptions
- Handles questions with training data

---

## Technologies Used

### Core Technologies

#### 1. **RAG (Retrieval-Augmented Generation)**
- **What it is:** A technique that combines information retrieval with language generation
- **Why we use it:** Allows the model to access up-to-date artifact information without retraining
- **How it works:** 
  1. User question → Embedding
  2. Search vector database for relevant context
  3. Augment prompt with retrieved context
  4. Generate answer using LLM

#### 2. **OpenAI API**
- **Models Used:**
  - `text-embedding-3-small` - For creating vector embeddings (cheap, fast)
  - `gpt-4-turbo-preview` - For generating structured responses (high quality)
  - Alternative: `gpt-3.5-turbo` - Cheaper option with good quality
- **Features:**
  - Embeddings API - Converts text to vectors
  - Chat Completions API - Generates responses
  - Structured Output (JSON mode) - Ensures consistent format

#### 3. **ChromaDB**
- **What it is:** Open-source vector database for storing embeddings
- **Why we use it:** Fast similarity search, persistent storage, easy to use
- **Features:**
  - Stores artifact embeddings
  - Enables semantic search
  - Filters by metadata (artifact ID)
  - Persistent storage on disk

#### 4. **Flask**
- **What it is:** Lightweight Python web framework
- **Why we use it:** Simple API server, easy to deploy
- **Features:**
  - RESTful API endpoints
  - JSON request/response handling
  - Error handling

#### 5. **Python Libraries**
- **python-dotenv** - Environment variable management
- **requests** - HTTP client for testing
- **csv** - Data processing

### Technology Stack Summary

```
┌─────────────────┐
│   User Query    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Flask API      │────▶│  OpenAI      │
│  Server         │     │  Embeddings  │
└────────┬────────┘     └──────┬───────┘
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌──────────────┐
│  ChromaDB       │     │  OpenAI      │
│  Vector DB     │     │  GPT-4       │
└────────┬────────┘     └──────┬───────┘
         │                      │
         └──────────┬───────────┘
                    ▼
         ┌──────────────────┐
         │  Structured JSON │
         │  Response         │
         └──────────────────┘
```

---

## Architecture

### System Flow

```
1. User Request
   POST /api/answer
   {
     "artid": "art1",
     "question": "What if..."
   }
   
2. Embedding Creation
   └─> OpenAI Embeddings API
       └─> Convert question to vector
   
3. Vector Search
   └─> ChromaDB Query
       └─> Find similar artifact contexts
       └─> Filter by artifact ID
       └─> Retrieve top match
   
4. Context Augmentation
   └─> Combine retrieved context + question
       └─> Create prompt for GPT
   
5. Generation
   └─> OpenAI GPT-4 API
       └─> Structured output (JSON mode)
       └─> Generate 3 topics with descriptions
   
6. Response
   {
     "artid": "art1",
     "answerTopic1": "...",
     "answerDescription1": "...",
     ...
   }
```

### Data Flow

```
Dataset (CSV)
    │
    ▼
setup_rag.py
    │
    ├─> Extract artifact contexts
    ├─> Create embeddings (OpenAI)
    └─> Store in ChromaDB
         │
         ▼
    chroma_db/ (persistent storage)
         │
         ▼
rag_api_server.py
    │
    ├─> Query ChromaDB
    ├─> Retrieve context
    └─> Generate response
```

---

## Prerequisites

- **Python 3.8+** (3.11 recommended)
- **OpenAI API Key** - Get from https://platform.openai.com/api-keys
- **Basic command line knowledge**
- **Internet connection** (for API calls)

---

## Installation & Setup

### Step 1: Install Dependencies

```powershell
pip install -r requirements.txt
```

**Required packages:**
- `openai` - OpenAI API client
- `chromadb` - Vector database
- `python-dotenv` - Environment variables
- `flask` - Web framework
- `requests` - HTTP client

### Step 2: Set Up Environment Variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

**Important:**
- Never commit `.env` to version control
- Replace with your actual OpenAI API key
- Get your key from: https://platform.openai.com/api-keys

### Step 3: Create Vector Database

Run the setup script:
```powershell
python setup_rag.py
```

**What happens:**
1. Loads artifacts from `dataset/Dataset - Sheet1.csv`
2. Creates embeddings using OpenAI
3. Stores in ChromaDB vector database
4. Creates searchable index

**Expected output:**
```
Loading artifact contexts...
Found 5 artifacts
Creating embeddings...
Processed 5/5 documents
Adding to vector database...
✅ Vector database created with 5 artifacts
Collection: museum_artifacts
Count: 5
```

**Files created:**
- `chroma_db/` - Vector database directory

### Step 4: Start API Server

```powershell
python rag_api_server.py
```

**Expected output:**
```
================================================================================
RAG API Server Starting...
================================================================================

Endpoints:
  POST /api/answer - Get topic-based answer
  GET /health - Health check

Starting server on http://localhost:5000
```

**Keep this terminal open** - server must stay running.

---

## API Documentation

### Base URL

```
http://localhost:5000
```

### Endpoints

#### 1. Health Check

**GET** `/health`

**Response:**
```json
{
    "status": "healthy",
    "artifacts_in_db": 5
}
```

#### 2. Get Answer

**POST** `/api/answer`

**Request Body:**
```json
{
    "artid": "art1",
    "question": "What if the Kandyan Kingdom had lost the 1803 battle?"
}
```

**Response:**
```json
{
    "artid": "art1",
    "answerTopic1": "Ritual",
    "answerDescription1": "If the Kandyan Kingdom lost the 1803 battle, many royal ceremonies and rituals could have been suppressed...",
    "answerTopic2": "Colonial",
    "answerDescription2": "Under British administration, symbols of traditional power like the kastāne may have been reinterpreted...",
    "answerTopic3": "Political",
    "answerDescription3": "Some Kandyan chiefs could align with the British for pragmatic power..."
}
```

**Error Responses:**

- `400 Bad Request` - Missing artid or question
- `404 Not Found` - Artifact not found in database
- `500 Internal Server Error` - Server error

### Available Artifacts

- `art1` (art001) - Kandyan Battle Sword (Kasthāne)
- `art2` (art002) - Kandyan Mural Painting
- `art3` (art003) - Kolam Mask (Traditional Dance Mask)
- `art4` (art004) - Traditional Clay Pot
- `art5` (art005) - Traditional Sri Lankan Drum

---

## Testing with cURL

### Health Check

**Bash/Linux/Mac:**
```bash
curl -X GET http://localhost:5000/health
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
```

---

### Test Case 1: Artifact 1 - Kandyan Battle Sword

**Question:** What if the Kandyan Kingdom had lost the 1803 battle?

**Bash:**
```bash
curl -X POST http://localhost:5000/api/answer \
  -H "Content-Type: application/json" \
  -d '{
    "artid": "art1",
    "question": "What if the Kandyan Kingdom had lost the 1803 battle?"
  }'
```

**PowerShell:**
```powershell
$body = @{
    artid = "art1"
    question = "What if the Kandyan Kingdom had lost the 1803 battle?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/answer" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

---

### Test Case 2: Artifact 1 - Different Question

**Question:** What if the Kasthāne sword design had adopted South Indian blade styles?

**Bash:**
```bash
curl -X POST http://localhost:5000/api/answer \
  -H "Content-Type: application/json" \
  -d '{
    "artid": "art1",
    "question": "What if the Kasthāne sword design had adopted South Indian blade styles?"
  }'
```

---

### Test Case 3: Artifact 2 - Kandyan Mural

**Question:** What if the mural had never been restored?

**Bash:**
```bash
curl -X POST http://localhost:5000/api/answer \
  -H "Content-Type: application/json" \
  -d '{
    "artid": "art2",
    "question": "What if the mural had never been restored?"
  }'
```

---

### Test Case 4: Artifact 3 - Kolam Mask

**Question:** What if Kolam mask-making never spread beyond Ambalangoda?

**Bash:**
```bash
curl -X POST http://localhost:5000/api/answer \
  -H "Content-Type: application/json" \
  -d '{
    "artid": "art3",
    "question": "What if Kolam mask-making never spread beyond Ambalangoda?"
  }'
```

---

### Test Case 5: Artifact 4 - Clay Pot

**Question:** What if traditional clay pot-making had ceased after colonial metalware became common?

**Bash:**
```bash
curl -X POST http://localhost:5000/api/answer \
  -H "Content-Type: application/json" \
  -d '{
    "artid": "art4",
    "question": "What if traditional clay pot-making had ceased after colonial metalware became common?"
  }'
```

---

### Test Case 6: Artifact 5 - Drum

**Question:** What if traditional drum-making for the Geta Bera and Yak Bera declined in artisan villages?

**Bash:**
```bash
curl -X POST http://localhost:5000/api/answer \
  -H "Content-Type: application/json" \
  -d '{
    "artid": "art5",
    "question": "What if traditional drum-making for the Geta Bera and Yak Bera declined in artisan villages?"
  }'
```

---

### Error Tests

#### Test 7: Missing artid

**Bash:**
```bash
curl -X POST http://localhost:5000/api/answer \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What if something happened?"
  }'
```

**Expected:** `400 Bad Request` - Missing 'artid' or 'question'

---

#### Test 8: Invalid artid

**Bash:**
```bash
curl -X POST http://localhost:5000/api/answer \
  -H "Content-Type: application/json" \
  -d '{
    "artid": "art999",
    "question": "What if something happened?"
  }'
```

**Expected:** `404 Not Found` - Artifact not found

---

#### Test 9: Missing question

**Bash:**
```bash
curl -X POST http://localhost:5000/api/answer \
  -H "Content-Type: application/json" \
  -d '{
    "artid": "art1"
  }'
```

**Expected:** `400 Bad Request` - Missing 'artid' or 'question'

---

## Troubleshooting

### Common Issues

#### "No module named 'chromadb'"
**Solution:** `pip install chromadb`

#### "OPENAI_API_KEY not found"
**Solution:** 
1. Create `.env` file
2. Add `OPENAI_API_KEY=your-key-here`

#### "Collection not found"
**Solution:** Run `python setup_rag.py` first

#### "Connection refused" or "Cannot connect"
**Solution:**
- Make sure `rag_api_server.py` is running
- Check if port 5000 is available
- Try different port: Change `app.run(port=5001)` in `rag_api_server.py`

#### "ValueError: You are using a deprecated configuration of Chroma"
**Solution:** This is fixed in the current version. Make sure you're using `chromadb.PersistentClient` (not the old Settings-based approach).

#### "Artifact not found"
**Solution:**
- Check artifact ID is lowercase: `art1`, `art2`, etc.
- Verify artifact exists in dataset
- Run `python setup_rag.py` again

#### Unicode/Encoding Errors
**Solution:** Files are UTF-8 encoded. PowerShell should handle Unicode correctly.

---

## Deployment

### Option 1: Heroku

1. Create `Procfile`:
```
web: python rag_api_server.py
```

2. Deploy:
```powershell
git init
git add .
git commit -m "Initial commit"
heroku create your-app-name
heroku config:set OPENAI_API_KEY=your-key-here
git push heroku main
```

### Option 2: Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "rag_api_server.py"]
```

Build and run:
```powershell
docker build -t museum-api .
docker run -p 5000:5000 --env-file .env museum-api
```

### Option 3: AWS Lambda

- Use serverless framework
- Package ChromaDB properly
- Set up API Gateway

---

## Cost Estimation

### Embeddings (One-time setup)
- ~$0.0001 per 1K tokens
- 5 artifacts ≈ $0.001 (one-time)

### API Requests
- **GPT-4 Turbo:** ~$0.01-0.03 per request
- **GPT-3.5 Turbo:** ~$0.001-0.002 per request

### Monthly Estimate (1000 requests)
- GPT-4: ~$10-30/month
- GPT-3.5: ~$1-2/month

**Recommendation:** Start with GPT-3.5, upgrade to GPT-4 if needed.

---

## File Structure

```
Basiii/
├── .env                          # API keys (create this)
├── setup_rag.py                 # Step 3: Create vector DB
├── rag_api_server.py            # Step 4: API server
├── requirements.txt              # Dependencies
├── chroma_db/                   # Vector database (auto-created)
├── dataset/
│   └── Dataset - Sheet1.csv     # Source data
└── COMPLETE_GUIDE.md            # This guide
```

---

## Summary

**Quick Start (5 Steps):**

1. **Install:** `pip install -r requirements.txt`
2. **Setup:** Create `.env` with API key
3. **Database:** `python setup_rag.py`
4. **Server:** `python rag_api_server.py`
5. **Test:** Use curl commands above

**Technologies:**
- RAG (Retrieval-Augmented Generation)
- OpenAI (Embeddings + GPT-4)
- ChromaDB (Vector Database)
- Flask (API Server)
- Python (Backend)

**You're ready to go!** 🚀
