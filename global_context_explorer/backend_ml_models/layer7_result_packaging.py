"""
Layer 7: Curator-Friendly Result Packaging
Formats results for curator review.
"""

from typing import Dict, List
import re
from llm_influence_enricher import InfluenceEnricher


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
                'data': {}
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

        # Keep both full and short local descriptions for frontend/UX.
        local_data = dict(local_event_data or {})
        local_desc_full = str(local_data.get('description', '') or '')
        local_data['description_full'] = local_desc_full
        local_data['description_short'] = self._shorten_text(local_desc_full, max_chars=260, max_sentences=2)
        results['local_event']['data'] = local_data

        enricher = InfluenceEnricher()
        max_enrich = enricher.max_enrich() if enricher.is_enabled() else 0
        enriched_count = 0
        
        # Package top influences
        for prediction in scored_predictions[:10]:  # Top 10
            pred_id = prediction['global_event_id']
            explanation_paths = paths.get(pred_id, [])

            influence_type = "direct" if float(prediction.get("final_score", 0.0)) >= 0.60 else "indirect"
            mechanism = self._get_top_mechanism(prediction.get('mechanism_probs', {}))
            
            influence = {
                'global_event': {
                    'id': pred_id,
                    'name': prediction['metadata'].get('event_name', ''),
                    'date': prediction['metadata'].get('date', ''),
                    'location': prediction['metadata'].get('location', ''),
                    'description': prediction['metadata'].get('description', ''),
                    'description_full': prediction['metadata'].get('description', ''),
                },
                'causal_strength': prediction['causal_strength_score'],
                'reliability_score': prediction['reliability']['reliability_percent'],
                'final_score': prediction['final_score'],
                'mechanism': mechanism,
                'influence_type': influence_type,
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

            # Fix Issue 2: LLM enrichment step (API-key gated) - always use when available.
            # This ensures descriptions are curator-friendly and readable.
            original_desc = influence["global_event"]["description"]
            if enricher.is_enabled() and enriched_count < max_enrich:
                # Provide a small evidence sample (titles/extracts are already summarized upstream)
                ev_snips = []
                for sn in (evidence.get("raw_text_evidence", []) or [])[:5]:
                    if isinstance(sn, dict):
                        txt = sn.get("extract") or sn.get("snippet") or sn.get("plain_text") or ""
                        if txt:
                            ev_snips.append(str(txt))
                
                enriched = enricher.enrich_description(
                    local_event=local_event_data or {},
                    global_event={
                        "name": influence["global_event"]["name"],
                        "date": influence["global_event"]["date"],
                        "location": influence["global_event"]["location"],
                        "description": original_desc,  # Use original description
                        "source_url": prediction.get("metadata", {}).get("source_url", ""),
                    },
                    mechanism=mechanism,
                    influence_type=influence_type,
                    evidence_snippets=ev_snips,
                )
                if enriched:
                    # Store original for reference, replace with enriched version
                    influence["global_event"]["original_description"] = original_desc
                    influence["global_event"]["description_full"] = enriched
                    influence["global_event"]["description"] = enriched
                    enriched_count += 1
                else:
                    # If enrichment failed but API key is set, try to clean up the description
                    # Remove wiki markup remnants that might make it unreadable
                    cleaned_desc = self._clean_wiki_markup(original_desc)
                    if cleaned_desc != original_desc:
                        influence["global_event"]["description_full"] = cleaned_desc
                        influence["global_event"]["description"] = cleaned_desc
            else:
                # Even without API key, clean up wiki markup for readability
                cleaned_desc = self._clean_wiki_markup(original_desc)
                if cleaned_desc != original_desc:
                    influence["global_event"]["description_full"] = cleaned_desc
                    influence["global_event"]["description"] = cleaned_desc

            # Always expose a short, reader-friendly description for UI/terminal output.
            desc_full = str(influence["global_event"].get("description_full", "") or "")
            influence["global_event"]["description_short"] = self._shorten_text(desc_full, max_chars=420, max_sentences=3)
            # Keep existing `description` concise for display, while `description_full` keeps full details.
            influence["global_event"]["description"] = influence["global_event"]["description_short"]
            
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
        local_desc_short = str(local_event.get('description_short', '') or '').strip()
        local_desc_full = str(local_event.get('description_full', '') or '').strip()
        if local_desc_short:
            output.append(f"    Summary: {local_desc_short}")
        if local_desc_full and local_desc_full != local_desc_short:
            output.append(f"    Full Details: {local_desc_full}")
        output.append("")
        
        # Statistics
        stats = results['statistics']
        output.append(f"[STATS] Discovery Statistics:")
        output.append(f"    Total Candidates: {stats['total_candidates']}")
        output.append(f"    High Confidence (>{0.7}): {stats['high_confidence']}")
        output.append(f"    Medium Confidence (0.5-0.7): {stats['medium_confidence']}")
        output.append(f"    Low Confidence (<0.5): {stats['low_confidence']}")
        output.append("")

        # Evidence / Sources (Wikipedia)
        ev = results.get('evidence_summary', {}) or {}
        wiki_pages = ev.get('wikipedia_pages', []) or []
        if wiki_pages:
            output.append("[SOURCES] Wikipedia pages found:")
            for i, item in enumerate(wiki_pages[:5], 1):
                title = item.get('title', '')
                url = item.get('url', '')
                if url:
                    output.append(f"    {i}. {title} -> {url}")
                else:
                    output.append(f"    {i}. {title}")
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
            if global_event.get('description_full') and global_event.get('description_full') != global_event.get('description'):
                output.append(f"    Full Details: {global_event['description_full']}")
            output.append("")
            
            output.append("[METRICS] Influence Metrics:")
            output.append(f"    Causal Strength: {influence['causal_strength']:.2f}")
            output.append(f"    Reliability Score: {influence['reliability_score']:.1f}/100")
            output.append(f"    Final Score: {influence['final_score']:.2f}")
            output.append(f"    Mechanism: {influence['mechanism']}")
            output.append(f"    Influence Type: {influence.get('influence_type', 'indirect')}")
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
        wiki_sources = []
        for key in ['wikipedia_snippets', 'wikipedia_extracts', 'wikipedia_search_results']:
            for item in evidence.get(key, []) or []:
                title = item.get('title') or ''
                url = item.get('url') or ''
                if title:
                    wiki_sources.append({'title': str(title), 'url': str(url)})

        # de-duplicate while preserving order
        seen = set()
        wiki_unique = []
        for item in wiki_sources:
            k = (item['title'], item['url'])
            if k in seen:
                continue
            seen.add(k)
            wiki_unique.append(item)

        return {
            'total_snippets': len(evidence.get('raw_text_evidence', [])),
            'wikipedia_snippets': len(evidence.get('wikipedia_snippets', [])),
            'wikipedia_search_results': len(evidence.get('wikipedia_search_results', [])),
            'wikipedia_extracts': len(evidence.get('wikipedia_extracts', [])),
            'entity_mentions': len(evidence.get('entity_mentions', [])),
            'commodities': len(evidence.get('related_commodities', [])),
            'wikipedia_pages': wiki_unique
        }
    
    def _get_top_mechanism(self, mechanism_probs: Dict[str, float]) -> str:
        """Get top mechanism type."""
        if not mechanism_probs:
            return "economic_shift"
        
        return max(mechanism_probs.items(), key=lambda x: x[1])[0]
    
    def _clean_wiki_markup(self, text: str) -> str:
        """Clean wiki markup from text to make it more readable."""
        import re
        if not text:
            return ""
        
        # Remove template braces and content
        text = re.sub(r'\{\{[^}]*\}\}', '', text)
        # Remove pipe separators used in wiki templates
        text = text.replace('|', ' ')
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        # Remove leading/trailing whitespace
        text = text.strip()
        
        # If text ends with incomplete sentence (like "and"), try to find a better ending
        if text.endswith(' and') or text.endswith(' and,'):
            # Find last complete sentence
            last_period = text.rfind('.')
            last_exclamation = text.rfind('!')
            last_question = text.rfind('?')
            last_sentence = max(last_period, last_exclamation, last_question)
            if last_sentence > len(text) * 0.5:  # Only if we found a reasonable sentence end
                text = text[:last_sentence + 1]
        
        return text

    def _shorten_text(self, text: str, max_chars: int = 320, max_sentences: int = 2) -> str:
        """
        Create a concise summary while preserving readability.
        Keeps first N sentences if possible; otherwise truncates at a word boundary.
        """
        s = re.sub(r'\s+', ' ', str(text or '')).strip()
        if not s:
            return ""

        parts = re.split(r'(?<=[.!?])\s+', s)
        picked = []
        total = 0
        for p in parts:
            if not p:
                continue
            next_len = total + len(p) + (1 if picked else 0)
            if len(picked) >= max_sentences or next_len > max_chars:
                break
            picked.append(p)
            total = next_len

        if picked:
            short = " ".join(picked).strip()
            if len(short) >= min(80, max_chars):
                return short

        if len(s) <= max_chars:
            return s
        return s[:max_chars].rsplit(" ", 1)[0].rstrip() + "..."
    
    def _clean_wiki_markup(self, text: str) -> str:
        """Clean wiki markup from text to make it more readable."""
        import re
        if not text:
            return ""
        
        # Remove template braces and content
        text = re.sub(r'\{\{[^}]*\}\}', '', text)
        # Remove pipe separators used in wiki templates
        text = text.replace('|', ' ')
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        # Remove leading/trailing whitespace
        text = text.strip()
        
        # If text ends with incomplete sentence (like "and"), try to find a better ending
        if text.endswith(' and') or text.endswith(' and,'):
            # Find last complete sentence
            last_period = text.rfind('.')
            last_exclamation = text.rfind('!')
            last_question = text.rfind('?')
            last_sentence = max(last_period, last_exclamation, last_question)
            if last_sentence > len(text) * 0.5:  # Only if we found a reasonable sentence end
                text = text[:last_sentence + 1]
        
        return text

