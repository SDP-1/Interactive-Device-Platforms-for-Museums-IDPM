"""
Layer 2: Candidate Generation
Generates candidate global events using BM25 + semantic retrieval.
"""

import re
from typing import Dict, List, Tuple, Optional
from collections import Counter
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from date_utils import year_for_ordering


class CandidateGenerator:
    """Generates candidate global events from knowledge base."""
    
    def __init__(self, global_events_db: List[Dict] = None):
        """
        Initialize candidate generator.
        
        Args:
            global_events_db: Database of known global events (can be loaded from CSV)
        """
        self.global_events_db = global_events_db or self._load_default_global_events()
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self._build_index()
    
    def _build_wikipedia_global_events(
        self,
        evidence: Dict,
        query: Optional[Dict] = None,
        max_pages: int = 40,
        query_year: Optional[int] = None,
        local_event_names: Optional[List[str]] = None,
    ) -> List[Dict]:
        """
        Turn Layer 1 Wikipedia evidence into a list of "global event" candidates.

        Your requirement: "go through the wiki links and get the events" — we treat the
        Wikipedia pages found by Layer 1 (title/url + extract/snippet) as candidate
        global causes, instead of using only the hardcoded 5-event list.
        
        Args:
            local_event_names: List of local event names to filter out (Issue 3 fix)
        """
        if not evidence:
            return []
        
        # Fix Issue 3: Build set of local event names to exclude
        local_names_set = set()
        if local_event_names:
            for name in local_event_names:
                if isinstance(name, str) and name.strip():
                    local_names_set.add(name.strip().lower())

        # --- Methodology-inspired scoring helpers (anchors + global cues) ---
        GLOBAL_CUES = {
            # 1) Colonial & imperial control
            "colonial": ["british", "colonial", "empire", "imperial", "ceylon", "crown", "governor"],
            # 2) Trade, markets, and global commerce
            "trade": ["export", "market", "trade", "shipping", "route", "harbour", "commerce", "foreign exchange", "commodity"],
            # 3) Shocks: wars, collapses, crises
            "shock": ["war", "collapse", "crisis", "devastation", "rebellion", "annexation", "conflict", "bombing", "raid"],
            # 4) Policy, treaties, governance transitions
            "policy": ["treaty", "convention", "agreement", "ordinance", "parliament", "proclamation", "signed", "annex", "ceding", "administration", "commission", "constitution"],
            # 5) Technology & infrastructure transfer
            "tech": ["railway", "canal", "steam", "infrastructure", "industrial", "irrigation", "reservoir", "dam", "tank", "weir", "sluice", "water management", "hydraulic", "drainage", "airport", "airfield"],
            # 6) Religious & cultural diffusion
            "religion_culture": ["buddhism", "missionary", "monk", "sangha", "mahayana", "theravada", "ashoka", "religious", "cultural exchange", "pilgrimage", "doctrine"],
            # 7) Transnational labor & migration systems
            "migration_labor": ["migration", "migrant", "labour", "labor", "indentured", "coolie", "recruitment", "imported", "recruited", "estate", "plantation", "workers", "south india", "tamil", "wages", "contract", "demographic"],
        }

        def _split_paragraphs(text: str) -> List[str]:
            t = str(text or "").strip()
            if not t:
                return []
            # Normalize newlines; MediaWiki extracts are usually paragraph-ish already.
            t = t.replace("\r\n", "\n").replace("\r", "\n")
            parts = [p.strip() for p in re.split(r"\n\s*\n", t) if p.strip()]
            if len(parts) <= 1:
                # Fallback split on single newlines
                parts = [p.strip() for p in t.split("\n") if p.strip()]
            # Drop very short fragments
            return [p for p in parts if len(p) >= 80]

        def _anchors_from_query(q: Optional[Dict]) -> List[str]:
            if not q:
                return []
            anchors: List[str] = []
            for k in (q.get("keywords", []) or []):
                if isinstance(k, str) and len(k) >= 3:
                    anchors.append(k.lower())
            for e in (q.get("entities", []) or []):
                if isinstance(e, str) and len(e) >= 3:
                    anchors.append(e.lower())
            # Add a few common domain anchors if curator query implies them
            base = " ".join([str(q.get("local_event_text", "") or "")] + [str(x) for x in (q.get("keywords", []) or [])]).lower()
            for w in ["tea", "coffee", "railway", "port", "plantation", "labor", "migration", "colonial", "university", "airport"]:
                if w in base:
                    anchors.append(w)
            # De-dup while preserving order
            seen = set()
            out = []
            for a in anchors:
                a = a.strip()
                if not a or a in seen:
                    continue
                seen.add(a)
                out.append(a)
            return out[:30]

        anchors = _anchors_from_query(query)
        anchors_set = set(anchors)
        religion_query = any(a in anchors_set for a in ["buddhism", "mahinda", "theravada", "ashoka", "sangha", "monk"])

        def _score_paragraph(p: str) -> Dict[str, int]:
            pl = p.lower()
            node_hits = 0
            unique_anchor_hits = 0
            for a in anchors:
                if not a:
                    continue
                c = pl.count(a)
                node_hits += c
                if c > 0:
                    unique_anchor_hits += 1
            global_hits = 0
            for _, kws in GLOBAL_CUES.items():
                for kw in kws:
                    if not kw:
                        continue
                    global_hits += pl.count(kw)
            return {
                "node_hits": node_hits,
                "global_hits": global_hits,
                "unique_anchor_hits": unique_anchor_hits,
            }

        def _best_paragraph(text: str) -> Tuple[str, Dict[str, int]]:
            ps = _split_paragraphs(text)
            if not ps:
                return "", {"node_hits": 0, "global_hits": 0}
            best = None
            best_score = (-1, -1, -1)
            best_meta = {"node_hits": 0, "global_hits": 0}
            for p in ps[:30]:
                m = _score_paragraph(p)
                # Rank primarily by local-node relevance, then global cues.
                # This avoids picking unrelated "high global cue" paragraphs (e.g., modern wars)
                # when the local event is specific (e.g., Mahinda mission / Buddhism transfer).
                score = (m["node_hits"], m["unique_anchor_hits"], m["global_hits"], len(p))
                if score > best_score:
                    best_score = score
                    best = p
                    best_meta = m
            return (best or ps[0]), best_meta

        # Prefer the sources you print in the console after Layer 1.
        # Prefer plaintext extracts first (clean text), then search/snippets.
        source_keys = [
            "wikipedia_extracts",
            "wikipedia_search_results",
            "wikipedia_snippets",
            # also allow other Wikipedia-derived keys if present
            "wikipedia_category_results",
            # Keep full content last; it may contain wiki-markup that isn't curator-friendly.
            "wikipedia_full_content",
        ]

        raw_pages: List[Dict] = []
        for key in source_keys:
            for item in (evidence.get(key, []) or []):
                if not isinstance(item, dict):
                    continue
                title = (item.get("title") or item.get("name") or "").strip()
                if not title:
                    continue
                text = (
                    (item.get("extract") or "")
                    or (item.get("snippet") or "")
                    or (item.get("plain_text") or "")
                    or (item.get("content") or "")
                )
                url = (item.get("url") or "").strip()
                pageid = item.get("pageid")
                raw_pages.append(
                    {
                        "title": title,
                        "text": str(text or ""),
                        "url": url,
                        "pageid": pageid,
                        "source_key": key,
                    }
                )

        # De-duplicate by title while preserving order.
        # IMPORTANT: prefer clean plaintext extracts over longer but messy sources (e.g., full wiki markup).
        by_title: Dict[str, Dict] = {}
        order: List[str] = []
        for p in raw_pages:
            t = p["title"]
            if t not in by_title:
                by_title[t] = p
                order.append(t)
            else:
                cur = by_title[t]
                cur_key = str(cur.get("source_key", "") or "")
                new_key = str(p.get("source_key", "") or "")

                # Prefer plaintext extracts first
                if cur_key != "wikipedia_extracts" and new_key == "wikipedia_extracts":
                    by_title[t] = p
                    continue
                if cur_key == "wikipedia_extracts" and new_key != "wikipedia_extracts":
                    continue

                # Otherwise, prefer longer text within same priority tier
                if len(p.get("text", "")) > len(cur.get("text", "")):
                    by_title[t] = p

        wiki_events: List[Dict] = []
        local_title = ""
        if query and isinstance(query, dict):
            local_title = str(query.get("local_event_text", "") or "").strip().lower()
        for t in order[:max_pages]:
            p = by_title[t]
            node_id = self._wiki_node_id(p.get("pageid"), t)
            raw_text = str(p.get("text", "") or "")
            cleaned_text = self._clean_text(raw_text)

            # Prefer one strong paragraph rather than a noisy/truncated blob.
            best_p, score_meta = _best_paragraph(raw_text)
            desc = self._clean_text(best_p) if best_p else cleaned_text
            # Fix Issue 1: Remove hard truncation cap. Instead, find a natural sentence boundary.
            # If description is very long, try to find a good stopping point at sentence end.
            if len(desc) > 2000:
                # Find the last complete sentence before 2000 chars
                truncated = desc[:2000]
                # Look for sentence endings (. ! ?) in the last 200 chars
                last_sentence_end = max(
                    truncated.rfind('.', len(truncated) - 200),
                    truncated.rfind('!', len(truncated) - 200),
                    truncated.rfind('?', len(truncated) - 200)
                )
                if last_sentence_end > 500:  # Only use if we found a reasonable sentence end
                    desc = truncated[:last_sentence_end + 1].rstrip()
                else:
                    # Fallback: find last word boundary
                    desc = truncated.rsplit(" ", 1)[0].rstrip() + "..."

            date_guess = self._guess_date_from_text(raw_text, query_year=query_year)
            guessed_year = year_for_ordering(date_guess) if date_guess else None

            # Heuristic filters to drop clearly irrelevant/non-causal pages for this pipeline.
            # Examples seen in your output: "Tea growing in Azerbaijan", product pages, etc.
            title_l = t.lower()
            if any(bad in title_l for bad in ["matcha", "masala chai", "chai", "tea growing in "]):
                continue

            # Fix Issue 3: Do not treat the local event page itself as a "global influence".
            # Also check against all known local event names to prevent local events appearing as global.
            if local_title and title_l == local_title:
                continue
            # Check if this title matches any local event name (case-insensitive, partial match)
            if local_names_set:
                title_words = set(title_l.split())
                for local_name in local_names_set:
                    local_words = set(local_name.split())
                    # If significant overlap (more than 2 words match), likely a local event
                    if len(title_words & local_words) >= 2 and len(local_words) <= 5:
                        continue
                # Also check exact or near-exact match
                if title_l in local_names_set:
                    continue
                # Check if title is a substring of any local event name (e.g., "Negombo" in "Bandaranaike International Airport in Negombo")
                for local_name in local_names_set:
                    if title_l in local_name or local_name in title_l:
                        # Only skip if it's clearly a place name, not a global event
                        if any(place_word in title_l for place_word in ["airport", "airfield", "harbour", "harbor", "port", "city", "town", "district"]):
                            continue

            # Filter out clearly local place pages unless they show global-cue evidence.
            # This prevents "Negombo" (and similar) showing up as a global influence.
            global_hits = int(score_meta.get("global_hits", 0))
            node_hits = int(score_meta.get("node_hits", 0))

            # Religion/cultural-diffusion query guard:
            # keep candidates tied to Buddhist transmission context and avoid modern conflict-only pages.
            if religion_query:
                rel_terms = ["buddhism", "buddhist", "mahinda", "ashoka", "theravada", "sangha", "missionary", "doctrine"]
                candidate_text_l = f"{title_l} {cleaned_text.lower()}"
                rel_hits = sum(candidate_text_l.count(rt) for rt in rel_terms)

                # Drop pages dominated by modern conflict terms when they are not religion-relevant.
                conflict_title = any(x in title_l for x in ["civil war", "war", "rebellion", "bombing", "raid"])
                if conflict_title and rel_hits < 3:
                    continue
                if rel_hits == 0 and conflict_title:
                    continue

                # Require at least some anchor relevance for religion-mode queries.
                if node_hits == 0 and rel_hits == 0:
                    continue

            if global_hits < 2:
                # If title looks like a plain place/venue and we have low global cues, drop it.
                if any(tok in title_l for tok in ["district", "town", "city", "village", "municipal", "province", "negombo", "colombo", "kandy"]):
                    continue
            # Stronger place-page filter: even if there are colonial keywords, a city page rarely constitutes
            # a "global influence" by itself for curator output. Require higher global-cue density.
            if any(tok in title_l for tok in ["negombo", "colombo", "kandy", "galle", "jaffna", "trincomalee"]):
                if global_hits < 6 and not any(x in title_l for x in ["war", "treaty", "convention", "canal", "revolution", "empire"]):
                    continue

                # If the whole description has almost no global cues, also drop.
                total_hits = 0
                tl = cleaned_text.lower()
                for _, kws in GLOBAL_CUES.items():
                    for kw in kws:
                        total_hits += tl.count(kw)
                if total_hits < 2 and len(cleaned_text) < 500:
                    continue

            # If we have a local year, reject candidates that are far in the future relative to the local event.
            if query_year is not None and guessed_year is not None:
                # BCE local events are special: many valid global-cause pages contain mixed CE years,
                # so strict future filtering can incorrectly drop good candidates.
                if query_year >= 0 and guessed_year > query_year + 10:
                    continue

            wiki_events.append(
                {
                    "node_id": node_id,
                    "event_name": p["title"],
                    "date": date_guess or "",
                    "location": "",
                    "description": desc,
                    "keywords": self._extract_keywords_simple(f"{p['title']} {p.get('text','')}"),
                    "source_url": p.get("url", ""),
                    "source": "wikipedia",
                    "global_cue_hits": global_hits,
                    "node_anchor_hits": int(score_meta.get("node_hits", 0)),
                }
            )

        return wiki_events

    def _wiki_node_id(self, pageid: Optional[int], title: str) -> str:
        if pageid is not None:
            try:
                return f"WIKI_{int(pageid)}"
            except Exception:
                pass
        slug = re.sub(r"[^A-Za-z0-9]+", "_", (title or "").strip()).strip("_")
        if not slug:
            slug = "UNKNOWN"
        return f"WIKI_{slug[:60]}"

    def _clean_text(self, s: str) -> str:
        s = str(s or "")
        s = re.sub(r"<[^>]+>", " ", s)  # strip HTML tags (snippets)
        # strip common wiki-markup remnants / template noise
        s = s.replace("{{", " ").replace("}}", " ").replace("|", " ").replace("=", " ")
        s = re.sub(r"\s+", " ", s).strip()
        return s

    def _guess_date_from_text(self, text: str, query_year: Optional[int] = None) -> str:
        """
        Heuristic: find a plausible year in the page extract/snippet.
        - If it finds "247 BCE" -> returns "247 BCE"
        - If it finds 4-digit year -> returns "YYYY-01-01"
        """
        t = self._clean_text(text).lower()
        if not t:
            return ""

        m = re.search(r"\b(\d{1,4})\s*(bce)\b", t)
        if m:
            return f"{int(m.group(1))} BCE"

        # Prefer a plausible 4-digit year in text.
        # If we know the local event year, prefer years near/before it (prevents spurious years like 1011).
        years = []
        for m in re.finditer(r"\b(\d{4})\b", t):
            try:
                years.append(int(m.group(1)))
            except Exception:
                continue
        if years:
            years = [y for y in years if 1000 <= y <= 2100]
            if not years:
                return ""

            if query_year is not None:
                try:
                    qy = int(query_year)
                    # Prefer causes not too far after the local event (and not centuries earlier unless nothing else exists).
                    window = [y for y in years if (qy - 250) <= y <= (qy + 10)]
                    if window:
                        # Prefer latest year <= qy (likely causal lead-up)
                        past = [y for y in window if y <= qy]
                        pick = max(past) if past else min(window)
                        return f"{pick:04d}-01-01"
                except Exception:
                    pass

            # Fallback: earliest plausible year
            y = min(years)
            return f"{y:04d}-01-01"

        return ""

    def _extract_keywords_simple(self, text: str) -> List[str]:
        """
        Lightweight keyword extractor for Wikipedia-derived candidates.
        Keeps this dependency-free and fast.
        """
        t = self._clean_text(text).lower()
        tokens = re.findall(r"[a-z]{3,}", t)
        stop = {
            "the", "and", "for", "with", "from", "that", "this", "into", "over", "under",
            "was", "were", "are", "has", "had", "have", "also", "not", "but", "their",
            "his", "her", "its", "they", "them", "who", "when", "where", "which",
            "may", "can", "would", "could", "should", "during", "after", "before",
            "between", "including", "such", "other", "most", "many", "some",
        }
        tokens = [w for w in tokens if w not in stop]
        counts = Counter(tokens)
        return [w for (w, _) in counts.most_common(12)]

    def _load_default_global_events(self) -> List[Dict]:
        """Load default global events database."""
        return [
            {
                'node_id': 'GLOBAL_001',
                'event_name': 'Industrial Revolution',
                'date': '1760-01-01',
                'location': 'Europe',
                'description': 'Technological and economic transformation creating global demand for commodities',
                'keywords': ['industrial', 'revolution', 'technology', 'manufacturing', 'economic', 'transformation']
            },
            {
                'node_id': 'GLOBAL_002',
                'event_name': 'American Civil War',
                'date': '1861-04-12',
                'location': 'United States',
                'description': 'War disrupting global cotton supply chains causing economic shifts worldwide',
                'keywords': ['civil', 'war', 'america', 'cotton', 'supply', 'disruption', 'economic']
            },
            {
                'node_id': 'GLOBAL_003',
                'event_name': 'Opium Wars',
                'date': '1839-01-01',
                'location': 'China',
                'description': 'British-Chinese conflicts affecting global trade routes and colonial strategies',
                'keywords': ['opium', 'war', 'china', 'british', 'trade', 'colonial']
            },
            {
                'node_id': 'GLOBAL_004',
                'event_name': 'Coffee Leaf Rust Epidemic',
                'date': '1869-01-01',
                'location': 'Global',
                'description': 'Global coffee leaf rust disease devastated coffee plantations worldwide',
                'keywords': ['coffee', 'rust', 'disease', 'epidemic', 'plantation', 'agricultural']
            },
            {
                'node_id': 'GLOBAL_005',
                'event_name': 'British Colonial Expansion',
                'date': '1850-01-01',
                'location': 'Global',
                'description': 'Expansion of British colonial empire and economic control',
                'keywords': ['british', 'colonial', 'empire', 'expansion', 'economic', 'control']
            },
        ]
    
    def _build_index(self):
        """Build search index from global events."""
        self.event_texts = []
        for event in self.global_events_db:
            text = f"{event['event_name']} {event.get('description', '')} {' '.join(event.get('keywords', []))}"
            self.event_texts.append(text)
        
        if self.event_texts:
            self.tfidf_matrix = self.vectorizer.fit_transform(self.event_texts)
        else:
            self.tfidf_matrix = None
    
    def generate_candidates(
        self,
        query: Dict,
        evidence: Dict,
        top_k: int = 50,
        local_event_names: Optional[List[str]] = None,
    ) -> List[Dict]:
        """
        Generate candidate global events.
        
        Args:
            query: Structured query from Layer 0
            evidence: Evidence from Layer 1
            top_k: Number of top candidates to return
            local_event_names: List of local event names to filter out (Issue 3 fix)
        
        Returns:
            List of candidate global events with metadata
        """
        candidates = []

        # NEW: Build global-event candidates from Wikipedia pages found in Layer 1.
        # If Wikipedia yields nothing (offline/no results), fall back to the small default DB.
        query_year = None
        try:
            query_year = int(query.get("date_range", {}).get("year")) if query.get("date_range") else None
        except Exception:
            query_year = None

        wiki_events = self._build_wikipedia_global_events(
            evidence,
            query=query,
            max_pages=max(20, min(60, top_k)),
            query_year=query_year,
            local_event_names=local_event_names,
        )
        using_default_db = not bool(wiki_events)
        active_db = self.global_events_db if using_default_db else wiki_events
        
        # Combine query text and evidence
        search_text = f"{query['local_event_text']} {' '.join(query.get('keywords', []))}"
        
        # Extract text from evidence
        evidence_texts = []
        for snippet in evidence.get('raw_text_evidence', []):
            evidence_texts.append(snippet.get('extract', ''))
        
        combined_text = search_text + ' ' + ' '.join(evidence_texts)
        
        # TF-IDF similarity over the active DB
        if active_db:
            if using_default_db and self.tfidf_matrix is not None and len(self.event_texts) > 0:
                vectorizer = self.vectorizer
                tfidf_matrix = self.tfidf_matrix
                event_texts = self.event_texts
            else:
                vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
                event_texts = [
                    f"{ev.get('event_name','')} {ev.get('description','')} {' '.join(ev.get('keywords', []) or [])}"
                    for ev in active_db
                ]
                tfidf_matrix = vectorizer.fit_transform(event_texts) if event_texts else None

            if tfidf_matrix is None or not event_texts:
                return []

            query_vector = vectorizer.transform([combined_text])
            similarities = cosine_similarity(query_vector, tfidf_matrix)[0]
            
            # Get top candidates
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            for idx in top_indices:
                event = active_db[idx]
                similarity_score = similarities[idx]
                
                # Calculate additional relevance features
                keyword_match = self._calculate_keyword_match(query, event)
                entity_match = self._calculate_entity_match(query, event)
                temporal_relevance = self._calculate_temporal_relevance(query, event)
                
                # Combined relevance score with better weighting
                # Boost scores for better matching
                similarity_boost = similarity_score * 1.2 if similarity_score > 0.3 else similarity_score
                keyword_boost = keyword_match * 1.3 if keyword_match > 0.2 else keyword_match
                
                relevance_score = (
                    0.35 * min(1.0, similarity_boost) +
                    0.35 * min(1.0, keyword_boost) +
                    0.15 * entity_match +
                    0.15 * temporal_relevance
                )
                query_text_lower = query.get('local_event_text', '').lower()
                event_name_lower = event.get('event_name', '').lower()
                
                # Keep the old "special boosts" only for the tiny fallback DB.
                # When using Wikipedia-derived candidates, we let retrieval drive results.
                if using_default_db:
                    
                    # Tea-related events
                    if 'tea' in query_text_lower:
                        if 'american civil war' in event_name_lower:
                            relevance_score = max(relevance_score, 0.85)
                        if 'industrial revolution' in event_name_lower:
                            relevance_score = max(relevance_score, 0.80)
                        if 'coffee leaf rust' in event_name_lower:
                            relevance_score = max(relevance_score, 0.75)
                    
                    # Railway-related events
                    if 'railway' in query_text_lower or 'rail' in query_text_lower:
                        if 'industrial revolution' in event_name_lower:
                            relevance_score = max(relevance_score, 0.88)
                        if 'british colonial' in event_name_lower:
                            relevance_score = max(relevance_score, 0.78)
                    
                    # Coffee-related events
                    if 'coffee' in query_text_lower:
                        if 'coffee leaf rust' in event_name_lower:
                            relevance_score = max(relevance_score, 0.92)
                        if 'american civil war' in event_name_lower:
                            relevance_score = max(relevance_score, 0.82)
                else:
                    # Wikipedia-derived boost for Buddhist transmission queries.
                    if any(k in query_text_lower for k in ['buddhism', 'mahinda', 'theravada', 'ashoka']):
                        if any(k in event_name_lower for k in ['ashoka', 'theravada', 'buddhism', 'maurya', 'mahinda']):
                            relevance_score = max(relevance_score, 0.75)
                
                candidates.append({
                    'global_event': event,
                    'relevance_score': float(relevance_score),
                    'similarity_score': float(similarity_score),
                    'keyword_match': float(keyword_match),
                    'entity_match': float(entity_match),
                    'temporal_relevance': float(temporal_relevance),
                    'metadata': {
                        'date': event.get('date', ''),
                        'location': event.get('location', ''),
                        'snippets': evidence.get('raw_text_evidence', [])[:3]  # Top 3 snippets
                    }
                })
        
        # Sort by relevance score
        candidates.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        # Return more than 5 (your requirement). GraphConstructor uses top 20.
        # We keep a soft filter but never drop below 10 if we have enough candidates.
        filtered = [c for c in candidates if c['relevance_score'] > 0.15]
        pool = filtered if len(filtered) >= 10 else candidates
        return pool[:min(top_k, 20)]
    
    def _calculate_keyword_match(self, query: Dict, event: Dict) -> float:
        """Calculate keyword overlap between query and event."""
        query_keywords = set(query.get('keywords', []))
        event_keywords = set(event.get('keywords', []))
        
        if not query_keywords:
            return 0.0
        
        overlap = len(query_keywords & event_keywords)
        return min(1.0, overlap / len(query_keywords))
    
    def _calculate_entity_match(self, query: Dict, event: Dict) -> float:
        """Calculate entity overlap between query and event."""
        query_entities = set([e.lower() for e in query.get('entities', [])])
        event_text = f"{event.get('event_name', '')} {event.get('description', '')}".lower()
        
        matches = sum(1 for entity in query_entities if entity in event_text)
        return min(1.0, matches / max(1, len(query_entities)))
    
    def _calculate_temporal_relevance(self, query: Dict, event: Dict) -> float:
        """Calculate temporal relevance (events before local event are more relevant)."""
        if not query.get('date_range') or not event.get('date'):
            return 0.5  # Neutral if dates unknown
        
        try:
            query_year = query['date_range'].get('year')
            event_year = year_for_ordering(str(event.get('date', '') or ''))
            
            if query_year and event_year:
                # Prefer events that happened before or during the local event
                if event_year <= query_year:
                    # Closer in time = more relevant
                    gap = query_year - event_year
                    if gap <= 10:
                        return 1.0
                    elif gap <= 50:
                        return 0.8
                    elif gap <= 100:
                        return 0.6
                    else:
                        return 0.4
                else:
                    # Future events are less relevant
                    return 0.2
        except:
            return 0.5
        
        return 0.5

