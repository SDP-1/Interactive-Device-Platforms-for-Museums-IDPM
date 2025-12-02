import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GENERATION_MODEL = os.getenv("GENERATION_MODEL")

client = OpenAI(api_key=OPENAI_API_KEY)


# ------------------------------------------
# Classifier function:
# Returns "YES" → question is about artifact
# Returns "NO" → reject the question
# Returns "GREETING" → greeting or casual message
# ------------------------------------------
def is_related(question: str, artifact_summary: str) -> str:
    prompt = f"""
You are a classifier for a museum AI guide system.

Your task is to classify the visitor's message into one of three categories.

ARTIFACT SUMMARY:
{artifact_summary}

QUESTION:
{question}

Classify as GREETING if:
- Simple greetings ("hi", "hello", "hey", "හායි", "හලෝ")
- Casual conversation starters ("how are you", "what's up")
- Thank you messages ("thanks", "thank you", "ස්තූතියි")

Classify as YES if the question is:
- About this specific artifact (history, material, period, use, discovery, origin, cultural meaning, significance)
- A general question about the artifact ("what is this?", "tell me about this", "describe this", "what's this artifact?")
- Asking for details, facts, or stories related to the artifact
- In any language asking about "this", "මේක", "this artifact", referring to the current artifact

Classify as NO if the question is:
- About unrelated topics (politics, sports, weather, general knowledge not related to the artifact)
- About other artifacts not currently being viewed
- Personal advice or opinions unrelated to museum artifacts

Answer ONLY: YES, NO, or GREETING
"""

    response = client.chat.completions.create(
        model=GENERATION_MODEL,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    output = response.choices[0].message.content.strip().upper()

    return output




# Visitor asks:

# “මේ කඩුව කොයි කාලේද?”
# Artifact summary contains “Ancient Sword”.

# → classifier returns YES

# Visitor asks:

# “Sri Lanka president kawda?”

# → classifier returns NO
# → Your API should respond:

# “I can only answer questions about this artifact.”