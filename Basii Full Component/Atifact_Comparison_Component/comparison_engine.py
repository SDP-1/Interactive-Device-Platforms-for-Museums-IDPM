import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

# Minimum combined score required to appear in results (0–1 scale).
# Set very low — we rely on sorting so the best matches always rank first,
# and any artifact that clears this floor is at least marginally related.
MIN_SIMILARITY_THRESHOLD = 0.05

# Weights for each field in the combined similarity score
FIELD_WEIGHTS = {
    'category':  0.35,
    'name':      0.10,  # artifact name contains strong type signals (e.g., "Mortar" vs "Grinding Stone")
    'materials': 0.20,
    'function':  0.17,
    'symbolism': 0.10,
    'notes':     0.08,
}

_STOP_WORDS = frozenset([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by',
    'for', 'from', 'has', 'have', 'in', 'is', 'it', 'its', 'of', 'on',
    'or', 'that', 'the', 'their', 'they', 'this', 'to', 'used', 'was',
    'were', 'which', 'with', 'also', 'both', 'often', 'can', 'such',
    'may', 'more', 'other', 'into', 'through', 'during', 'each', 'some',
    'when', 'while', 'well', 'use', 'using', 'made', 'would', 'could',
    # domain-common words that appear in almost every artifact description
    'cultural', 'symbolic', 'ritual', 'traditional', 'ceremonial',
    'associated', 'often', 'typically', 'usually', 'include', 'includes',
    'known', 'represent', 'represented', 'represents', 'significance',
    'significant', 'important', 'community', 'society', 'context',
    'example', 'various', 'serve', 'served', 'serves', 'form', 'forms',
    'common', 'commonly', 'used', 'uses', 'object', 'objects', 'item',
    'crafted', 'craft', 'found', 'decorated', 'decoration', 'feature',
    'features', 'region', 'regional', 'local', 'historical', 'history',
])


def _tokenize(text: str) -> set:
    """Lowercase word tokens with stop-word removal."""
    words = re.findall(r'\b[a-zA-Z]{2,}\b', text.lower())
    return {w for w in words if w not in _STOP_WORDS}


def _jaccard(set1: set, set2: set) -> float:
    """Jaccard similarity between two token sets."""
    if not set1 or not set2:
        return 0.0
    union = set1 | set2
    inter = set1 & set2
    return len(inter) / len(union)


