import argparse
import csv
import sys
from pathlib import Path

def remove_event_by_id(history_path: Path, node_id: str):
    """
    Reads the history CSV, removes the row with the given node_id,
    and writes it back.
    """
    if not history_path.exists():
        print(f"[remove_history_event] Error: {history_path} does not exist.")
        return False

    rows = []
    found = False
    with history_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        for row in reader:
            if not row:
                continue
            if row[0].strip() == node_id.strip():
                found = True
                print(f"[remove_history_event] Removing: {row[0]} - {row[2] if len(row) > 2 else '?'}")
                continue
            rows.append(row)

    if not found:
        print(f"[remove_history_event] Warning: Node ID '{node_id}' not found in {history_path}")
        return False

    with history_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    
    print(f"[remove_history_event] Successfully updated {history_path}")
    return True

def main():
    p = argparse.ArgumentParser(description="Remove a LocalEvent from History CSV and optionally rebuild nodes")
    p.add_argument("--history", type=str, default="History (1).csv", help="History CSV file")
    p.add_argument("--node-id", type=str, required=True, help="Node ID to remove (e.g., LOC_043)")
    p.add_argument("--rebuild-nodes", action="store_true", help="Rebuild nodes_from_history.csv after removal")
    p.add_argument("--nodes-out", type=str, default="nodes_from_history.csv", help="Output nodes file")
    args = p.parse_args()

    history_path = Path(args.history)
    node_id = args.node_id.strip()

    if remove_event_by_id(history_path, node_id):
        if args.rebuild_nodes:
            try:
                from build_nodes_from_history import build_nodes, write_nodes_csv
                print(f"[remove_history_event] Rebuilding nodes to {args.nodes_out}...")
                nodes = build_nodes(history_path)
                write_nodes_csv(nodes, Path(args.nodes_out))
                print(f"[remove_history_event] Rebuild complete (rows={len(nodes)})")
            except Exception as e:
                print(f"[remove_history_event] Error during rebuild: {e}")
                sys.exit(1)
    else:
        # If not found, we don't necessarily fail the whole process if it's just a warning
        pass

if __name__ == "__main__":
    main()
