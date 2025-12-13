# Museum AI Guide

An intelligent, multilingual museum guide system powered by AI, RAG (Retrieval-Augmented Generation), and vector search. Visitors can scan QR codes to view artifact information and ask questions in Sinhala or English using **AI Mode**, or converse with historical figures using **Persona Mode**.

## 🎯 Features

### Artifact Guide Mode

- **QR Code Scanning**: Instant artifact information display
- **AI-Powered Q&A**: Ask questions about artifacts in Sinhala or English
- **Multilingual Support**: Full support for both Sinhala and English
- **RAG System**: Accurate, context-aware answers using GPT-4o-mini
- **Question Classification**: Automatically rejects unrelated questions
- **Vector Search**: Fast semantic retrieval using Qdrant vector database

### 👑 Persona Mode (NEW!)

- **Historical Conversations**: Talk to 5 ancient Sri Lankan kings
- **In-Character Responses**: Kings speak in first person with authentic historical context
- **Immersive Storytelling**: Engaging narratives about their reign and achievements
- **Grounded in Facts**: All responses based on historical data
- **Available Personas:**
  - **Pandukabhaya** (437-367 BCE) - Founder of Anuradhapura
  - **Devanampiya Tissa** (307-267 BCE) - Introduced Buddhism to Sri Lanka
  - **Dutugemunu** (161-137 BCE) - National hero who reunified Sri Lanka
  - **Valagamba** (103-77 BCE) - Preserved Buddhist teachings
  - **Parakramabahu I** (1153-1186 CE) - Great irrigator and builder

📖 **For detailed Persona Mode documentation, see [PERSONA_MODE.md](PERSONA_MODE.md)**

## 🏗️ Architecture

```
┌─────────────┐
│ Flutter App │
│  (Visitor)  │
└──────┬──────┘
       │
       │ 1. Scan QR Code → GET /artifact/{id}
       │ 2. Ask Question → POST /ask
       │
┌──────▼──────────────────────────────────────┐
│         FastAPI Backend (main.py)           │
│  ┌──────────────────────────────────────┐  │
│  │  Step 1: Classifier (classifier.py)  │  │
│  │  - Validates question relevance      │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  Step 2: Retriever (retriever.py)    │  │
│  │  - Semantic search in Qdrant         │  │
│  │  - Filters by artifact_id & language │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  Step 3: Generator (generator.py)    │  │
│  │  - GPT-4o-mini with RAG context       │  │
│  │  - Multilingual response generation   │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
       │
       │
┌──────▼──────────────────────────────────────┐
│      Qdrant Vector Database (Cloud)         │
│  - Embeddings: text-embedding-3-small       │
│  - Collection: "artifacts"                  │
│  - Metadata: artifact_id, language, text    │
└─────────────────────────────────────────────┘
```

## 📁 Project Structure

```
museum_ai/
├── api/
│   └── main.py              # FastAPI application with endpoints
├── data/
│   └── artifacts.csv        # Artifact database (CSV format)
├── ingestion/
│   └── ingest_artifacts.py  # Script to load artifacts into Qdrant
├── rag/
│   ├── classifier.py        # Question relevance classifier
│   ├── embedder.py          # Text embedding utilities
│   ├── generator.py         # Answer generation with GPT-4o-mini
│   └── retriever.py         # Vector search and context retrieval
├── utils/
│   └── text_utils.py        # Text processing utilities
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## 🚀 Quick Start

For detailed setup and run instructions, see **[SETUP.md](SETUP.md)**.

### Quick Setup Steps:

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Create and activate venv (Windows, project root):**

```bash
python -m venv .venv
.venv\Scripts\activate
```

Then upgrade pip and install deps:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

2. **Configure environment variables:**
   Create `.env` file with your API keys (see SETUP.md for details)

3. **Ingest artifacts:**

   ```bash
   python ingestion/ingest_artifacts.py
   ```

4. **Ingest personas (for Persona Mode):**

   ```bash
   python ingestion/ingest_personas.py
   ```

   Or use the batch file:

   ```bash
   ingest_personas.bat
   ```

5. **Start the server:**

   ```bash
   uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Access Swagger UI:**
   Open http://localhost:8000/docs in your browser

**📖 For complete setup guide, API documentation links, and troubleshooting, see [SETUP.md](SETUP.md)**

## 📡 API Endpoints

### `GET /`

Root endpoint with API information.

### `GET /health`

Health check endpoint. Returns system status.

**Response:**

```json
{
  "status": "healthy",
  "artifacts_loaded": 2,
  "personas_loaded": 5,
  "data_path": "data/artifacts.csv",
  "personas_path": "data/Ancient_Kings.csv"
}
```

### `GET /artifact/{artifact_id}`

Get artifact information when QR code is scanned.

**Parameters:**