class ComparisonEngine:
    def __init__(self, artifacts):
        self.artifacts = artifacts
        self.artifact_dict = {a['id']: a for a in artifacts}
        _fields = list(FIELD_WEIGHTS.keys())
        self._vectorizers: dict = {}
        self._field_matrices: dict = {}
        self._build_similarity_index()

    # ------------------------------------------------------------------
    # Index building
    # ------------------------------------------------------------------

    def _build_similarity_index(self):
        """Build per-field TF-IDF matrices for accurate weighted similarity."""
        for field in FIELD_WEIGHTS:
            texts = [str(a.get(field, '')) for a in self.artifacts]
            # Need at least 2 non-empty docs; fall back to raw Jaccard otherwise
            non_empty = sum(1 for t in texts if t.strip())
            if non_empty >= 2:
                # Build extended stop-word list for long text fields
                extra_stops = list(_STOP_WORDS) if field in ('function', 'symbolism', 'notes') else []
                vec = TfidfVectorizer(
                    ngram_range=(1, 2),
                    max_features=500,
                    sublinear_tf=True,
                    stop_words='english',
                    min_df=1,
                    max_df=0.85,  # ignore terms in >85% of docs (too common to discriminate)
                )
                try:
                    matrix = vec.fit_transform(texts)
                    self._vectorizers[field] = vec
                    self._field_matrices[field] = matrix
                except Exception:
                    pass  # fall back to Jaccard for this field

    # ------------------------------------------------------------------
    # Per-field cosine similarity
    # ------------------------------------------------------------------

    def _field_cosine(self, idx1: int, idx2: int, field: str) -> float:
        """Return cosine similarity for *field* between two artifact indices."""
        if field not in self._field_matrices:
            # Jaccard fallback
            a1 = self.artifacts[idx1]
            a2 = self.artifacts[idx2]
            return _jaccard(_tokenize(str(a1.get(field, ''))),
                            _tokenize(str(a2.get(field, ''))))
        mat = self._field_matrices[field]
        v1 = mat[idx1]
        v2 = mat[idx2]
        denom = (np.linalg.norm(v1.toarray()) * np.linalg.norm(v2.toarray()))
        if denom == 0:
            return 0.0
        return float(np.dot(v1.toarray(), v2.toarray().T).flat[0] / denom)

    # ------------------------------------------------------------------
    # Category similarity — uses both TF-IDF cosine AND Jaccard on tokens,
    # then boosts pairs that share the most meaningful keyword
    # ------------------------------------------------------------------

    _CATEGORY_KEYWORDS = {
        'sword':          ['sword', 'blade', 'katana', 'sabre', 'saber', 'dagger', 'knife'],
        'drum':           ['drum', 'percussion', 'tabla', 'taiko', 'taika'],
        'mask':           ['mask', 'masquerade'],
        'mural':          ['mural', 'fresco', 'painting', 'art'],
        'lamp':           ['lamp', 'light', 'diya', 'lantern', 'deepam'],
        # pottery/vessel — 'pot' removed (ambiguous: "Pot of Plenty" is a ritual symbol)
        'pottery':        ['pottery', 'amphora', 'terracotta', 'vessel', 'storage'],
        'textile':        ['textile', 'weaving', 'loom', 'fabric', 'thread', 'lace', 'bobbin'],
        'jewelry':        ['jewelry', 'jewellery', 'necklace', 'bracelet', 'ornament', 'pendant', 'ring'],
        # mortar/pestle tools (checked before generic 'tool' to take priority)
        'mortar':         ['mortar', 'pestle', 'suribachi'],
        # flat/slab grinding stones
        'grinding_stone': ['grinding', 'grind', 'millstone', 'quern', 'metate', 'mano'],
        'wood_craft':     ['lacquer', 'lathe', 'turned', 'lac', 'lacquerware'],
        'arch_carving':   ['pillar', 'column', 'relief', 'entrance', 'threshold', 'architectural'],
        'sacred_carving': ['torana', 'stele', 'inscription', 'engraving'],
        # ritual symbols (kalasha/cornucopia) — must be resolved before generic terms
        'ritual_symbol':  ['kalasha', 'cornucopia', 'mandala', 'votive', 'sculpture', 'symbol'],
        'ritual_lamp':    ['deepam', 'diya', 'puja'],
        'social_tool':    ['betel', 'cutter', 'nut', 'buyo'],  # betel cutters are unique
    }

    def _category_similarity(self, idx1: int, idx2: int) -> float:
        a1 = self.artifacts[idx1]
        a2 = self.artifacts[idx2]
        c1 = str(a1.get('category', '')).lower()
        c2 = str(a2.get('category', '')).lower()
        # Include the artifact name in keyword matching so that e.g.
        # A009 name "Grinding Stone" can match C009 category "Grinding Stone"
        n1 = c1 + ' ' + str(a1.get('name', '')).lower()
        n2 = c2 + ' ' + str(a2.get('name', '')).lower()

        # Collect the most-specific keyword group each artifact belongs to
        # (groups are ordered most-specific first in _CATEGORY_KEYWORDS).
        # Use TOKEN-level matching to avoid substring false-positives
        # (e.g., 'diya' must not match inside 'Wangediya').
        toks1 = _tokenize(n1)
        toks2 = _tokenize(n2)
        grp1 = next((g for g, kws in self._CATEGORY_KEYWORDS.items()
                     if any(k in toks1 for k in kws)), None)
        grp2 = next((g for g, kws in self._CATEGORY_KEYWORDS.items()
                     if any(k in toks2 for k in kws)), None)

        if grp1 is not None and grp2 is not None:
            if grp1 == grp2:
                # Same semantic type → strong bonus
                tok_jac = _jaccard(_tokenize(c1), _tokenize(c2))
                return min(1.0, 0.65 + 0.35 * tok_jac)
            else:
                # Different semantic types → very low category similarity
                # (override even identical-string categories like "Domestic Tool")
                return 0.05

        # One or both have no known group — fall back to Jaccard + TF-IDF
        tok1 = _tokenize(c1)
        tok2 = _tokenize(c2)
        jac = _jaccard(tok1, tok2)
        cos = self._field_cosine(idx1, idx2, 'category')
        return min(1.0, 0.5 * jac + 0.5 * cos)

    # ------------------------------------------------------------------
    # Combined score
    # ------------------------------------------------------------------

    def _combined_score(self, idx1: int, idx2: int) -> float:
        cat_w  = FIELD_WEIGHTS['category']
        name_w = FIELD_WEIGHTS['name']
        mat_w  = FIELD_WEIGHTS['materials']
        func_w = FIELD_WEIGHTS['function']
        sym_w  = FIELD_WEIGHTS['symbolism']
        nts_w  = FIELD_WEIGHTS['notes']

        cat_sim  = self._category_similarity(idx1, idx2)
        name_sim = self._field_cosine(idx1, idx2, 'name')

        # Materials: Jaccard on tokens is more reliable for short comma lists
        a1 = self.artifacts[idx1]
        a2 = self.artifacts[idx2]
        mat_sim = _jaccard(
            _tokenize(str(a1.get('materials', ''))),
            _tokenize(str(a2.get('materials', '')))
        )

        func_sim = self._field_cosine(idx1, idx2, 'function')
        sym_sim  = self._field_cosine(idx1, idx2, 'symbolism')
        nts_sim  = self._field_cosine(idx1, idx2, 'notes')

        score = (cat_w  * cat_sim
               + name_w * name_sim
               + mat_w  * mat_sim
               + func_w * func_sim
               + sym_w  * sym_sim
               + nts_w  * nts_sim)

        return float(score)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def find_similar(self, artifact_id, num_results=5):
        """Find similar artifacts to the given artifact.

        Always returns up to *num_results* entries, sorted by score descending,
        so the Similar-Artifacts section is always populated.  Scores reflect
        true weighted similarity — a 15% score honestly means "somewhat related"
        while a 60% score means "very closely related".
        """
        if artifact_id not in self.artifact_dict:
            return []

        artifact_idx = next(
            i for i, a in enumerate(self.artifacts) if a['id'] == artifact_id
        )
        artifact = self.artifact_dict[artifact_id]

        # Compute combined score for every other artifact
        all_scores = []
        for idx in range(len(self.artifacts)):
            if idx == artifact_idx:
                continue
            score = self._combined_score(artifact_idx, idx)
            all_scores.append((idx, score))

        # Sort best-first; always take top N (floor-filtered only to exclude
        # truly zero-score entries so completely unrelated items don't show)
        all_scores.sort(key=lambda x: x[1], reverse=True)
        top = [(idx, s) for idx, s in all_scores if s >= MIN_SIMILARITY_THRESHOLD][:num_results]

        # If still short (very unusual), pad with next best regardless of floor
        if len(top) < num_results:
            shown_idxs = {idx for idx, _ in top}
            for idx, s in all_scores:
                if idx not in shown_idxs:
                    top.append((idx, s))
                if len(top) >= num_results:
                    break

        results = []
        for idx, score in top:
            similar_artifact = self.artifacts[idx].copy()
            similar_artifact['similarity_score'] = round(score, 4)
            similar_artifact['comparison_points'] = self._extract_comparison_points(
                artifact, similar_artifact
            )
            results.append(similar_artifact)

        return results

    # ------------------------------------------------------------------
    # Comparison points
    # ------------------------------------------------------------------

    def _extract_comparison_points(self, artifact1, artifact2):
        """Extract key comparison points between two artifacts."""
        points = []

        # Category comparison
        points.append({
            'type': 'category',
            'artifact1': artifact1['category'],
            'artifact2': artifact2['category'],
            'similarity': 'same' if artifact1['category'] == artifact2['category'] else 'different',
        })

        # Material comparison
        materials1 = _tokenize(str(artifact1.get('materials', '')))
        materials2 = _tokenize(str(artifact2.get('materials', '')))
        common_materials = sorted(materials1 & materials2)
        if common_materials:
            points.append({
                'type': 'materials',
                'common': common_materials[:3],
                'similarity': 'similar',
            })

        # Era comparison
        if artifact1.get('era') and artifact2.get('era'):
            points.append({
                'type': 'era',
                'artifact1': artifact1['era'],
                'artifact2': artifact2['era'],
            })

        # Origin comparison
        points.append({
            'type': 'origin',
            'artifact1': artifact1.get('origin', ''),
            'artifact2': artifact2.get('origin', ''),
        })

        return points

