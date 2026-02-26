import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GENERATION_MODEL = os.getenv("GENERATION_MODEL")
client = OpenAI(api_key=OPENAI_API_KEY)


# ---------------------------------------------------
# Generate the final answer using GPT-4o-mini + RAG
# ---------------------------------------------------
def generate_answer(question: str, context: str, language: str) -> str:
    system_instructions = """
You are a knowledgeable and friendly multilingual museum guide.

CRITICAL RULES:
1. Answer ONLY using the information provided in the context.
2. If the question is general (like "what is this?", "tell me about this", "describe this artifact"), provide a comprehensive overview of the artifact including its name, period, origin, and key details.
3. For specific questions, provide focused answers about that aspect of the artifact.
4. If the answer is not found in the context, say: "I don't know that information." (English) or "මම එම තොරතුරු නොදනී." (Sinhala).
5. Match the visitor's language (Sinhala or English) in your response.
6. Be engaging, educational, and conversational.
7. Keep answers concise but informative (2-4 sentences for specific questions, 3-5 for general overviews).
"""

    user_prompt = f"""
CONTEXT:
{context}

QUESTION:
{question}

LANGUAGE REQUESTED:
{language}

Provide a helpful answer based on the context above.
"""

    response = client.chat.completions.create(
        model=GENERATION_MODEL,
        messages=[
            {"role": "system", "content": system_instructions},
            {"role": "user", "content": user_prompt}
        ]
    )

    return response.choices[0].message.content.strip()


def generate_answer_with_memory(
    question: str,
    context: str,
    language: str,
    conversation_history: str = "",
    repeated_question: bool = False,
) -> str:
    memory_rule = (
        "10. If this question appears similar to a previous one, briefly acknowledge and add new insight instead of repeating the same explanation."
        if repeated_question
        else ""
    )

    system_instructions = f"""
You are a knowledgeable and friendly multilingual museum guide.

CRITICAL RULES:
1. You must answer ONLY using the information provided in the context. This is mandatory.
2. If the question is general (like \"what is this?\", \"tell me about this\", \"describe this artifact\"), provide a comprehensive overview of the artifact including its name, period, origin, and key details.
3. For specific questions, provide focused answers about that aspect of the artifact.
4. If the answer is not found in the context, say: \"I don't know that information.\" (English) or \"මම එම තොරතුරු නොදනී.\" (Sinhala).
5. Match the visitor's language (Sinhala or English) in your response.
6. Be engaging, educational, and conversational.
7. Keep answers concise but informative (2-4 sentences for specific questions, 3-5 for general overviews).
8. Use RECENT CONVERSATION to resolve follow-up references (like \"it\", \"that\", \"this one\", \"previous one\") when needed.
9. Keep continuity with earlier answers in RECENT CONVERSATION and avoid contradictions unless context requires a correction.
{memory_rule}
"""

    history_block = conversation_history or "No prior conversation history available."

    user_prompt = f"""
CONTEXT:
{context}

RECENT CONVERSATION:
{history_block}

QUESTION:
{question}

LANGUAGE REQUESTED:
{language}

Provide a helpful answer based on the context above.
"""

    response = client.chat.completions.create(
        model=GENERATION_MODEL,
        messages=[
            {"role": "system", "content": system_instructions},
            {"role": "user", "content": user_prompt}
        ]
    )

    return response.choices[0].message.content.strip()




# What This Does
# Inputs:

# "මේ කඩුව කොයි කාලේද?"

# context extracted from your CSV columns (description_si + facts_si + faq_si)

# "si"

# Output:

# "මෙම කඩුව අනුරාධපුර රාජධානියේ 4 වන ශතවර්ෂයට අයත් ය."