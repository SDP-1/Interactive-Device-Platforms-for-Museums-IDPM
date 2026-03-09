"""
Append a new LocalEvent row to a History CSV (default: History (1).csv),
then (optionally) rebuild nodes_from_history.csv so the pipeline can use it.

Why:
- The pipeline reads nodes_from_history.csv, not History (1).csv directly.
- This script lets you add a new event like "Establishment of the University of Ceylon"
  and immediately make the system recognize it.
"""

import argparse
import csv
import re
from pathlib import Path


def _next_loc_id(history_path: Path) -> str:
    """
    Find the next LOC_### id by scanning first column of the CSV.
    """
    max_n = 0
    if history_path.exists():
        with history_path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row:
                    continue
                m = re.match(r"LOC_(\d+)", str(row[0]).strip())
                if m:
                    try:
                        max_n = max(max_n, int(m.group(1)))
                    except Exception:
                        pass
    return f"LOC_{max_n + 1:03d}"


def main():
    p = argparse.ArgumentParser(description="Add a new LocalEvent to History CSV")
    p.add_argument("--history", type=str, default="History (1).csv", help="History CSV file to append to")
    p.add_argument("--node-id", type=str, default="", help="Optional node id (e.g., LOC_043). If omitted, auto-assign next.")
    p.add_argument("--event-name", type=str, required=True, help="Event name/title")
    p.add_argument("--date", type=str, required=True, help="Date (YYYY, YYYY-MM-DD, '247 BCE', '19th century', ranges, etc.)")
    p.add_argument("--location", type=str, required=True, help="Location")
    p.add_argument("--description", type=str, required=True, help="Description")
    p.add_argument("--purpose", type=str, default="", help="Purpose/category")
    p.add_argument("--exhibit", type=str, default="", help="Exhibit name")
    p.add_argument("--source-count", type=int, default=0, help="Number of sources")
    p.add_argument("--max-sources", type=int, default=5, help="Max sources required")
    p.add_argument("--sources", type=str, default="", help="Source references (semicolon-separated)")
    p.add_argument("--rebuild-nodes", action="store_true", help="Rebuild nodes_from_history.csv after adding")
    p.add_argument("--nodes-out", type=str, default="nodes_from_history.csv", help="Output nodes file (if rebuilding)")
    args = p.parse_args()

    history_path = Path(args.history)
    node_id = (args.node_id or "").strip() or _next_loc_id(history_path)

    row = [
        node_id,
        "LocalEvent",
        args.event_name.strip(),
        args.date.strip(),
        args.location.strip(),
        args.description.strip(),
        (args.purpose or "").strip(),
        (args.exhibit or "").strip(),
        str(int(args.source_count)),
        str(int(args.max_sources)),
        (args.sources or "").strip(),
    ]

    history_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Check for duplicates before appending
    if history_path.exists():
        with history_path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.reader(f)
            # Skip header if it exists (usually row 0 is a header in CSVs)
            # But in some of your CSVs it might not be. Let's just check the event name column (index 2)
            search_name = args.event_name.strip().lower()
            for row_in in reader:
                if len(row_in) > 2 and str(row_in[2]).strip().lower() == search_name:
                    print(f"[add_history_event] SKIPPED: Event '{args.event_name}' already exists as {row_in[0]}")
                    
                    # Even if we skip adding, we might still want to rebuild nodes to be safe
                    if args.rebuild_nodes:
                        from build_nodes_from_history import build_nodes, write_nodes_csv
                        nodes = build_nodes(history_path)
                        write_nodes_csv(nodes, Path(args.nodes_out))
                        print(f"[add_history_event] rebuilt nodes anyway: {args.nodes_out}")
                    return

    with history_path.open("a", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(row)

    print(f"[add_history_event] appended: {node_id} -> {history_path}")
    print(f"===ASSIGNED_NODE_ID==={node_id}===")

    if args.rebuild_nodes:
        # Local import to avoid hard dependency when used standalone
        from build_nodes_from_history import build_nodes, write_nodes_csv

        nodes = build_nodes(history_path)
        out_path = Path(args.nodes_out)
        write_nodes_csv(nodes, out_path)
        print(f"[add_history_event] rebuilt nodes: {out_path} (rows={len(nodes)})")


if __name__ == "__main__":
    main()