- `artifact_id`: Artifact identifier
- `language` (query param): "en" or "si" (default: "en")

**Response:**

```json
{
  "artifact_id": "ART001",
  "name": "Ancient Sinhalese Sword",
  "period": "4th Century CE",
  "origin": "Anuradhapura Kingdom",
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
  "question": "What was this sword used for?",
  "language": "en"
}
```

**Response (Success):**

```json
{
  "answer": "This sword was primarily used for ceremonial purposes...",
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

## 👑 Persona Mode API Endpoints

### `GET /personas`

Get list of available historical personas (kings).

**Parameters:**

- `language` (query): "en" or "si" (default: "en")

**Response:**

```json
{
  "personas": [
    {
      "king_id": "Kin005",
      "king_name": "Parakramabahu I",
      "reign_period": "1153 CE – 1186 CE",
      "capital_city": "Polonnaruwa"
    }
  ],
  "count": 5
}
```

### `GET /persona/{king_id}`

Get detailed information about a specific persona.

**Example:** `/persona/Kin005?language=en`

**Response:**

```json
{
  "king_id": "Kin005",
  "king_name": "Parakramabahu I",
  "reign_period": "1153 CE – 1186 CE",
  "capital_city": "Polonnaruwa",
  "text": "Full biography..."
}
```

### `POST /ask-persona`

Converse with a historical figure in their voice.

**Request Body:**

```json
{
  "king_id": "Kin005",
  "question": "Tell me about your irrigation projects",
  "language": "en"
}
```

**Response:**

```json
{
  "answer": "I take great pride in my irrigation works! During my reign, I built the magnificent Parakrama Samudra...",
  "rejected": false,
  "reason": null,
  "persona": {
    "king_id": "Kin005",
    "king_name": "Parakramabahu I",
    "reign_period": "1153 CE – 1186 CE",
    "capital_city": "Polonnaruwa"
  }
}
```

📖 **See [PERSONA_MODE.md](PERSONA_MODE.md) for complete documentation**

---

🔄 Workflow

1. **Visitor scans QR code** → Flutter app calls `GET /artifact/{id}`
2. **Visitor asks question** → Flutter app calls `POST /ask` with:
   - `artifact_id`: From QR code
   - `question`: User's question
   - `language`: "en" or "si"
3. **Backend processing**:
   - Validates artifact exists
   - Classifies question relevance
   - Retrieves relevant context from Qdrant
   - Generates answer using GPT-4o-mini
4. **Response** → Flutter app displays text and speaks answer aloud

🛠️ Components

### Classifier (`rag/classifier.py`)

Uses GPT-4o-mini to determine if a question is related to the artifact. Returns `True` if relevant, `False` otherwise.

### Retriever (`rag/retriever.py`)

- Embeds the question using OpenAI
- Searches Qdrant for top-k relevant chunks
- Filters by `artifact_id` and `language`
- Returns combined context text

### Generator (`rag/generator.py`)

- Takes question, context, and language
- Uses GPT-4o-mini with RAG context
- Generates multilingual, accurate answers
- Enforces strict context-based responses

### Embedder (`rag/embedder.py`)

Utility functions for generating embeddings using OpenAI's `text-embedding-3-small` model.

### Text Utils (`utils/text_utils.py`)

- Text cleaning and normalization
- Text chunking for embeddings
- Language detection (basic heuristic)
- Text field combination

🔒 Safety Features

- **Question Classification**: Rejects unrelated questions
- **Context Filtering**: Only searches within the scanned artifact
- **Language Isolation**: Separate embeddings for Sinhala and English
- **Controlled Responses**: LLM instructed to only use provided context
- **Error Handling**: Graceful error messages in both languages

📝 Example Usage

### English Question

```bash
curl -X POST "http://localhost:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{
    "artifact_id": "ART001",
    "question": "What period does this sword belong to?",
    "language": "en"
  }'
```

### Sinhala Question

```bash
curl -X POST "http://localhost:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{
    "artifact_id": "ART001",
    "question": "මෙම කඩුව කොයි කාලේද?",
    "language": "si"
  }'
```

🧪 Testing
Interactive API Documentation

- **Swagger UI**: http://localhost:8000/docs (Recommended - Test endpoints directly)
- **ReDoc**: http://localhost:8000/redoc (Readable documentation)

Test Questions
See **[TEST_QUESTIONS.md](TEST_QUESTIONS.md)** for comprehensive test questions covering all artifacts.

📦 Dependencies

- `fastapi`: Web framework
- `uvicorn`: ASGI server
- `pandas`: CSV processing
- `openai`: OpenAI API client
- `qdrant-client`: Qdrant vector database client
- `tiktoken`: Token counting
- `python-dotenv`: Environment variable management
- `langchain-text-splitters`: Text chunking utilities
