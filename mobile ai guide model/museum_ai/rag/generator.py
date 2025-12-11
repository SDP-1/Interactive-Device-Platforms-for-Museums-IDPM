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

Rules:
- Answer ONLY using the information provided in the context.
- If the question is general (like "what is this?", "tell me about this", "describe this artifact"), provide a comprehensive overview of the artifact including its name, period, origin, and key details.
- For specific questions, provide focused answers about that aspect of the artifact.
- If the answer is not found in the context, say: "I don't know that information." (English) or "මම එම තොරතුරු නොදනී." (Sinhala)
- Match the visitor's language (Sinhala or English) in your response.
- Be engaging, educational, and conversational.
- Keep answers concise but informative (2-4 sentences for specific questions, 3-5 for general overviews).
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




# What This Does
# Inputs:

# "මේ කඩුව කොයි කාලේද?"

# context extracted from your CSV columns (description_si + facts_si + faq_si)

# "si"

# Output:

# "මෙම කඩුව අනුරාධපුර රාජධානියේ 4 වන ශතවර්ෂයට අයත් ය."