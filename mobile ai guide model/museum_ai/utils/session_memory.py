import json
import os
from datetime import datetime
from difflib import SequenceMatcher
from typing import Any
from urllib import error, parse, request

from dotenv import load_dotenv

load_dotenv()

SESSION_BACKEND_BASE_URL = os.getenv("SESSION_BACKEND_BASE_URL", "").rstrip("/")
SESSION_MEMORY_MAX_HISTORY = int(os.getenv("SESSION_MEMORY_MAX_HISTORY", "8"))
SIMILARITY_THRESHOLD = float(os.getenv("SESSION_SIMILARITY_THRESHOLD", "0.85"))


def _normalize_text(value: str) -> str:
    return " ".join((value or "").strip().lower().split())


def _similarity_score(text_a: str, text_b: str) -> float:
    normalized_a = _normalize_text(text_a)
    normalized_b = _normalize_text(text_b)
    if not normalized_a or not normalized_b:
        return 0.0

    ratio = SequenceMatcher(None, normalized_a, normalized_b).ratio()

    tokens_a = set(normalized_a.split())
    tokens_b = set(normalized_b.split())
    token_overlap = (len(tokens_a.intersection(tokens_b)) / len(tokens_a.union(tokens_b))) if (tokens_a and tokens_b) else 0.0

    return max(ratio, token_overlap)


def _http_get_json(url: str, timeout_seconds: int = 8) -> dict[str, Any] | None:
    try:
        req = request.Request(url=url, method="GET")
        with request.urlopen(req, timeout=timeout_seconds) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else None
    except (error.URLError, error.HTTPError, TimeoutError, json.JSONDecodeError):
        return None


def _http_post_json(url: str, payload: dict[str, Any], timeout_seconds: int = 8) -> dict[str, Any] | None:
    try:
        data = json.dumps(payload).encode("utf-8")
        req = request.Request(
            url=url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with request.urlopen(req, timeout=timeout_seconds) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else None
    except (error.URLError, error.HTTPError, TimeoutError, json.JSONDecodeError):
        return None


def fetch_session_history(
    session_id: str,
    reference_type: str,
    reference_id: str | None = None,
) -> list[dict[str, Any]]:
    if not SESSION_BACKEND_BASE_URL or not session_id:
        return []

    context_type_map = {
        "artifact": "artifact",
        "king": "king",
        "persona": "king",
    }

    context_type = context_type_map.get((reference_type or "").strip().lower())

    if not context_type or not reference_id:
        return []

    url = (
        f"{SESSION_BACKEND_BASE_URL}/sessions/{parse.quote(session_id)}/chat/context/"
        f"{parse.quote(context_type)}/{parse.quote(reference_id)}"
    )

    payload = _http_get_json(url)

    interactions = ((payload or {}).get("data") or {}).get("interactions") or []
    if not isinstance(interactions, list):
        return []
    return interactions


def get_recent_interactions(interactions: list[dict[str, Any]], max_items: int | None = None) -> list[dict[str, Any]]:
    if not interactions:
        return []
    limit = max_items or SESSION_MEMORY_MAX_HISTORY
    return interactions[-limit:]


def is_repeated_question(question: str, interactions: list[dict[str, Any]], threshold: float | None = None) -> bool:
    if not question or not interactions:
        return False

    compare_threshold = threshold if threshold is not None else SIMILARITY_THRESHOLD
    normalized_question = _normalize_text(question)
    if not normalized_question:
        return False

    for interaction in interactions:
        previous_question = interaction.get("question") or ""
        if _similarity_score(normalized_question, previous_question) >= compare_threshold:
            return True

    return False


def build_history_block(interactions: list[dict[str, Any]]) -> str:
    if not interactions:
        return ""

    lines: list[str] = []
    for item in interactions:
        question = (item.get("question") or "").strip()
        reply = (item.get("reply") or "").strip()
        if question:
            lines.append(f"User: {question}")
        if reply:
            lines.append(f"Assistant: {reply}")

    return "\n".join(lines)


def save_chat_interaction(
    session_id: str,
    question: str,
    reply: str,
    reference_type: str,
    reference_id: str | None,
    language: str,
) -> bool:
    if not SESSION_BACKEND_BASE_URL or not session_id or not question or not reply:
        return False

    now_iso = datetime.utcnow().isoformat() + "Z"
    payload: dict[str, Any] = {
        "question": question,
        "reply": reply,
        "reference_type": reference_type,
        "reference_id": reference_id,
        "language": language,
        "question_time": now_iso,
        "reply_time": now_iso,
    }

    url = f"{SESSION_BACKEND_BASE_URL}/sessions/{parse.quote(session_id)}/chat"
    result = _http_post_json(url, payload)
    return bool((result or {}).get("success"))
