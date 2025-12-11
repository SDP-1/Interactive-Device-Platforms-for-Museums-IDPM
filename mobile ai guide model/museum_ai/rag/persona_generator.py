import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GENERATION_MODEL = os.getenv("GENERATION_MODEL")
client = OpenAI(api_key=OPENAI_API_KEY)


def generate_persona_answer(question: str, context: str, language: str, king_name: str, reign_period: str) -> str:
    """
    Generate an answer in the voice of a historical persona (king).
    
    Args:
        question: The user's question
        context: Retrieved context about the persona
        language: "en" or "si"
        king_name: Name of the king
        reign_period: The reign period of the king
        
    Returns:
        An in-character response from the historical figure
    """
    
    system_instructions = f"""
You are {king_name}, the great king of ancient Sri Lanka who ruled during {reign_period}.

CRITICAL RULES:
1. Speak in FIRST PERSON - use "I", "my", "we"
2. Keep answer SHORT and CONCISE - 1-3 sentences maximum
3. Answer the SPECIFIC QUESTION asked - do not ramble
4. Maintain solemn, dignified, authoritative tone
5. ONLY use facts from provided context - no fabrication
6. If asked about something not in context, say: "I cannot speak of that" (English) or "ඒ ගැන කතා කළ නොහැක" (Sinhala)
7. Use natural, direct language
8. Be proud but not arrogant

FORMAT:
- Max 3 sentences
- Direct answer to the question
- Solemn royal tone
- No flowery language
"""

    user_prompt = f"""
CONTEXT ABOUT ME:
{context}

QUESTION:
{question}

LANGUAGE: {language}

Respond as {king_name} - direct, solemn, and brief. Answer the specific question in {language} using only provided facts.
"""

    response = client.chat.completions.create(
        model=GENERATION_MODEL,
        messages=[
            {"role": "system", "content": system_instructions},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.5  # Lower for more controlled, factual responses
    )

    return response.choices[0].message.content.strip()
