"""
Build/refresh `nodes_from_history.csv` from a "History" CSV file.

Supports both:
  - `History.csv` (no header, 11 columns)
  - `History (1).csv` (no header, 11 columns, more rows, mixed date formats)

Output schema matches what the pipeline expects:
  node_id,node_type,event_name,date,location,description,purpose,exhibit_name,source_count,max_sources_required,source_references
"""

import argparse
import csv
from pathlib import Path
from typing import List, Dict, Optional


EXPECTED_COLUMNS = [
    "node_id",
    "node_type",
    "event_name",
    "date",
    "location",
    "description",
    "purpose",
    "exhibit_name",
    "source_count",
    "max_sources_required",
    "source_references",
]


def _normalize_node_type(raw: str) -> str:
    s = (raw or "").strip().lower()
    # your history uses "LocalEvent"
    if s in {"localevent", "local_event", "local"}:
        return "local"
    if s in {"global", "globalevent", "global_event"}:
        return "global"
    return s or "local"


def _normalize_date(raw: str) -> str:
    """
    Keep advanced formats as-is (BCE, centuries, ranges).
    Normalize simple year-only dates to YYYY-01-01 to match existing nodes file.
    """
    s = (raw or "").strip()
    # simple year like 1867
    if s.isdigit() and len(s) == 4:
        return f"{s}-01-01"
    # already ISO-ish
    if len(s) >= 10 and s[4] == "-" and s[7] == "-":
        return s
    # keep BCE/century/range strings as-is
    return s


def _safe_int(raw: str, default: int = 0) -> int:
    try:
        return int(str(raw).strip())
    except Exception:
        return default


def read_history_rows(history_path: Path) -> List[Dict]:
    """
    Reads history CSV which may or may not have a header.
    Returns list of dicts with EXPECTED_COLUMNS.
    """
    rows: List[Dict] = []

    with history_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        first = next(reader, None)
        if first is None:
            return rows

        has_header = [c.strip() for c in first] == EXPECTED_COLUMNS

        def row_to_dict(r: List[str]) -> Optional[Dict]:
            if len(r) < 11:
                return None
            r = r[:11]
            d = dict(zip(EXPECTED_COLUMNS, r))
            return d

        if has_header:
            # consume remaining lines
            for r in reader:
                d = row_to_dict(r)
                if d:
                    rows.append(d)
        else:
            # first line is a data row
            d0 = row_to_dict(first)
            if d0:
                rows.append(d0)
            for r in reader:
                d = row_to_dict(r)
                if d:
                    rows.append(d)

    return rows


def build_nodes(history_path: Path) -> List[Dict]:
    raw_rows = read_history_rows(history_path)
    out: List[Dict] = []

    for r in raw_rows:
        out.append({
            "node_id": (r.get("node_id") or "").strip(),
            "node_type": _normalize_node_type(r.get("node_type", "")),
            "event_name": (r.get("event_name") or "").strip(),
            "date": _normalize_date(r.get("date", "")),
            "location": (r.get("location") or "").strip(),
            "description": (r.get("description") or "").strip(),
            "purpose": (r.get("purpose") or "").strip(),
            "exhibit_name": (r.get("exhibit_name") or "").strip(),
            "source_count": _safe_int(r.get("source_count", 0), 0),
            "max_sources_required": _safe_int(r.get("max_sources_required", 5), 5),
            "source_references": (r.get("source_references") or "").strip(),
        })

    # drop empty ids
    out = [r for r in out if r.get("node_id")]
    return out


def write_nodes_csv(nodes: List[Dict], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=EXPECTED_COLUMNS)
        writer.writeheader()
        for row in nodes:
            writer.writerow(row)


def main():
    parser = argparse.ArgumentParser(description="Build nodes_from_history.csv from a History CSV")
    parser.add_argument("--history", type=str, default="History (1).csv", help="Input history CSV file")
    parser.add_argument("--out", type=str, default="nodes_from_history.csv", help="Output nodes CSV file")
    args = parser.parse_args()

    history_path = Path(args.history)
    out_path = Path(args.out)

    if not history_path.exists():
        raise SystemExit(f"History file not found: {history_path}")

    nodes = build_nodes(history_path)
    write_nodes_csv(nodes, out_path)

    print(f"[build_nodes] read {len(nodes)} rows from {history_path}")
    print(f"[build_nodes] wrote {out_path}")


if __name__ == "__main__":
    main()


