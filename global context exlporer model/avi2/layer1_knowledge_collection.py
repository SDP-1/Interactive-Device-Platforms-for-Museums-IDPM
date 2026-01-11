"""
Layer 1: Knowledge Collection
Fetches documents/snippets from Wiki APIs, UNESCO, Mahavamsa, etc.
"""

import requests
import time
from typing import Dict, List, Optional
import json


class KnowledgeCollector:
    """Collects knowledge from various sources."""
    
    def __init__(self):
        self.wikipedia_base = "https://en.wikipedia.org/api/rest_v1/page/summary/"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'CausalLogicEngine/1.0 (Educational Research)'
        })
        self.cache = {}
    
    def collect(self, query: Dict) -> Dict:
        """
        Collect knowledge related to the query.
        
        Args:
            query: Structured query from Layer 0
        
        Returns:
            Dictionary with collected evidence
        """
        evidence = {
            'wikipedia_snippets': [],
            'entity_mentions': [],
            'related_commodities': [],
            'context_keywords': [],
            'raw_text_evidence': []
        }
        
        # Search Wikipedia for local event
        wiki_results = self._search_wikipedia(query['local_event_text'])
        evidence['wikipedia_snippets'].extend(wiki_results)
        
        # Search for entities
        for entity in query.get('entities', []):
            entity_results = self._search_wikipedia(entity)
            evidence['entity_mentions'].extend(entity_results)
        
        # Search for commodities
        commodities = self._extract_commodities(query['local_event_text'])
        for commodity in commodities:
            commodity_results = self._search_wikipedia(commodity)
            evidence['related_commodities'].extend(commodity_results)
        
        # Search for context keywords
        for keyword in query.get('keywords', [])[:5]:  # Top 5 keywords
            keyword_results = self._search_wikipedia(keyword)
            evidence['context_keywords'].extend(keyword_results)
        
        # Combine all raw text
        all_snippets = (
            evidence['wikipedia_snippets'] +
            evidence['entity_mentions'] +
            evidence['related_commodities'] +
            evidence['context_keywords']
        )
        
        evidence['raw_text_evidence'] = all_snippets
        
        return evidence
    
    def _search_wikipedia(self, search_term: str, max_results: int = 3) -> List[Dict]:
        """Search Wikipedia for a term."""
        if search_term in self.cache:
            return self.cache[search_term]
        
        results = []
        
        try:
            # Try direct page lookup
            page_title = search_term.replace(' ', '_')
            url = f"{self.wikipedia_base}{page_title}"
            
            response = self.session.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                results.append({
                    'title': data.get('title', ''),
                    'extract': data.get('extract', ''),
                    'url': data.get('content_urls', {}).get('desktop', {}).get('page', ''),
                    'source': 'wikipedia'
                })
        except Exception as e:
            # If direct lookup fails, try search API
            try:
                search_url = "https://en.wikipedia.org/api/rest_v1/page/summary/"
                # Simplified: just use the term as-is
                pass
            except:
                pass
        
        # Cache result
        self.cache[search_term] = results
        
        # Rate limiting
        time.sleep(0.1)
        
        return results
    
    def _extract_commodities(self, text: str) -> List[str]:
        """Extract commodity mentions from text."""
        commodities = []
        text_lower = text.lower()
        
        commodity_keywords = [
            'tea', 'coffee', 'cotton', 'sugar', 'spice', 'rubber', 'coconut',
            'cinnamon', 'pepper', 'cocoa', 'tobacco', 'opium', 'silk'
        ]
        
        for commodity in commodity_keywords:
            if commodity in text_lower:
                commodities.append(commodity.capitalize())
        
        return commodities
    
    def _mock_unesco_search(self, query: str) -> List[Dict]:
        """Mock UNESCO search (can be replaced with real API)."""
        # Placeholder for UNESCO API integration
        return []
    
    def _mock_mahavamsa_search(self, query: str) -> List[Dict]:
        """Mock Mahavamsa search (can be replaced with real API)."""
        # Placeholder for Mahavamsa integration
        return []

