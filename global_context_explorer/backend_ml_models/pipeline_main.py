"""
Main Pipeline: Integrates all 7 layers
Complete end-to-end system for Global-Local Historical Influence Discovery
"""

import argparse
import csv
import pandas as pd
from typing import Dict, Optional
import re
import math
from pathlib import Path

# Import all layers
from layer0_curator_input import CuratorInputParser
from layer1_knowledge_collection import KnowledgeCollector
from layer2_candidate_generation import CandidateGenerator
from layer3_graph_construction import GraphConstructor
from layer4_gnn_reasoning import GNNReasoner
from layer5_constraint_scoring import ConstraintScorer
from layer6_path_construction import PathConstructor
from layer7_result_packaging import ResultPackager
from date_utils import year_for_ordering
from build_nodes_from_history import build_nodes, write_nodes_csv


class CausalLogicPipeline:
    """Complete 7-layer pipeline for causal link discovery."""
    
    def __init__(self, nodes_file: str, edges_file: str):
        """
        Initialize the complete pipeline.
        
        Args:
            nodes_file: Path to nodes CSV file
            edges_file: Path to edges CSV file
        """
        self.nodes_file = nodes_file
        self.edges_file = edges_file

        # Initialize all layers
        self.layer0 = CuratorInputParser()
        self.layer1 = KnowledgeCollector()
        self.layer2 = CandidateGenerator()
        self.layer3 = GraphConstructor(nodes_file, edges_file)
        self.layer4 = GNNReasoner(nodes_file, edges_file)
        self.layer5 = ConstraintScorer()
        self.layer6 = PathConstructor()
        self.layer7 = ResultPackager()
        
        # Load nodes for lookup
        self.nodes_df = pd.read_csv(nodes_file) if nodes_file else None
    
    def process(
        self,
        input_text: str,
        date: Optional[str] = None,
        location: Optional[str] = None,
        top_k: int = 10,
        local_event_override: Optional[Dict] = None,
        allow_adhoc: bool = False,
        auto_add_missing_local: bool = False,
        history_file: str = "History (1).csv",
    ) -> Dict:
        """
        Process curator input through all 7 layers.
        
        Args:
            input_text: Local event text
            date: Optional date
            location: Optional location
            top_k: Number of top results to return
        
        Returns:
            Complete results dictionary
        """
        print("=" * 80)
        print("Causal Logic Engine - Processing Request")
        print("=" * 80)
        print(f"\nInput: {input_text}")
        if date:
            print(f"Date: {date}")
        if location:
            print(f"Location: {location}")
        print("\n" + "-" * 80)
        
        # Layer 0: Curator Input
        print("\n[Layer 0] Parsing curator input...")
        query = self.layer0.parse(input_text, date, location)
        print(f"[OK] Parsed query: {query['local_event_text']}")
        print(f"  Entities: {query['entities']}")
        print(f"  Keywords: {query['keywords'][:5]}")
        
        # Find matching local event
        local_event_id, local_event_data = self._find_local_event(query)
        if not local_event_id:
            if auto_add_missing_local:
                add_result = self._auto_add_local_event(
                    input_text=input_text,
                    date=date,
                    location=location,
                    local_event_override=local_event_override,
                    history_file=history_file,
                )
                if not add_result.get("ok"):
                    return {
                        "error": add_result.get("error", "Failed to auto-add missing local event."),
                        "suggestion": add_result.get("suggestion", "Please add event manually and rerun."),
                    }

                local_event_id = add_result["node_id"]
                local_event_data = add_result["local_event_data"]
                print(f"[OK] Added new local event: {local_event_id} -> {history_file}")

            if not local_event_id and not allow_adhoc:
                return self._build_new_event_required_response(
                    input_text=input_text,
                    date=date,
                    location=location,
                    local_event_override=local_event_override,
                    history_file=history_file,
                )

            if not local_event_id:
                # Optional compatibility mode: allow ad-hoc local events when explicitly enabled.
                override = local_event_override or {}
                local_event_id = (override.get("id") or override.get("node_id") or "").strip()
                if not local_event_id:
                    slug = "".join([c for c in (input_text or "") if c.isalnum()])[:24]
                    local_event_id = f"ADHOC_{slug or 'LOCAL'}"

                title = (override.get("title") or override.get("event_name") or input_text or "").strip()
                local_event_data = {
                    "node_id": local_event_id,
                    "event_name": title,
                    "date": str(override.get("date") or override.get("start_date") or (date or "")).strip(),
                    "location": str(override.get("location") or (location or "")).strip(),
                    "description": str(override.get("description") or input_text or "").strip(),
                    "exhibit_name": str(override.get("exhibit_name") or "").strip(),
                    "source_url": str(override.get("source_url") or "").strip(),
                }

                print(f"[OK] Using ad-hoc local event: {local_event_id}")
        
        print(f"[OK] Found local event: {local_event_id}")
        
        # If curator didn't provide a date (or Layer 0 couldn't extract it),
        # derive it from the matched local event so temporal scoring works consistently.
        if not query.get('date_range'):
            ly = year_for_ordering(str(local_event_data.get('date', '') or ''))
            if ly is not None:
                query['date_range'] = {'start': str(local_event_data.get('date', '') or ''), 'end': str(local_event_data.get('date', '') or ''), 'year': ly}

        # Use the matched local event's canonical name/description for knowledge retrieval
        # (Exhibit names like "Tea Heritage Exhibit" are often too generic for Wikipedia search.)
        knowledge_text_parts = [
            str(local_event_data.get('event_name', '') or ''),
            str(local_event_data.get('description', '') or ''),
            str(local_event_data.get('exhibit_name', '') or ''),
        ]
        knowledge_text = " ".join([p for p in knowledge_text_parts if p]).strip()
        if knowledge_text:
            query['local_event_text'] = local_event_data.get('event_name', query.get('local_event_text', ''))
            # Re-extract better keywords/entities from the actual event context
            query['keywords'] = self.layer0._extract_keywords(knowledge_text)
            query['entities'] = self.layer0._extract_entities(knowledge_text)
        
        # Layer 1: Knowledge Collection
        print("\n[Layer 1] Collecting knowledge from sources...")
        evidence = self.layer1.collect(query)
        print(f"[OK] Collected {len(evidence['raw_text_evidence'])} evidence snippets")

        # Print top Wikipedia sources found (titles + urls) right after collection
        wiki_sources = []
        for key in ['wikipedia_snippets', 'wikipedia_extracts', 'wikipedia_search_results']:
            for item in evidence.get(key, []) or []:
                title = item.get('title') or item.get('name') or ''
                url = item.get('url') or ''
                if title:
                    wiki_sources.append((str(title), str(url)))
        # de-duplicate while preserving order
        seen = set()
        uniq_sources = []
        for t, u in wiki_sources:
            k = (t, u)
            if k in seen:
                continue
            seen.add(k)
            uniq_sources.append((t, u))

        if uniq_sources:
            print("[SOURCES] Wikipedia pages found:")
            for i, (t, u) in enumerate(uniq_sources[:5], 1):
                if u:
                    print(f"  {i}. {t} -> {u}")
                else:
                    print(f"  {i}. {t}")
        
        # Layer 2: Candidate Generation
        print("\n[Layer 2] Generating candidate global events...")
        # Fix Issue 3: Collect all local event names to filter out from global candidates
        local_event_names = []
        if self.nodes_df is not None:
            local_events = self.nodes_df[self.nodes_df['node_type'] == 'local']
            local_event_names = [str(row['event_name']) for _, row in local_events.iterrows() if pd.notna(row.get('event_name'))]
        # Also add the current local event name if available
        if local_event_data and local_event_data.get('event_name'):
            local_event_names.append(local_event_data['event_name'])
        candidates = self.layer2.generate_candidates(query, evidence, top_k=50, local_event_names=local_event_names)
        print(f"[OK] Generated {len(candidates)} candidate global events")
        
        # Layer 3: Graph Construction
        print("\n[Layer 3] Constructing graph...")
        graph = self.layer3.construct_subgraph(local_event_id, candidates, evidence, local_event_data=local_event_data)
        print(f"[OK] Constructed graph with {len(graph['nodes'])} nodes and {len(graph['edges'])} edges")
        
        # Layer 4: GNN Reasoning
        print("\n[Layer 4] Running GNN reasoning...")
        predictions = self.layer4.predict_links(graph, local_event_id, top_k=top_k)
        print(f"[OK] Generated {len(predictions)} GNN predictions")
        
        # Layer 5: Constraint + Evidence Scoring
        print("\n[Layer 5] Applying constraints and scoring...")
        scored_predictions = self.layer5.score_links(predictions, graph, evidence)
        print(f"[OK] Scored {len(scored_predictions)} predictions")
        
        # Layer 6: Path Construction
        print("\n[Layer 6] Constructing explanation paths...")
        paths = {}
        for prediction in scored_predictions[:top_k]:
            pred_id = prediction['global_event_id']
            explanation_paths = self.layer6.construct_paths(prediction, graph, max_paths=2)
            paths[pred_id] = explanation_paths
        print(f"[OK] Constructed paths for {len(paths)} predictions")
        
        # Layer 7: Result Packaging
        print("\n[Layer 7] Packaging results...")
        results = self.layer7.package_results(
            local_event_id,
            local_event_data,
            scored_predictions,
            paths,
            evidence
        )
        print("[OK] Results packaged")
        
        print("\n" + "=" * 80)
        print("Processing Complete!")
        print("=" * 80 + "\n")
        
        return results

    def _build_new_event_required_response(
        self,
        input_text: str,
        date: Optional[str],
        location: Optional[str],
        local_event_override: Optional[Dict] = None,
        history_file: str = "History (1).csv",
    ) -> Dict:
        """
        Return a deterministic response for unknown local events.
        We intentionally stop here to prevent accidental fuzzy matching to wrong LOC_* nodes.
        """
        override = local_event_override or {}
        title = (override.get("title") or override.get("event_name") or input_text or "").strip()
        dt = str(override.get("date") or override.get("start_date") or (date or "")).strip() or "YYYY"
        loc = str(override.get("location") or (location or "")).strip() or "Unknown location"
        desc = str(override.get("description") or input_text or "").strip()
        desc = desc.replace('"', "'")

        add_cmd = (
            f'python add_history_event.py --history "{history_file}" '
            f'--event-name "{title}" --date "{dt}" --location "{loc}" '
            f'--description "{desc}" --source-count 0 --max-sources 5 --rebuild-nodes'
        )
        run_cmd = f'python pipeline_main.py --input "{title}"'
        auto_cmd = (
            f'python pipeline_main.py --input "{title}" --date "{dt}" --location "{loc}" '
            f'--local-title "{title}" --local-description "{desc}" --auto-add-missing-local '
            f'--history "{history_file}"'
        )

        return {
            "error": "Local event not found in nodes/history. Processing stopped to avoid wrong fuzzy matching.",
            "suggestion": "Add this event to History (1).csv, rebuild nodes_from_history.csv, then run pipeline again.",
            "action_required": "add_local_event_first",
            "input_event": {
                "event_name": title,
                "date": dt if dt != "YYYY" else "",
                "location": loc if loc != "Unknown location" else "",
                "description": desc,
            },
            "commands": {
                "add_event_and_rebuild_nodes": add_cmd,
                "run_pipeline_after_add": run_cmd,
                "one_shot_auto_add_and_run": auto_cmd,
            },
        }

    def _refresh_after_nodes_update(self):
        """Reload nodes and graph-dependent layers after nodes CSV changes."""
        self.nodes_df = pd.read_csv(self.nodes_file) if self.nodes_file else None
        self.layer3 = GraphConstructor(self.nodes_file, self.edges_file)
        self.layer4 = GNNReasoner(self.nodes_file, self.edges_file)

    def _next_loc_id(self, history_path: Path) -> str:
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

    def _auto_add_local_event(
        self,
        input_text: str,
        date: Optional[str],
        location: Optional[str],
        local_event_override: Optional[Dict],
        history_file: str,
    ) -> Dict:
        """
        Auto-add a missing local event to history, rebuild nodes, reload pipeline layers,
        and return the newly created local event metadata.
        """
        try:
            override = local_event_override or {}
            title = (override.get("title") or override.get("event_name") or input_text or "").strip()
            if not title:
                return {"ok": False, "error": "Cannot auto-add local event: empty title."}

            event_date = str(override.get("date") or override.get("start_date") or (date or "")).strip()
            loc = str(override.get("location") or (location or "")).strip()
            desc = str(override.get("description") or input_text or "").strip()
            purpose = str(override.get("purpose") or "").strip()
            exhibit = str(override.get("exhibit_name") or "").strip()
            sources = str(override.get("sources") or "").strip()
            source_count = int(override.get("source_count", 0) or 0)
            max_sources = int(override.get("max_sources_required", 5) or 5)

            history_path = Path(history_file)
            history_path.parent.mkdir(parents=True, exist_ok=True)
            node_id = self._next_loc_id(history_path)

            row = [
                node_id,
                "LocalEvent",
                title,
                event_date,
                loc,
                desc,
                purpose,
                exhibit,
                str(source_count),
                str(max_sources),
                sources,
            ]
            with history_path.open("a", encoding="utf-8", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(row)

            nodes = build_nodes(history_path)
            write_nodes_csv(nodes, Path(self.nodes_file))
            self._refresh_after_nodes_update()

            return {
                "ok": True,
                "node_id": node_id,
                "local_event_data": {
                    "node_id": node_id,
                    "event_name": title,
                    "date": event_date,
                    "location": loc,
                    "description": desc,
                    "exhibit_name": exhibit,
                },
            }
        except Exception as e:
            return {
                "ok": False,
                "error": f"Failed to auto-add missing local event: {e}",
                "suggestion": "Check file paths and local event fields, then retry.",
            }
    
    def _find_local_event(self, query: Dict) -> tuple:
        """Find matching local event from database."""
        if self.nodes_df is None:
            return None, None

        locals_df = self.nodes_df[self.nodes_df["node_type"] == "local"].copy()
        if len(locals_df) == 0:
            return None, None

        def _norm(s: str) -> str:
            s = str(s or "").lower().strip()
            s = re.sub(r"[^a-z0-9\s]+", " ", s)
            s = re.sub(r"\s+", " ", s).strip()
            return s

        # Low-information tokens should not drive matching decisions.
        low_specific = {
            "the", "and", "for", "with", "from", "into", "under", "over", "about",
            "establishment", "introduction", "development", "expansion", "rise", "decline",
            "formation", "construction", "opening", "arrival", "migration", "impact", "effects",
            "transition", "growth", "reforms", "convention", "commission", "crisis",
            "bring", "brings", "bringing", "brought", "introduced", "introducing",
            "event", "history", "exhibit",
            "sri", "lanka", "ceylon", "colombo", "kandy",
        }

        def _signal_terms(text: str):
            toks = re.findall(r"[a-z0-9]+", _norm(text))
            return [t for t in toks if len(t) >= 4 and t not in low_specific]

        search_text = _norm(query.get("local_event_text", ""))
        if not search_text:
            return None, None

        # 1) Strict exact match on event name / exhibit name.
        for _, row in locals_df.iterrows():
            ev = _norm(row.get("event_name", ""))
            ex = _norm(row.get("exhibit_name", ""))
            if search_text == ev or search_text == ex:
                return row["node_id"], {
                    "node_id": row["node_id"],
                    "event_name": row["event_name"],
                    "date": str(row["date"]),
                    "location": row.get("location", ""),
                    "description": row.get("description", ""),
                    "exhibit_name": row.get("exhibit_name", ""),
                }

        # 2) Deterministic containment with high-signal term checks.
        query_terms = _signal_terms(search_text)
        if not query_terms:
            # Refuse weak/generic matching to avoid accidental wrong LOC mapping.
            return None, None

        candidates = []
        for _, row in locals_df.iterrows():
            ev = _norm(row.get("event_name", ""))
            ex = _norm(row.get("exhibit_name", ""))
            hay = f"{ev} {ex}"

            if search_text in hay or ev in search_text or ex in search_text:
                matched_terms = sum(1 for t in query_terms if t in hay)
                # Require substantial overlap, but allow single-signal matches (e.g., "buddhism ...")
                if len(query_terms) <= 1:
                    required_terms = 1
                else:
                    required_terms = max(2, math.ceil(0.6 * len(query_terms)))
                if matched_terms >= required_terms:
                    candidates.append((row, matched_terms))

        if len(candidates) == 1:
            row = candidates[0][0]
            return row["node_id"], {
                "node_id": row["node_id"],
                "event_name": row["event_name"],
                "date": str(row["date"]),
                "location": row.get("location", ""),
                "description": row.get("description", ""),
                "exhibit_name": row.get("exhibit_name", ""),
            }

        # 3) Conservative fallback: all signal terms must match exactly one local row.
        strict = []
        for _, row in locals_df.iterrows():
            ev = _norm(row.get("event_name", ""))
            ex = _norm(row.get("exhibit_name", ""))
            hay = f"{ev} {ex}"
            if all(t in hay for t in query_terms):
                strict.append(row)

        if len(strict) == 1:
            row = strict[0]
            return row["node_id"], {
                "node_id": row["node_id"],
                "event_name": row["event_name"],
                "date": str(row["date"]),
                "location": row.get("location", ""),
                "description": row.get("description", ""),
                "exhibit_name": row.get("exhibit_name", ""),
            }

        # No safe unique match.
        return None, None


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='7-Layer Causal Logic Engine for Historical Influence Discovery'
    )
    parser.add_argument(
        '--nodes',
        type=str,
        default='nodes_from_history.csv',
        help='Path to nodes CSV file'
    )
    parser.add_argument(
        '--edges',
        type=str,
        default='edges_template.csv',
        help='Path to edges CSV file'
    )
    parser.add_argument(
        '--input',
        type=str,
        help='Local event text or exhibit name'
    )
    parser.add_argument(
        '--date',
        type=str,
        help='Optional date (YYYY-MM-DD or YYYY)'
    )
    parser.add_argument(
        '--location',
        type=str,
        help='Optional location'
    )
    parser.add_argument(
        '--top-k',
        type=int,
        default=10,
        help='Number of top results to return'
    )
    parser.add_argument(
        '--history',
        type=str,
        default='History (1).csv',
        help='Path to History CSV used when auto-adding missing local events'
    )
    parser.add_argument(
        '--allow-adhoc',
        action='store_true',
        help='Allow ad-hoc local events when no event exists in History/nodes (disabled by default)'
    )
    parser.add_argument(
        '--auto-add-missing-local',
        action='store_true',
        help='If local event is missing, auto-add it to History, rebuild nodes, then continue in one run'
    )
    parser.add_argument(
        '--json-output',
        action='store_true',
        help='Output results in a JSON block with markers for machine parsing'
    )

    # Optional: provide a fully-specified local event (for frontend / ad-hoc inputs)
    parser.add_argument('--local-id', type=str, default='', help='Ad-hoc local event id (short unique identifier)')
    parser.add_argument('--local-title', type=str, default='', help='Ad-hoc local event title (human readable)')
    parser.add_argument('--local-date', type=str, default='', help='Ad-hoc local event date (ISO-8601 or year)')
    parser.add_argument('--local-location', type=str, default='', help='Ad-hoc local event location (human readable)')
    parser.add_argument('--local-description', type=str, default='', help='Ad-hoc local event full description (untruncated)')
    parser.add_argument('--local-source-url', type=str, default='', help='Ad-hoc local event authoritative source URL')
    parser.add_argument('--local-purpose', type=str, default='', help='Local event purpose/category (for auto-add)')
    parser.add_argument('--local-exhibit', type=str, default='', help='Local event exhibit name (for auto-add)')
    parser.add_argument('--local-source-count', type=int, default=None, help='Local event source count (for auto-add)')
    parser.add_argument('--local-max-sources', type=int, default=None, help='Local event max sources required (for auto-add)')
    parser.add_argument('--local-sources', type=str, default='', help='Local event sources text (for auto-add)')
    
    args = parser.parse_args()
    
    # Initialize pipeline
    pipeline = CausalLogicPipeline(args.nodes, args.edges)
    
    # Process input
    if args.input:
        local_override = None
        if any([
            args.local_id,
            args.local_title,
            args.local_date,
            args.local_location,
            args.local_description,
            args.local_source_url,
            args.local_purpose,
            args.local_exhibit,
            args.local_sources,
            args.local_source_count is not None,
            args.local_max_sources is not None,
        ]):
            local_override = {
                "id": (args.local_id or "").strip(),
                "title": (args.local_title or "").strip(),
                "date": (args.local_date or "").strip(),
                "location": (args.local_location or "").strip(),
                "description": (args.local_description or "").strip(),
                "source_url": (args.local_source_url or "").strip(),
                "purpose": (args.local_purpose or "").strip(),
                "exhibit_name": (args.local_exhibit or "").strip(),
                "source_count": int(args.local_source_count) if args.local_source_count is not None else 0,
                "max_sources_required": int(args.local_max_sources) if args.local_max_sources is not None else 5,
                "sources": (args.local_sources or "").strip(),
            }
        results = pipeline.process(
            args.input,
            date=args.date,
            location=args.location,
            top_k=args.top_k,
            local_event_override=local_override,
            allow_adhoc=args.allow_adhoc,
            auto_add_missing_local=args.auto_add_missing_local,
            history_file=args.history,
        )
        
        if 'error' in results:
            if args.json_output:
                import json
                
                def clean_for_json(obj):
                    """Replace NaN, inf, -inf with None for JSON compliance."""
                    if isinstance(obj, dict):
                        return {k: clean_for_json(v) for k, v in obj.items()}
                    elif isinstance(obj, list):
                        return [clean_for_json(i) for i in obj]
                    elif isinstance(obj, float):
                        if math.isnan(obj) or math.isinf(obj):
                            return None
                    return obj
                
                results = clean_for_json(results)
                
                print("\n===JSON_START===")
                print(json.dumps(results, indent=2))
                print("===JSON_END===\n")
            else:
                print(f"\n[ERROR] Error: {results['error']}")
                if 'suggestion' in results:
                    print(f"   Suggestion: {results['suggestion']}")
                cmds = results.get('commands') or {}
                if cmds:
                    add_cmd = cmds.get('add_event_and_rebuild_nodes')
                    run_cmd = cmds.get('run_pipeline_after_add')
                    one_shot_cmd = cmds.get('one_shot_auto_add_and_run')
                    if add_cmd:
                        print(f"   Add event command: {add_cmd}")
                    if run_cmd:
                        print(f"   Run pipeline command: {run_cmd}")
                    if one_shot_cmd:
                        print(f"   One-shot command: {one_shot_cmd}")
        else:
            if args.json_output:
                import json
                
                def clean_for_json(obj):
                    """Replace NaN, inf, -inf with None for JSON compliance."""
                    if isinstance(obj, dict):
                        return {k: clean_for_json(v) for k, v in obj.items()}
                    elif isinstance(obj, list):
                        return [clean_for_json(i) for i in obj]
                    elif isinstance(obj, float):
                        if math.isnan(obj) or math.isinf(obj):
                            return None
                    return obj
                
                results = clean_for_json(results)
                
                print("\n===JSON_START===")
                # Filter out potentially large/redundant evidence parts for JSON transport if needed,
                # but for now we'll just dump the whole packaged results.
                print(json.dumps(results, indent=2))
                print("===JSON_END===\n")
            else:
                # Format and display
                formatted = pipeline.layer7.format_for_display(results)
                try:
                    print(formatted)
                except UnicodeEncodeError:
                    # Windows consoles can be cp1252/cp1250; replace unprintable chars instead of crashing.
                    safe = formatted.encode("cp1252", errors="replace").decode("cp1252", errors="replace")
                    print(safe)
    else:
        # Interactive mode
        print("\n" + "=" * 80)
        print("7-Layer Causal Logic Engine - Interactive Mode")
        print("=" * 80)
        print("\nEnter local event text or exhibit name to discover global influences.")
        print("Type 'quit' or 'exit' to stop.\n")
        
        while True:
            input_text = input("Enter local event/exhibit: ").strip()
            
            if input_text.lower() in ['quit', 'exit', 'q']:
                print("\nGoodbye!")
                break
            
            if not input_text:
                continue
            
            results = pipeline.process(input_text, top_k=args.top_k)
            
            if 'error' in results:
                print(f"\n[ERROR] {results['error']}")
                if 'suggestion' in results:
                    print(f"   {results['suggestion']}\n")
            else:
                formatted = pipeline.layer7.format_for_display(results)
                try:
                    print("\n" + formatted + "\n")
                except UnicodeEncodeError:
                    safe = formatted.encode("cp1252", errors="replace").decode("cp1252", errors="replace")
                    print("\n" + safe + "\n")


if __name__ == '__main__':
    main()

