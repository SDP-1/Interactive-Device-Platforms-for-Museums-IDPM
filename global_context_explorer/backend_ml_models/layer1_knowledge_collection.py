"""
Layer 1: Knowledge Collection
Enhanced implementation with full Wikipedia API methodology, UNESCO API, and Seshat DB integration.
Based on the methodology PDF and Postman collection patterns.
"""

import requests
import time
import re
from typing import Dict, List, Optional, Tuple
import json
from urllib.parse import quote, urlencode


class KnowledgeCollector:
    """
    Enhanced knowledge collector implementing full Wikipedia API methodology:
    - Wikipedia REST API (page summaries)
    - MediaWiki API (search, categories, content extraction)
    - UNESCO Data API
    - Seshat DB API
    """
    
    def __init__(self, rate_limit: float = 0.2, timeout: int = 10):
        """
        Initialize the knowledge collector.
        
        Args:
            rate_limit: Seconds to wait between API calls
            timeout: Request timeout in seconds
        """
        # Wikipedia REST API (for summaries)
        self.wikipedia_rest_base = "https://en.wikipedia.org/api/rest_v1/page/summary/"
        
        # MediaWiki API (for search, categories, content)
        self.mediawiki_api = "https://en.wikipedia.org/w/api.php"
        
        # UNESCO Data API
        self.unesco_api_base = "https://data.unesco.org/api/explore/v2.1"
        
        # Seshat DB API
        self.seshat_api_base = "https://seshat-db.com/api/core"
        
        # Session with proper headers
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'CausalLogicEngine/1.0 (Educational Research; contact@example.com)'
        })
        
        # Configuration
        self.rate_limit = rate_limit
        self.timeout = timeout
        self.cache = {}
        self.request_count = 0
        self.max_requests_per_minute = 60
    
    def collect(self, query: Dict) -> Dict:
        """
        Collect knowledge related to the query using multiple sources.
        
        Args:
            query: Structured query from Layer 0 with:
                - local_event_text: Main event description
                - entities: List of entities (countries, organizations)
                - keywords: List of keywords
                - date_range: Optional date information
        
        Returns:
            Dictionary with collected evidence from all sources
        """
        evidence = {
            'wikipedia_snippets': [],
            'wikipedia_search_results': [],
            'wikipedia_category_results': [],
            'wikipedia_full_content': [],
            'wikipedia_extracts': [],
            'entity_mentions': [],
            'related_commodities': [],
            'context_keywords': [],
            'unesco_data': [],
            'seshat_data': [],
            'raw_text_evidence': []
        }
        
        # 1. Search Wikipedia for local event (using both REST and MediaWiki APIs)
        local_event_text = query.get('local_event_text', '')
        if local_event_text:
            # Try REST API first (faster, better summaries)
            wiki_summary = self._get_wikipedia_summary(local_event_text)
            if wiki_summary:
                evidence['wikipedia_snippets'].append(wiki_summary)
            
            # Also use MediaWiki search for broader results
            search_results = self._search_wikipedia_mediawiki(local_event_text, limit=8)
            evidence['wikipedia_search_results'].extend(search_results)
            
            # Get plaintext extracts for top search results in batches of B=2 (matches methodology PDF).
            # This prevents truncated/garbled descriptions and gives Layer 2 cleaner text to work with.
            if search_results:
                titles = [r.get("title") for r in search_results if r.get("title")]
                titles = [t for t in titles if isinstance(t, str) and t.strip()]
                titles = titles[:8]  # methodology: srlimit=8 then process results in batches of 2
                for i in range(0, len(titles), 2):
                    batch = titles[i:i+2]
                    for doc in self._get_wikipedia_extracts_plaintext_batch(batch):
                        if doc:
                            evidence["wikipedia_extracts"].append(doc)

            # Try to get full content for top result
            if search_results:
                top_result = search_results[0]
                page_id = top_result.get('pageid')
                if page_id:
                    full_content = self._get_wikipedia_full_content(page_id)
                    if full_content:
                        evidence['wikipedia_full_content'].append(full_content)
        
        # 2. Search for entities
        for entity in query.get('entities', []):
            entity_summary = self._get_wikipedia_summary(entity)
            if entity_summary:
                evidence['entity_mentions'].append(entity_summary)
            
            entity_search = self._search_wikipedia_mediawiki(entity, limit=3)
            evidence['entity_mentions'].extend(entity_search)
        
        # 3. Search for commodities
        commodities = self._extract_commodities(local_event_text)
        for commodity in commodities:
            commodity_summary = self._get_wikipedia_summary(commodity)
            if commodity_summary:
                evidence['related_commodities'].append(commodity_summary)
            
            commodity_search = self._search_wikipedia_mediawiki(commodity, limit=3)
            evidence['related_commodities'].extend(commodity_search)
        
        # 4. Search for context keywords
        for keyword in query.get('keywords', [])[:5]:  # Top 5 keywords
            keyword_summary = self._get_wikipedia_summary(keyword)
            if keyword_summary:
                evidence['context_keywords'].append(keyword_summary)
        
        # 5. Category-based discovery (for time periods, locations)
        date_range = query.get('date_range', {})
        if date_range:
            year = date_range.get('year')
            if year:
                # Try to find category for the time period
                category_results = self._get_category_members(
                    f"Category:{year}s_in_Sri_Lanka",
                    limit=20
                )
                if not category_results:
                    # Try alternative category names
                    category_results = self._get_category_members(
                        f"Category:{year}s_in_Ceylon",
                        limit=20
                    )
                evidence['wikipedia_category_results'].extend(category_results)
        
        # 6. UNESCO API search
        unesco_results = self._search_unesco(local_event_text)
        evidence['unesco_data'].extend(unesco_results)
        
        # 7. Seshat DB search (for religions, historical data)
        seshat_results = self._search_seshat(local_event_text)
        evidence['seshat_data'].extend(seshat_results)
        
        # 8. Combine all raw text evidence
        all_snippets = (
            evidence['wikipedia_snippets'] +
            evidence['wikipedia_search_results'] +
            evidence['wikipedia_category_results'] +
            evidence['wikipedia_full_content'] +
            evidence['wikipedia_extracts'] +
            evidence['entity_mentions'] +
            evidence['related_commodities'] +
            evidence['context_keywords']
        )
        
        evidence['raw_text_evidence'] = all_snippets
        
        return evidence

    def _get_wikipedia_extracts_plaintext_batch(self, titles: List[str]) -> List[Dict]:
        """
        "Batch" helper that follows the methodology PDF's B=2 processing,
        but performs *per-title* requests.

        Note: MediaWiki's `prop=extracts` behavior is inconsistent when requesting
        multiple titles in one call (some pages may return no `extract` field).
        Per-title calls are more reliable and still respect the batch-of-2 control flow.
        """
        if not titles:
            return []

        # Normalize and keep order
        clean_titles: List[str] = []
        for t in titles:
            if not isinstance(t, str):
                continue
            tt = t.strip()
            if tt:
                clean_titles.append(tt)
        if not clean_titles:
            return []

        out: List[Dict] = []
        for t in clean_titles:
            doc = self._get_wikipedia_extract_plaintext(t)
            if doc:
                out.append(doc)
        return out

    def _get_wikipedia_extract_plaintext(self, title: str) -> Optional[Dict]:
        """
        Get plaintext extract for a Wikipedia page using MediaWiki API.
        Matches the curl you provided:
          action=query&prop=extracts&explaintext=1&titles=...&format=json

        Args:
            title: Page title (spaces allowed)

        Returns:
            Dict with title, extract, pageid, url, source
        """
        cache_key = f"extract:{title}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        try:
            params = {
                'action': 'query',
                'prop': 'extracts',
                'explaintext': 1,
                'titles': title,
                'format': 'json'
            }
            response = self._make_request(self.mediawiki_api, params=params)
            if not response or response.status_code != 200:
                return None

            data = response.json()
            pages = data.get('query', {}).get('pages', {}) or {}
            # pages is a dict keyed by pageid string
            for pageid_str, page_data in pages.items():
                if not isinstance(page_data, dict):
                    continue
                if page_data.get('missing') is not None:
                    continue
                page_title = page_data.get('title', title)
                extract = page_data.get('extract', '')
                try:
                    pageid = int(page_data.get('pageid')) if page_data.get('pageid') is not None else None
                except Exception:
                    pageid = None

                result = {
                    'title': page_title,
                    'extract': extract,
                    'pageid': pageid,
                    'url': f"https://en.wikipedia.org/wiki/{quote(page_title.replace(' ', '_'))}",
                    'source': 'wikipedia_extracts_plaintext'
                }
                self.cache[cache_key] = result
                return result
        except Exception as e:
            print(f"Error fetching Wikipedia plaintext extract for '{title}': {e}")

        return None
    
    def _get_wikipedia_summary(self, page_title: str) -> Optional[Dict]:
        """
        Get Wikipedia page summary using REST API.
        Pattern: https://en.wikipedia.org/api/rest_v1/page/summary/{title}
        
        Args:
            page_title: Wikipedia page title
        
        Returns:
            Dictionary with title, extract, url, source
        """
        cache_key = f"summary:{page_title}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # Normalize page title
            normalized_title = page_title.replace(' ', '_')
            url = f"{self.wikipedia_rest_base}{normalized_title}"
            
            response = self._make_request(url)
            if response and response.status_code == 200:
                data = response.json()
                result = {
                    'title': data.get('title', page_title),
                    'extract': data.get('extract', ''),
                    'url': data.get('content_urls', {}).get('desktop', {}).get('page', ''),
                    'source': 'wikipedia_rest',
                    'pageid': data.get('pageid')
                }
                self.cache[cache_key] = result
                return result
        except Exception as e:
            print(f"Error fetching Wikipedia summary for '{page_title}': {e}")
        
        return None
    
    def _search_wikipedia_mediawiki(
        self,
        search_query: str,
        limit: int = 8
    ) -> List[Dict]:
        """
        Search Wikipedia using MediaWiki API.
        Pattern: action=query&list=search&srsearch={query}&format=json&srlimit={limit}
        
        Args:
            search_query: Search query string
            limit: Maximum number of results
        
        Returns:
            List of search result dictionaries
        """
        cache_key = f"search:{search_query}:{limit}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        results = []
        
        try:
            params = {
                'action': 'query',
                'list': 'search',
                'srsearch': search_query,
                'format': 'json',
                'srlimit': limit
            }
            
            response = self._make_request(self.mediawiki_api, params=params)
            if response and response.status_code == 200:
                data = response.json()
                search_results = data.get('query', {}).get('search', [])
                
                for item in search_results:
                    results.append({
                        'title': item.get('title', ''),
                        'snippet': item.get('snippet', ''),
                        'pageid': item.get('pageid'),
                        'url': f"https://en.wikipedia.org/wiki/{quote(item.get('title', '').replace(' ', '_'))}",
                        'source': 'wikipedia_mediawiki_search',
                        'size': item.get('size', 0),
                        'wordcount': item.get('wordcount', 0)
                    })
                
                self.cache[cache_key] = results
        except Exception as e:
            print(f"Error searching Wikipedia for '{search_query}': {e}")
        
        return results
    
    def _get_category_members(
        self,
        category_title: str,
        limit: int = 50
    ) -> List[Dict]:
        """
        Get members of a Wikipedia category.
        Pattern: action=query&list=categorymembers&cmtitle={category}&cmlimit={limit}&format=json
        
        Args:
            category_title: Category title (e.g., "Category:1940s in Ceylon")
            limit: Maximum number of members to retrieve
        
        Returns:
            List of category member dictionaries
        """
        cache_key = f"category:{category_title}:{limit}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        results = []
        
        try:
            params = {
                'action': 'query',
                'list': 'categorymembers',
                'cmtitle': category_title,
                'cmlimit': limit,
                'format': 'json'
            }
            
            response = self._make_request(self.mediawiki_api, params=params)
            if response and response.status_code == 200:
                data = response.json()
                members = data.get('query', {}).get('categorymembers', [])
                
                for member in members:
                    results.append({
                        'title': member.get('title', ''),
                        'pageid': member.get('pageid'),
                        'url': f"https://en.wikipedia.org/wiki/{quote(member.get('title', '').replace(' ', '_'))}",
                        'source': 'wikipedia_category',
                        'ns': member.get('ns', 0)
                    })
                
                self.cache[cache_key] = results
        except Exception as e:
            print(f"Error fetching category members for '{category_title}': {e}")
        
        return results
    
    def _get_wikipedia_full_content(self, page_id: int) -> Optional[Dict]:
        """
        Get full Wikipedia page content using revisions API.
        Pattern: action=query&format=json&prop=revisions&rvprop=content&pageids={pageid}
        
        Args:
            page_id: Wikipedia page ID
        
        Returns:
            Dictionary with full page content
        """
        cache_key = f"content:{page_id}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            params = {
                'action': 'query',
                'format': 'json',
                'prop': 'revisions',
                'rvprop': 'content',
                'pageids': str(page_id)
            }
            
            response = self._make_request(self.mediawiki_api, params=params)
            if response and response.status_code == 200:
                data = response.json()
                pages = data.get('query', {}).get('pages', {})
                
                if str(page_id) in pages:
                    page_data = pages[str(page_id)]
                    revisions = page_data.get('revisions', [])
                    
                    if revisions:
                        content = revisions[0].get('*', '')
                        # Extract plain text (remove wiki markup)
                        plain_text = self._extract_plain_text(content)
                        
                        result = {
                            'pageid': page_id,
                            'title': page_data.get('title', ''),
                            'content': content,
                            'plain_text': plain_text,
                            'url': f"https://en.wikipedia.org/wiki/{quote(page_data.get('title', '').replace(' ', '_'))}",
                            'source': 'wikipedia_full_content',
                            'content_length': len(content)
                        }
                        
                        self.cache[cache_key] = result
                        return result
        except Exception as e:
            print(f"Error fetching full content for page ID {page_id}: {e}")
        
        return None
    
    def _search_unesco(self, query: str) -> List[Dict]:
        """
        Search UNESCO Data API.
        Uses the UNESCO API console endpoint.
        
        Args:
            query: Search query string
        
        Returns:
            List of UNESCO data results
        """
        # UNESCO API requires specific endpoints - this is a placeholder
        # The actual endpoint structure depends on the specific UNESCO API version
        # For now, we'll implement a basic search pattern
        
        cache_key = f"unesco:{query}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        results = []
        
        try:
            # UNESCO API endpoint (adjust based on actual API documentation)
            # Example: https://data.unesco.org/api/explore/v2.1/console
            # This is a placeholder - actual implementation depends on API docs
            
            # For now, return empty results but structure is ready
            # TODO: Implement actual UNESCO API calls when API documentation is available
            
            self.cache[cache_key] = results
        except Exception as e:
            print(f"Error searching UNESCO for '{query}': {e}")
        
        return results
    
    def _search_seshat(self, query: str) -> List[Dict]:
        """
        Search Seshat DB API.
        Pattern: https://seshat-db.com/api/core/{endpoint}/
        
        Args:
            query: Search query string
        
        Returns:
            List of Seshat DB results
        """
        cache_key = f"seshat:{query}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        results = []
        
        try:
            # Seshat DB API - religions endpoint
            url = f"{self.seshat_api_base}/religions/"
            
            response = self._make_request(url)
            if response and response.status_code == 200:
                data = response.json()
                
                # Process results based on actual API response structure
                if isinstance(data, list):
                    for item in data[:10]:  # Limit to 10 results
                        results.append({
                            'data': item,
                            'source': 'seshat_db',
                            'query': query
                        })
                elif isinstance(data, dict):
                    results.append({
                        'data': data,
                        'source': 'seshat_db',
                        'query': query
                    })
                
                self.cache[cache_key] = results
        except Exception as e:
            print(f"Error searching Seshat DB for '{query}': {e}")
        
        return results
    
    def _extract_commodities(self, text: str) -> List[str]:
        """
        Extract commodity mentions from text.
        
        Args:
            text: Text to analyze
        
        Returns:
            List of commodity names found
        """
        commodities = []
        text_lower = text.lower()
        
        commodity_keywords = [
            'tea', 'coffee', 'cotton', 'sugar', 'spice', 'rubber', 'coconut',
            'cinnamon', 'pepper', 'cocoa', 'tobacco', 'opium', 'silk',
            'rice', 'wheat', 'barley', 'indigo', 'jute', 'timber'
        ]
        
        for commodity in commodity_keywords:
            if commodity in text_lower:
                commodities.append(commodity.capitalize())
        
        return list(set(commodities))  # Remove duplicates
    
    def _extract_plain_text(self, wiki_markup: str) -> str:
        """
        Extract plain text from Wikipedia markup.
        Basic implementation - removes common wiki markup.
        
        Args:
            wiki_markup: Wikipedia markup text
        
        Returns:
            Plain text (approximate)
        """
        text = wiki_markup
        
        # Remove wiki links but keep text: [[Link|Text]] -> Text
        text = re.sub(r'\[\[([^\]]+)\]\]', lambda m: m.group(1).split('|')[-1], text)
        
        # Remove templates: {{template|...}} -> (removed)
        text = re.sub(r'\{\{[^\}]+\}\}', '', text)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _make_request(
        self,
        url: str,
        params: Optional[Dict] = None,
        method: str = 'GET'
    ) -> Optional[requests.Response]:
        """
        Make HTTP request with rate limiting and error handling.
        
        Args:
            url: Request URL
            params: Query parameters
            method: HTTP method
        
        Returns:
            Response object or None if error
        """
        # Rate limiting
        time.sleep(self.rate_limit)
        self.request_count += 1
        
        # Reset counter every minute (approximate)
        if self.request_count > self.max_requests_per_minute:
            time.sleep(1)
            self.request_count = 0
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(
                    url,
                    params=params,
                    timeout=self.timeout
                )
                return response
            else:
                return None
        except requests.exceptions.Timeout:
            print(f"Request timeout for {url}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"Request error for {url}: {e}")
            return None
    
    def clear_cache(self):
        """Clear the cache."""
        self.cache = {}
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics."""
        return {
            'cache_size': len(self.cache),
            'request_count': self.request_count
        }
