"""
Utility functions for parsing historical date strings (including BCE/CE and ranges).

We keep this intentionally heuristic-based because your history data includes:
  - "1867"
  - "247 BCE"
  - "1st century BCE–2nd century CE"
  - "19th–early 20th century"
  - "1869–1880s"
  - "993–1070 CE"
etc.
"""

from __future__ import annotations

import re
from typing import Optional, Tuple


_DASHES = ["–", "—", "-"]


def parse_year_range(date_str: str) -> Tuple[Optional[int], Optional[int]]:
    """
    Returns (start_year, end_year) if detectable.
    BCE years are returned as negative integers (e.g., 247 BCE -> -247).
    """
    if not date_str:
        return None, None

    s = str(date_str).strip()
    if not s or s.lower() == "nan":
        return None, None

    # Normalize dashes
    for d in _DASHES:
        s = s.replace(d, "-")

    s_clean = s.lower()

    # Explicit year ranges like "1944-1948" or "993-1070 ce"
    m = re.search(r"(?P<a>\d{3,4})\s*-\s*(?P<b>\d{2,4})", s_clean)
    if m:
        a = int(m.group("a"))
        b_raw = m.group("b")
        b = int(b_raw)
        # handle short end years like 1869-80 (not present now, but safe)
        if len(b_raw) == 2 and len(m.group("a")) == 4:
            b = int(str(a)[:2] + b_raw)

        # BCE/CE marker
        if "bce" in s_clean:
            return -a, -b
        return a, b

    # Single explicit year (4 digits) anywhere
    m = re.search(r"\b(\d{4})\b", s_clean)
    if m and "century" not in s_clean:
        y = int(m.group(1))
        if "bce" in s_clean:
            return -y, -y
        return y, y

    # BCE single year like "247 bce" or "543 bce"
    m = re.search(r"\b(\d{1,4})\s*bce\b", s_clean)
    if m:
        y = int(m.group(1))
        return -y, -y

    # CE single year like "1505" already covered; handle "1505 ce"
    m = re.search(r"\b(\d{1,4})\s*ce\b", s_clean)
    if m:
        y = int(m.group(1))
        return y, y

    # Century patterns: "3rd century bce", "1st century ce", "13th–15th century"
    # We map century N CE -> start year (N-1)*100, BCE -> -N*100
    def century_to_start(cent: int, is_bce: bool) -> int:
        if is_bce:
            return -(cent * 100)
        return (cent - 1) * 100

    # Range of centuries like "13th-15th century ce" or "17th-18th century"
    m = re.search(r"(\d{1,2})(st|nd|rd|th)\s*century\s*([a-z ]*)-\s*(\d{1,2})(st|nd|rd|th)\s*century", s_clean)
    if m:
        c1 = int(m.group(1))
        c2 = int(m.group(4))
        is_bce = "bce" in s_clean
        # if it mentions CE explicitly, use CE; if BCE present, BCE dominates
        start = century_to_start(c1, is_bce)
        end = century_to_start(c2, is_bce) + (99 if not is_bce else 0)  # rough
        return start, end

    # Single century like "4th century ce" or "3rd century bce"
    m = re.search(r"(\d{1,2})(st|nd|rd|th)\s*century", s_clean)
    if m:
        c = int(m.group(1))
        is_bce = "bce" in s_clean
        start = century_to_start(c, is_bce)
        end = start + (99 if not is_bce else 0)
        return start, end

    # Fuzzy phrases like "19th–early 20th century", "late 19th–early 20th century"
    m = re.search(r"(early|late)?\s*(\d{1,2})(st|nd|rd|th)\s*century\s*-\s*(early|late)?\s*(\d{1,2})(st|nd|rd|th)\s*century", s_clean)
    if m:
        c1 = int(m.group(2))
        c2 = int(m.group(5))
        start = (c1 - 1) * 100
        end = (c2 - 1) * 100 + 99
        return start, end

    # "1869-1880s"
    m = re.search(r"(\d{4})\s*-\s*(\d{3,4})s", s_clean)
    if m:
        a = int(m.group(1))
        b = int(m.group(2))
        return a, b + 9

    # If we cannot parse, return None
    return None, None


def year_for_ordering(date_str: str) -> Optional[int]:
    """
    Convenience: return a single year (start year) used for comparisons.
    """
    start, _ = parse_year_range(date_str)
    return start


