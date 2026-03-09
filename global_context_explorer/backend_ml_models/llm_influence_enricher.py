"""
Optional LLM enrichment step for curator-friendly influence descriptions.

This is API-key gated and OFF by default.

Usage:
- Set env var `INFLUENCE_LLM_API_KEY` (or `OPENAI_API_KEY`) to enable.
- Optionally set:
  - `INFLUENCE_LLM_ENDPOINT` (default: OpenAI chat completions endpoint)
  - `INFLUENCE_LLM_MODEL` (default: gpt-4o-mini)
  - `INFLUENCE_LLM_MAX` (default: 5) max influences to enrich per run
"""

from __future__ import annotations

import os
import time
from typing import Dict, List, Optional

import requests


class InfluenceEnricher:
    def __init__(self, timeout: int = 25, rate_limit: float = 0.2):
        self.timeout = timeout
        self.rate_limit = rate_limit

    def is_enabled(self) -> bool:
        return bool(self._api_key())

    def max_enrich(self) -> int:
        try:
            return int(os.getenv("INFLUENCE_LLM_MAX", "5").strip())
        except Exception:
            return 5

    def enrich_description(
        self,
        local_event: Dict,
        global_event: Dict,
        mechanism: str,
        influence_type: str,
        evidence_snippets: Optional[List[str]] = None,
    ) -> Optional[str]:
        """
        Return a curator-friendly paragraph connecting global->local, or None on failure.
        """
        api_key = self._api_key()
        if not api_key:
            return None

        endpoint = os.getenv("INFLUENCE_LLM_ENDPOINT", "").strip() or "https://api.openai.com/v1/chat/completions"
        model = os.getenv("INFLUENCE_LLM_MODEL", "").strip() or "gpt-4o-mini"

        le_name = str(local_event.get("event_name", "") or local_event.get("title", "") or "").strip()
        le_date = str(local_event.get("date", "") or "").strip()
        le_loc = str(local_event.get("location", "") or "").strip()
        le_desc = str(local_event.get("description", "") or "").strip()

        ge_name = str(global_event.get("name", "") or global_event.get("event_name", "") or "").strip()
        ge_date = str(global_event.get("date", "") or "").strip()
        ge_loc = str(global_event.get("location", "") or "").strip()
        ge_desc = str(global_event.get("description", "") or "").strip()
        ge_url = str(global_event.get("source_url", "") or global_event.get("source_url", "") or "").strip()

        ev = evidence_snippets or []
        ev = [str(s).strip() for s in ev if str(s).strip()]
        ev = ev[:3]

        # Keep prompt small and focused; we want a single readable paragraph.
        system = (
            "You are a museum curator assistant. Write clear, factual explanations. "
            "Do not include wiki markup, template fields, or braces. "
            "Prefer concrete mechanisms (trade, policy, technology, colonial control, migration, war shocks)."
        )

        user = (
            f"Local event:\n- Title: {le_name}\n- Date: {le_date}\n- Location: {le_loc}\n- Description: {le_desc}\n\n"
            f"Global cause candidate:\n- Title: {ge_name}\n- Date: {ge_date}\n- Location: {ge_loc}\n- Raw description: {ge_desc}\n"
            + (f"- Source URL: {ge_url}\n" if ge_url else "")
            + (("\nEvidence snippets:\n" + "\n".join([f"- {s}" for s in ev]) + "\n") if ev else "\n")
            + f"\nTask: Write 2–4 sentences explaining how the global cause influenced the local event. "
              f"Label it as {influence_type.upper()} influence (direct if strong, indirect if mediated). "
              f"Use mechanism='{mechanism}'."
        )

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.3,
            "max_tokens": 220,
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        # Basic rate limiting to avoid hammering the endpoint
        time.sleep(self.rate_limit)
        try:
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=self.timeout)
            if resp.status_code != 200:
                return None
            data = resp.json() or {}
            # OpenAI-compatible chat completions shape:
            # { choices: [ { message: { content: "..." } } ] }
            choices = data.get("choices", []) or []
            if not choices:
                return None
            msg = choices[0].get("message", {}) or {}
            text = str(msg.get("content", "") or "").strip()
            return text or None
        except Exception:
            return None

    def _api_key(self) -> str:
        return (os.getenv("INFLUENCE_LLM_API_KEY", "") or os.getenv("OPENAI_API_KEY", "") or "").strip()

