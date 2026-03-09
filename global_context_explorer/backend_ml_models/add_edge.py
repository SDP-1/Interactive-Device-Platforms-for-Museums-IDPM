"""
Append a new causal edge row to edges_template.csv.

Why:
- Training learns from positive edges in edges_template.csv.
- If you add a new local event, you should add at least 1-3 plausible GLOBAL_* -> LOC_* edges
  (with source references) so the model has supervised signal.
"""

import argparse
import csv
import re
from pathlib import Path


def _next_edge_id(edges_path: Path) -> str:
    max_n = 0
    if edges_path.exists():
        with edges_path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row:
                    continue
                m = re.match(r"EDGE_(\d+)", str(row[0]).strip())
                if m:
                    try:
                        max_n = max(max_n, int(m.group(1)))
                    except Exception:
                        pass
    return f"EDGE_{max_n + 1:03d}"


def main():
    p = argparse.ArgumentParser(description="Add a new causal edge to edges_template.csv")
    p.add_argument("--edges", type=str, default="edges_template.csv", help="Edges CSV file to append to")
    p.add_argument("--edge-id", type=str, default="", help="Optional edge id (e.g., EDGE_005). If omitted, auto-assign next.")
    p.add_argument("--source", type=str, required=True, help="Source node id (e.g., GLOBAL_001)")
    p.add_argument("--target", type=str, required=True, help="Target node id (e.g., LOC_043)")
    p.add_argument("--causal-description", type=str, required=True, help="How the global event influences the local event")
    p.add_argument("--directness", type=float, default=0.7, help="Directness score (0..1)")
    p.add_argument("--source-count", type=float, default=2, help="Number of sources supporting the link")
    p.add_argument("--max-sources", type=float, default=5, help="Max sources required")
    p.add_argument("--sources", type=str, default="", help="Source references (semicolon-separated)")
    args = p.parse_args()

    edges_path = Path(args.edges)
    edge_id = (args.edge_id or "").strip() or _next_edge_id(edges_path)

    # Ensure header exists
    if not edges_path.exists():
        edges_path.write_text(
            "edge_id,source_node_id,target_node_id,causal_description,directness_score,source_count,max_sources_required,source_references\n",
            encoding="utf-8",
        )

    row = [
        edge_id,
        args.source.strip(),
        args.target.strip(),
        args.causal_description.strip(),
        f"{float(args.directness):.3f}",
        f"{float(args.source_count):.3f}",
        f"{float(args.max_sources):.3f}",
        (args.sources or "").strip(),
    ]

    with edges_path.open("a", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(row)

    print(f"[add_edge] appended: {edge_id} ({args.source} -> {args.target}) -> {edges_path}")


if __name__ == "__main__":
    main()


