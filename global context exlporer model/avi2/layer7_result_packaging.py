"""
Layer 7: Curator-Friendly Result Packaging
Formats results for curator review.
"""

from typing import Dict, List


class ResultPackager:
    """Packages results in curator-friendly format."""
    
    def __init__(self):
        pass
    
    def package_results(
        self,
        local_event_id: str,
        local_event_data: Dict,
        scored_predictions: List[Dict],
        paths: Dict[str, List[Dict]],
        evidence: Dict
    ) -> Dict:
        """
        Package all results for curator.
        
        Args:
            local_event_id: ID of local event
            local_event_data: Local event information
            scored_predictions: Scored predictions from Layer 5
            paths: Dictionary mapping prediction IDs to paths
            evidence: Evidence from Layer 1
        
        Returns:
            Packaged results dictionary
        """
        results = {
            'local_event': {
                'id': local_event_id,
                'data': local_event_data
            },
            'top_influences': [],
            'evidence_summary': self._summarize_evidence(evidence),
            'statistics': {
                'total_candidates': len(scored_predictions),
                'high_confidence': len([p for p in scored_predictions if p['final_score'] > 0.7]),
                'medium_confidence': len([p for p in scored_predictions if 0.5 <= p['final_score'] <= 0.7]),
                'low_confidence': len([p for p in scored_predictions if p['final_score'] < 0.5])
            }
        }
        
        # Package top influences
        for prediction in scored_predictions[:10]:  # Top 10
            pred_id = prediction['global_event_id']
            explanation_paths = paths.get(pred_id, [])
            
            influence = {
                'global_event': {
                    'id': pred_id,
                    'name': prediction['metadata'].get('event_name', ''),
                    'date': prediction['metadata'].get('date', ''),
                    'location': prediction['metadata'].get('location', ''),
                    'description': prediction['metadata'].get('description', '')
                },
                'causal_strength': prediction['causal_strength_score'],
                'reliability_score': prediction['reliability']['reliability_percent'],
                'final_score': prediction['final_score'],
                'mechanism': self._get_top_mechanism(prediction.get('mechanism_probs', {})),
                'mechanism_probs': prediction['mechanism_probs'],
                'constraints': prediction['constraint_results'],
                'evidence_strength': prediction['evidence_strength']['evidence_strength'],
                'explanation_paths': explanation_paths,
                'reliability_components': {
                    'directness': prediction['reliability']['directness'],
                    'source_consistency': prediction['reliability']['source_consistency'],
                    'temporal_proximity': prediction['reliability']['temporal_proximity']
                }
            }
            
            results['top_influences'].append(influence)
        
        return results
    
    def format_for_display(self, results: Dict) -> str:
        """Format results as beautiful text output."""
        output = []
        output.append("=" * 80)
        output.append("GLOBAL-LOCAL HISTORICAL INFLUENCE DISCOVERY")
        output.append("=" * 80)
        output.append("")
        
        # Local event info
        local_event = results['local_event']['data']
        output.append(f"[*] Local Event: {local_event.get('event_name', 'Unknown')}")
        output.append(f"    Exhibit: {local_event.get('exhibit_name', 'N/A')}")
        output.append(f"    Date: {local_event.get('date', 'N/A')}")
        output.append(f"    Location: {local_event.get('location', 'N/A')}")
        output.append("")
        
        # Statistics
        stats = results['statistics']
        output.append(f"[STATS] Discovery Statistics:")
        output.append(f"    Total Candidates: {stats['total_candidates']}")
        output.append(f"    High Confidence (>{0.7}): {stats['high_confidence']}")
        output.append(f"    Medium Confidence (0.5-0.7): {stats['medium_confidence']}")
        output.append(f"    Low Confidence (<0.5): {stats['low_confidence']}")
        output.append("")
        
        # Top influences
        output.append("=" * 80)
        output.append("TOP GLOBAL INFLUENCES")
        output.append("=" * 80)
        output.append("")
        
        for i, influence in enumerate(results['top_influences'], 1):
            output.append("-" * 80)
            output.append(f"Influence #{i}")
            output.append("-" * 80)
            output.append("")
            
            global_event = influence['global_event']
            output.append(f"[GLOBAL] Global Cause: {global_event['name']}")
            output.append(f"    Date: {global_event['date']}")
            output.append(f"    Location: {global_event['location']}")
            output.append(f"    Description: {global_event['description']}")
            output.append("")
            
            output.append("[METRICS] Influence Metrics:")
            output.append(f"    Causal Strength: {influence['causal_strength']:.2f}")
            output.append(f"    Reliability Score: {influence['reliability_score']:.1f}/100")
            output.append(f"    Final Score: {influence['final_score']:.2f}")
            output.append(f"    Mechanism: {influence['mechanism']}")
            output.append("")
            
            output.append("[RELIABILITY] Reliability Components:")
            rel_comp = influence['reliability_components']
            output.append(f"    Directness (D): {rel_comp['directness']:.2f}")
            output.append(f"    Source Consistency (S): {rel_comp['source_consistency']:.2f}")
            output.append(f"    Temporal Proximity (T): {rel_comp['temporal_proximity']:.2f}")
            output.append(f"    Evidence Strength: {influence['evidence_strength']:.2f}")
            output.append("")
            
            # Constraints
            constraints = influence['constraints']
            output.append("[CHECKS] Constraint Checks:")
            output.append(f"    Temporal Order: {'[PASS]' if constraints['temporal_order'] else '[FAIL]'}")
            output.append(f"    Geographic Plausibility: {'[PASS]' if constraints['geographic_plausibility'] else '[FAIL]'}")
            output.append(f"    Source Consistency: {'[PASS]' if constraints['source_consistency'] else '[FAIL]'}")
            output.append("")
            
            # Explanation paths
            if influence['explanation_paths']:
                output.append("[PATHS] Explanation Paths:")
                for j, path_info in enumerate(influence['explanation_paths'][:2], 1):  # Top 2 paths
                    output.append(f"    Path {j} (Score: {path_info['score']:.2f}):")
                    output.append(f"       {path_info['explanation']}")
                output.append("")
        
        output.append("=" * 80)
        
        return "\n".join(output)
    
    def _summarize_evidence(self, evidence: Dict) -> Dict:
        """Summarize collected evidence."""
        return {
            'total_snippets': len(evidence.get('raw_text_evidence', [])),
            'wikipedia_snippets': len(evidence.get('wikipedia_snippets', [])),
            'entity_mentions': len(evidence.get('entity_mentions', [])),
            'commodities': len(evidence.get('related_commodities', []))
        }
    
    def _get_top_mechanism(self, mechanism_probs: Dict[str, float]) -> str:
        """Get top mechanism type."""
        if not mechanism_probs:
            return "economic_shift"
        
        return max(mechanism_probs.items(), key=lambda x: x[1])[0]

