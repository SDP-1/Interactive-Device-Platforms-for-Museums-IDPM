# Persona Mode Documentation

## Overview

**Persona Mode** allows museum visitors to have immersive conversations with historical figures (Ancient Sri Lankan Kings) from the museum's collection. The system uses RAG (Retrieval-Augmented Generation) to ensure responses are grounded in historical facts while maintaining an engaging, in-character dialogue.

---

## Features

✅ **5 Historical Personas Available:**

- **Pandukabhaya** (437-367 BCE) - Founder of Anuradhapura
- **Devanampiya Tissa** (307-267 BCE) - Introduced Buddhism to Sri Lanka
- **Dutugemunu** (161-137 BCE) - National hero who reunified Sri Lanka
- **Valagamba** (103-77 BCE) - Preserved Buddhist teachings
- **Parakramabahu I** (1153-1186 CE) - Great irrigator and builder

✅ **Multilingual Support:** English and Sinhala

✅ **In-Character Responses:** Kings speak in first person with authentic historical context

✅ **RAG-Based Grounding:** All responses based on historical data from Ancient_Kings.csv

✅ **Session Management:** Maintains context across conversations

---

## Architecture

### Data Flow

1. **User selects a persona** (king_id)
2. **User asks question** in English or Sinhala
3. **System retrieves context** from vector database (Qdrant)
4. **LLM generates in-character response** using retrieved historical facts
5. **Response returned** to user in requested language

### Components

```
museum_ai/
├── data/
│   └── Ancient_Kings.csv          # Persona dataset (5 kings)
├── ingestion/
│   └── ingest_personas.py         # Ingests personas into Qdrant
├── rag/
│   ├── persona_retriever.py       # Retrieves persona context
│   └── persona_generator.py       # Generates in-character responses
└── api/
    └── main.py                    # FastAPI endpoints for persona mode
```

---

## API Endpoints

### 1. List Available Personas

**GET** `/personas?language=en`

Returns list of all available historical figures.

**Response:**

```json
{
  "personas": [
    {
      "king_id": "Kin001",
      "king_name": "Pandukabhaya",
      "reign_period": "437 BCE – 367 BCE",
      "capital_city": "Anuradhapura"
    }
    // ... more personas
  ],
  "count": 5
}
```

### 2. Get Persona Details

**GET** `/persona/{king_id}?language=en`

Returns detailed information about a specific persona.

**Example:** `/persona/Kin005?language=en`

**Response:**

```json
{
  "king_id": "Kin005",
  "king_name": "Parakramabahu I",
  "reign_period": "1153 CE – 1186 CE",
  "capital_city": "Polonnaruwa",
  "text": "King Name: Parakramabahu I\nReign Period: 1153 CE – 1186 CE\n..."
}
```

### 3. Ask Persona a Question

**POST** `/ask-persona`

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
  "answer": "I take great pride in my irrigation works! During my reign, I built the magnificent Parakrama Samudra, ensuring that not a single drop of rainwater would flow to the sea without serving my people. These reservoirs transformed our agricultural lands and brought prosperity to the kingdom. My engineers were among the finest in the world.",
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

---

## Setup Instructions

### Step 1: Ingest Persona Data

Before using Persona Mode, you must ingest the persona data into Qdrant:

**Windows:**

```bash
ingest_personas.bat
```

**Or manually:**

```bash
python ingestion/ingest_personas.py
```

**What happens:**

- Reads `data/Ancient_Kings.csv`
- Creates embeddings for each persona (English + Sinhala)
- Stores in Qdrant collection named `personas`
- Creates ~10 vector points (5 kings × 2 languages)

### Step 2: Start the Server

```bash
start_server.bat
```

### Step 3: Test Persona Mode

Use the API or integrate with your Flutter app:

```bash
# List personas
curl http://localhost:8000/personas?language=en

# Ask a question
curl -X POST http://localhost:8000/ask-persona \
  -H "Content-Type: application/json" \
  -d '{
    "king_id": "Kin005",
    "question": "What was your greatest achievement?",
    "language": "en"
  }'
```

---

## Example Conversations

### English Conversation with Parakramabahu I

**User:** "Hello"

**Parakramabahu I:** "Greetings, visitor. I am Parakramabahu I, who ruled Sri Lanka during 1153 CE – 1186 CE. I am honored to share the stories of my reign and the glory of our kingdom. What would you like to know?"

**User:** "Tell me about your irrigation projects"

**Parakramabahu I:** "I take great pride in my irrigation works! During my reign, I built the magnificent Parakrama Samudra, ensuring that not a single drop of rainwater would flow to the sea without serving my people. These reservoirs transformed our agricultural lands and brought prosperity to the kingdom."

---

### Sinhala Conversation with Dutugemunu

**User:** "ආයුබෝවන්"

