"""
Main Pipeline: Integrates all 7 layers
Complete end-to-end system for Global-Local Historical Influence Discovery
"""

import argparse
import pandas as pd
from typing import Dict, Optional

# Import all layers
from layer0_curator_input import CuratorInputParser
from layer1_knowledge_collection import KnowledgeCollector
from layer2_candidate_generation import CandidateGenerator
from layer3_graph_construction import GraphConstructor
from layer4_gnn_reasoning import GNNReasoner
from layer5_constraint_scoring import ConstraintScorer
from layer6_path_construction import PathConstructor
from layer7_result_packaging import ResultPackager


class CausalLogicPipeline:
    """Complete 7-layer pipeline for causal link discovery."""
    
    def __init__(self, nodes_file: str, edges_file: str):
        """
        Initialize the complete pipeline.
        
        Args:
            nodes_file: Path to nodes CSV file
            edges_file: Path to edges CSV file
        """
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
        top_k: int = 10
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
            return {
                'error': f'Could not find local event matching: {input_text}',
                'suggestion': 'Please check the event name or use an exhibit name from the database.'
            }
        
        print(f"[OK] Found local event: {local_event_id}")
        
        # Layer 1: Knowledge Collection
        print("\n[Layer 1] Collecting knowledge from sources...")
        evidence = self.layer1.collect(query)
        print(f"[OK] Collected {len(evidence['raw_text_evidence'])} evidence snippets")
        
        # Layer 2: Candidate Generation
        print("\n[Layer 2] Generating candidate global events...")
        candidates = self.layer2.generate_candidates(query, evidence, top_k=50)
        print(f"[OK] Generated {len(candidates)} candidate global events")
        
        # Layer 3: Graph Construction
        print("\n[Layer 3] Constructing graph...")
        graph = self.layer3.construct_subgraph(local_event_id, candidates, evidence)
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
    
    def _find_local_event(self, query: Dict) -> tuple:
        """Find matching local event from database."""
        if self.nodes_df is None:
            return None, None
        
        search_text = query['local_event_text'].lower()
        
        # Try exact match first
        for _, row in self.nodes_df.iterrows():
            if row['node_type'] == 'local':
                event_name = str(row['event_name']).lower()
                exhibit_name = str(row.get('exhibit_name', '')).lower()
                
                if search_text in event_name or search_text in exhibit_name:
                    return row['node_id'], {
                        'node_id': row['node_id'],
                        'event_name': row['event_name'],
                        'date': str(row['date']),
                        'location': row.get('location', ''),
                        'description': row.get('description', ''),
                        'exhibit_name': row.get('exhibit_name', '')
                    }
        
        # Try partial match
        query_keywords = set(query.get('keywords', []))
        best_match = None
        best_score = 0
        
        for _, row in self.nodes_df.iterrows():
            if row['node_type'] == 'local':
                event_text = f"{row['event_name']} {row.get('description', '')}".lower()
                event_keywords = set(query_keywords)
                overlap = len(event_keywords & set(event_text.split()))
                
                if overlap > best_score:
                    best_score = overlap
                    best_match = row
        
        if best_match is not None:
            return best_match['node_id'], {
                'node_id': best_match['node_id'],
                'event_name': best_match['event_name'],
                'date': str(best_match['date']),
                'location': best_match.get('location', ''),
                'description': best_match.get('description', ''),
                'exhibit_name': best_match.get('exhibit_name', '')
            }
        
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
    
    args = parser.parse_args()
    
    # Initialize pipeline
    pipeline = CausalLogicPipeline(args.nodes, args.edges)
    
    # Process input
    if args.input:
        results = pipeline.process(
            args.input,
            date=args.date,
            location=args.location,
            top_k=args.top_k
        )
        
        if 'error' in results:
            print(f"\n[ERROR] Error: {results['error']}")
            if 'suggestion' in results:
                print(f"   Suggestion: {results['suggestion']}")
        else:
            # Format and display
            formatted = pipeline.layer7.format_for_display(results)
            print(formatted)
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
                print("\n" + formatted + "\n")


if __name__ == '__main__':
    main()