**Dutugemunu:** "ආයුබෝවන්, අමුත්තා. මම දුටුගැමුණු, 161 BCE – 137 BCE කාලයේ ශ්‍රී ලංකාව පාලනය කළ රජතුමා. මගේ රාජ්‍යයේ කතා සහ අපේ රාජධානියේ තේජස බෙදා ගැනීමට මට ගෞරවයක්. ඔබ දැන ගැනීමට කැමති කුමක්ද?"

**User:** "ඔබේ යුද්ධ ගැන කියන්න"

**Dutugemunu:** "මගේ මහා හමුදාව සමඟ මම ශ්‍රී ලංකාව එක්සත් කිරීමේ ගෞරවනීය කාර්යය සාර්ථක කළෙමි. එළාර රජු සමඟ වූ මගේ සටන ඉතිහාසයේ කැපී පෙනේ..."

---

## Persona Behavior

### In-Character Guidelines

The personas follow these rules:

1. **First Person:** Always speak as "I", "my", "we" (royal we)
2. **Historical Accuracy:** Only use facts from the database
3. **Respectful Tone:** Maintain royal dignity while being welcoming
4. **Educational:** Share knowledge in an engaging, storytelling manner
5. **Humble Pride:** Proud of achievements without arrogance
6. **Cultural Context:** Reference the historical period naturally

### Handling Unknown Questions

If asked about something not in their historical context:

**English:** "I cannot speak of matters beyond my knowledge."

**Sinhala:** "මගේ දැනුමෙන් ඔබ්බට වන කරුණු ගැන මට කතා කළ නොහැක."

---

## Technical Details

### Vector Database (Qdrant)

**Collection:** `personas`

**Structure:**

```
Point {
  id: int
  vector: [768-dimensional embedding]
  payload: {
    king_id: "Kin001"
    king_name: "Pandukabhaya"
    reign_period: "437 BCE – 367 BCE"
    capital_city: "Anuradhapura"
    text: "Full context about the king..."
    language: "en" or "si"
  }
}
```

### Embedding Model

Uses OpenAI's `text-embedding-3-small` (768 dimensions) for multilingual support.

### Generation Model

Uses OpenAI's `gpt-4o-mini` with specialized persona prompts (temperature=0.8 for narrative style).

---

## Integration with Flutter App

### Workflow

1. **Show persona selection screen:**

   - Call `GET /personas` to list available kings
   - Display cards with king name, period, capital

2. **User selects a persona:**

   - Call `GET /persona/{king_id}` to show detailed bio
   - Enter "conversation mode"

3. **User asks questions:**
   - Send `POST /ask-persona` with king_id, question, language
   - Display in-character responses
   - Maintain chat UI similar to artifact mode

### UI Recommendations

- **Persona Card:** Show portrait/illustration + name + reign period
- **Chat Interface:** Differentiate from artifact mode with royal theme
- **Toggle Button:** "Talk to Guide" vs "Talk to King"
- **Language Switch:** EN/SI toggle

---

## Error Handling

### Common Errors

**Persona Not Found:**

```json
{
  "answer": "Persona not found.",
  "rejected": true,
  "reason": "PERSONA_NOT_FOUND"
}
```

**Internal Error:**

```json
{
  "answer": "An error occurred while processing your question.",
  "rejected": true,
  "reason": "INTERNAL_ERROR"
}
```

---

## Future Enhancements

- [ ] Add more historical figures (queens, generals, monks)
- [ ] Implement voice mode (TTS with royal voice)
- [ ] Add conversation memory (multi-turn context)
- [ ] Link personas to specific artifacts
- [ ] Tamil language support
- [ ] Historical reenactment mode (AR integration)

---

## Testing

### Manual Testing Checklist

- [ ] List personas endpoint works
- [ ] Get persona details works
- [ ] English greeting works
- [ ] Sinhala greeting works
- [ ] Question about reign/achievements works
- [ ] Question about capital/era works
- [ ] Out-of-context question handled gracefully
- [ ] Error handling works

### Sample Test Questions

**For Parakramabahu I (Kin005):**

- "Tell me about your irrigation projects"
- "What was your capital city?"
- "How did you unify Sri Lanka?"

**For Dutugemunu (Kin003):**

- "Tell me about your battle with King Elara"
- "What monuments did you build?"
- "Why are you considered a national hero?"

---

## Troubleshooting

### Issue: Personas not loading

**Solution:** Run `ingest_personas.bat` to populate Qdrant

### Issue: Empty responses

**Check:**

1. Qdrant connection (QDRANT_URL, QDRANT_API_KEY in .env)
2. Collection exists: `qdrant.collection_exists("personas")`
3. CSV file exists: `data/Ancient_Kings.csv`

### Issue: Wrong language in response

**Check:** Request body has correct `"language": "en"` or `"si"`

---

## Support

For issues or questions:

- Check server logs: `uvicorn` output
- Verify environment variables in `.env`
- Test endpoints with curl or Postman
- Review persona_generator.py prompt templates

---

**Built with ❤️ for Sri Lankan cultural heritage preservation**
