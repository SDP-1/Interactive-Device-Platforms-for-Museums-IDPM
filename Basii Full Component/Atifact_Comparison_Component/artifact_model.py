"""
Artifact Comparison Model - Uses Sentence Transformers for semantic similarity
Trains on your artifact dataset and provides real-time comparison capabilities
"""

import os
import sys
import json
import pickle
import numpy as np
import pandas as pd

# Fix Windows DLL loading issue with PyTorch
if sys.platform == 'win32':
    try:
        # Add torch DLL directory to search path
        import importlib.util
        torch_spec = importlib.util.find_spec('torch')
        if torch_spec and torch_spec.submodule_search_locations:
            torch_path = torch_spec.submodule_search_locations[0]
            dll_path = os.path.join(torch_path, 'lib')
            if os.path.exists(dll_path):
                os.add_dll_directory(dll_path)
                # Also add the bin directory if it exists
                bin_path = os.path.join(torch_path, 'bin')
                if os.path.exists(bin_path):
                    os.add_dll_directory(bin_path)
    except Exception as e:
        print(f"Warning: Could not add torch DLL directory: {e}")

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from typing import List, Dict, Tuple, Optional

class ArtifactComparisonModel:
    """
    A trained model for comparing museum artifacts using semantic embeddings.
    Uses Sentence Transformers to create dense vector representations of artifacts,
    enabling intelligent similarity comparison and clustering.
    """
    
    MODEL_DIR = "trained_model"
    EMBEDDINGS_FILE = "artifact_embeddings.pkl"
    METADATA_FILE = "artifact_metadata.json"
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the comparison model.
        
        Args:
            model_name: Pre-trained sentence transformer model to use
                       Options: 'all-MiniLM-L6-v2' (fast), 'all-mpnet-base-v2' (accurate)
        """
        self.model_name = model_name
        self.model: Optional[SentenceTransformer] = None
        self.artifact_embeddings: Optional[np.ndarray] = None
        self.artifacts: List[Dict] = []
        self.artifact_index: Dict[str, int] = {}
        self.clusters: Optional[np.ndarray] = None
        self.is_trained = False
        
        # Load model if trained version exists
        if self._model_exists():
            self.load_model()
    
    def _model_exists(self) -> bool:
        """Check if a trained model exists"""
        return (os.path.exists(os.path.join(self.MODEL_DIR, self.EMBEDDINGS_FILE)) and
                os.path.exists(os.path.join(self.MODEL_DIR, self.METADATA_FILE)))
    
    def _create_artifact_text(self, artifact: Dict) -> str:
        """
        Create a rich text representation of an artifact for embedding.
        Combines all relevant fields with semantic markers.
        """
        parts = []
        
        # Add structured information with context
        if artifact.get('name'):
            parts.append(f"Artifact: {artifact['name']}")
        
        if artifact.get('category'):
            parts.append(f"Type: {artifact['category']}")
            
        if artifact.get('origin'):
            parts.append(f"Origin: {artifact['origin']}")
            
        if artifact.get('era'):
            parts.append(f"Era: {artifact['era']}")
            
        if artifact.get('materials') and artifact['materials'] != 'nan':
            parts.append(f"Materials: {artifact['materials']}")
            
        if artifact.get('function') and artifact['function'] != 'nan':
            parts.append(f"Function: {artifact['function']}")
            
        if artifact.get('symbolism') and artifact['symbolism'] != 'nan':
            parts.append(f"Cultural significance: {artifact['symbolism']}")
            
        if artifact.get('notes') and artifact['notes'] != 'nan':
            parts.append(f"Features: {artifact['notes']}")
        
        return " | ".join(parts)
    
    def train(self, artifacts: List[Dict], n_clusters: int = 5) -> None:
        """
        Train the model on artifact data.
        
        Args:
            artifacts: List of artifact dictionaries
            n_clusters: Number of clusters for grouping similar artifacts
        """
        print(f"Training artifact comparison model with {len(artifacts)} artifacts...")
        
        # Store artifacts and create index
        self.artifacts = artifacts
        self.artifact_index = {a['id']: i for i, a in enumerate(artifacts)}
        
        # Load the sentence transformer model
        print(f"Loading {self.model_name} model...")
        self.model = SentenceTransformer(self.model_name)
        
        # Create text representations
        print("Creating artifact text representations...")
        artifact_texts = [self._create_artifact_text(a) for a in artifacts]
        
        # Generate embeddings
        print("Generating embeddings...")
        self.artifact_embeddings = self.model.encode(
            artifact_texts,
            show_progress_bar=True,
            convert_to_numpy=True
        )
        
        # Cluster artifacts for better comparison insights
        print(f"Clustering artifacts into {n_clusters} groups...")
        if len(artifacts) >= n_clusters:
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            self.clusters = kmeans.fit_predict(self.artifact_embeddings)
        
        self.is_trained = True
        print("Training complete!")
        
        # Save the trained model
        self.save_model()
    
    def save_model(self) -> None:
        """Save the trained model and embeddings to disk"""
        os.makedirs(self.MODEL_DIR, exist_ok=True)
        
        # Save embeddings
        embeddings_path = os.path.join(self.MODEL_DIR, self.EMBEDDINGS_FILE)
        with open(embeddings_path, 'wb') as f:
            pickle.dump({
                'embeddings': self.artifact_embeddings,
                'clusters': self.clusters,
                'model_name': self.model_name
            }, f)
        
        # Save artifact metadata
        metadata_path = os.path.join(self.MODEL_DIR, self.METADATA_FILE)
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump({
                'artifacts': self.artifacts,
                'artifact_index': self.artifact_index
            }, f, ensure_ascii=False, indent=2)
        
        print(f"Model saved to {self.MODEL_DIR}/")
    
    def load_model(self) -> None:
        """Load a previously trained model from disk"""
        print("Loading trained artifact comparison model...")
        
        # Load embeddings
        embeddings_path = os.path.join(self.MODEL_DIR, self.EMBEDDINGS_FILE)
        with open(embeddings_path, 'rb') as f:
            data = pickle.load(f)
            self.artifact_embeddings = data['embeddings']
            self.clusters = data.get('clusters')
            self.model_name = data.get('model_name', 'all-MiniLM-L6-v2')
        
        # Load metadata
        metadata_path = os.path.join(self.MODEL_DIR, self.METADATA_FILE)
        with open(metadata_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.artifacts = data['artifacts']
            self.artifact_index = data['artifact_index']
        
        # Load the sentence transformer model
        self.model = SentenceTransformer(self.model_name)
        self.is_trained = True
        
        print(f"Loaded model with {len(self.artifacts)} artifacts")
    
    def get_similarity_score(self, artifact1_id: str, artifact2_id: str) -> float:
        """
        Get the semantic similarity score between two artifacts.
        
        Returns:
            Similarity score between 0 and 1
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call train() first.")
        
        idx1 = self.artifact_index.get(artifact1_id)
        idx2 = self.artifact_index.get(artifact2_id)
        
        if idx1 is None or idx2 is None:
            return 0.0
        
        emb1 = self.artifact_embeddings[idx1].reshape(1, -1)
        emb2 = self.artifact_embeddings[idx2].reshape(1, -1)
        
        return float(cosine_similarity(emb1, emb2)[0][0])
    
    def find_similar(self, artifact_id: str, top_k: int = 5) -> List[Dict]:
        """
        Find the most similar artifacts to the given artifact.
        
        Args:
            artifact_id: ID of the artifact to find similar items for
            top_k: Number of similar artifacts to return
            
        Returns:
            List of similar artifacts with similarity scores
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call train() first.")
        
        idx = self.artifact_index.get(artifact_id)
        if idx is None:
            return []
        
        # Calculate similarities
        query_embedding = self.artifact_embeddings[idx].reshape(1, -1)
        similarities = cosine_similarity(query_embedding, self.artifact_embeddings)[0]
        
        # Get top-k similar (excluding self)
        similar_indices = np.argsort(similarities)[::-1]
        similar_indices = [i for i in similar_indices if i != idx][:top_k]
        
        results = []
        for sim_idx in similar_indices:
            artifact = self.artifacts[sim_idx].copy()
            artifact['similarity_score'] = float(similarities[sim_idx])
            artifact['same_cluster'] = (self.clusters is not None and 
                                        self.clusters[idx] == self.clusters[sim_idx])
            results.append(artifact)
        
        return results
    
    def compare_artifacts(self, artifact1_id: str, artifact2_id: str) -> Dict:
        """
        Generate a detailed comparison between two artifacts using the trained model.
        
        Returns:
            Dictionary with comparison results including:
            - similarity_score: Overall semantic similarity
            - similarities: List of identified similarities
            - differences: List of identified differences
            - comparison: Detailed comparison text
            - relationship_type: Category of relationship
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call train() first.")
        
        artifact1 = self.artifacts[self.artifact_index[artifact1_id]]
        artifact2 = self.artifacts[self.artifact_index[artifact2_id]]
        
        # Calculate similarity score
        similarity_score = self.get_similarity_score(artifact1_id, artifact2_id)
        
        # Determine relationship type based on similarity
        if similarity_score >= 0.8:
            relationship_type = "highly_similar"
        elif similarity_score >= 0.6:
            relationship_type = "related"
        elif similarity_score >= 0.4:
            relationship_type = "somewhat_related"
        else:
            relationship_type = "distinct"
        
        # Extract detailed similarities and differences
        similarities = self._extract_similarities(artifact1, artifact2, similarity_score)
        differences = self._extract_differences(artifact1, artifact2)
        
        # Generate comparison narrative
        comparison_text = self._generate_comparison_text(
            artifact1, artifact2, similarity_score, similarities, differences
        )
        
        return {
            'artifact1': artifact1,
            'artifact2': artifact2,
            'similarity_score': round(similarity_score * 100, 1),
            'relationship_type': relationship_type,
            'similarities': similarities,
            'differences': differences,
            'comparison': comparison_text,
            'same_cluster': (self.clusters is not None and 
                           self.clusters[self.artifact_index[artifact1_id]] == 
                           self.clusters[self.artifact_index[artifact2_id]])
        }
    
    def _extract_similarities(self, a1: Dict, a2: Dict, score: float) -> List[str]:
        """Extract meaningful similarities between two artifacts"""
        similarities = []
        
        # Category similarity
        if a1.get('category') == a2.get('category'):
            similarities.append(f"Both are {a1['category']}s, serving similar ceremonial or functional purposes")
        elif self._categories_related(a1.get('category', ''), a2.get('category', '')):
            similarities.append(f"Related artifact types: {a1['category']} and {a2['category']}")
        
        # Origin similarity
        if a1.get('origin') == a2.get('origin'):
            similarities.append(f"Both originate from {a1['origin']}, sharing cultural heritage")
        elif self._origins_related(a1.get('origin', ''), a2.get('origin', '')):
            region1 = self._extract_region(a1.get('origin', ''))
            region2 = self._extract_region(a2.get('origin', ''))
            if region1 and region2:
                similarities.append(f"Both from the Asian cultural sphere ({region1} and {region2})")
        
        # Era similarity
        if a1.get('era') and a2.get('era'):
            era_overlap = self._eras_overlap(a1['era'], a2['era'])
            if era_overlap:
                similarities.append(f"Contemporary artifacts from overlapping time periods ({a1['era']} and {a2['era']})")
        
        # Material similarity
        common_materials = self._find_common_materials(
            a1.get('materials', ''), a2.get('materials', '')
        )
        if common_materials:
            similarities.append(f"Share common materials: {', '.join(common_materials)}")
        
        # Functional similarity
        if score >= 0.5:
            func_similarity = self._analyze_function_similarity(
                a1.get('function', ''), a2.get('function', '')
            )
            if func_similarity:
                similarities.append(func_similarity)
        
        # Symbolic similarity
        symbolic_themes = self._find_common_themes(
            a1.get('symbolism', ''), a2.get('symbolism', '')
        )
        if symbolic_themes:
            similarities.append(f"Share symbolic themes: {', '.join(symbolic_themes)}")
        
        return similarities if similarities else ["These artifacts represent distinct cultural traditions"]
    
    def _extract_differences(self, a1: Dict, a2: Dict) -> List[str]:
        """Extract meaningful differences between two artifacts"""
        differences = []
        
        # Origin difference
        if a1.get('origin') != a2.get('origin'):
            differences.append(f"Different cultural origins: {a1.get('origin', 'Unknown')} vs {a2.get('origin', 'Unknown')}")
        
        # Category difference
        if a1.get('category') != a2.get('category'):
            differences.append(f"Different artifact types: {a1.get('category', 'Unknown')} vs {a2.get('category', 'Unknown')}")
        
        # Era difference
        if a1.get('era') != a2.get('era'):
            if not self._eras_overlap(a1.get('era', ''), a2.get('era', '')):
                differences.append(f"Different historical periods: {a1.get('era', 'Unknown')} vs {a2.get('era', 'Unknown')}")
        
        # Material differences
        unique_materials = self._find_unique_materials(
            a1.get('materials', ''), a2.get('materials', '')
        )
        if unique_materials:
            differences.append(f"Different primary materials used in construction")
        
        # Scale/dimension differences
        if a1.get('dimensions') and a2.get('dimensions'):
            if a1['dimensions'] != a2['dimensions']:
                differences.append(f"Different scales: {a1['dimensions']} vs {a2['dimensions']}")
        
        return differences if differences else ["These artifacts share remarkable similarities across most categories"]
    
    def _generate_comparison_text(self, a1: Dict, a2: Dict, score: float, 
                                   similarities: List[str], differences: List[str]) -> str:
        """Generate a detailed comparison narrative"""
        
        # Determine comparison tone based on similarity
        if score >= 0.7:
            intro = f"The {a1['name']} and {a2['name']} demonstrate remarkable parallels in their cultural significance and craftsmanship."
        elif score >= 0.5:
            intro = f"Comparing the {a1['name']} with the {a2['name']} reveals interesting connections between these artifacts."
        else:
            intro = f"The {a1['name']} and {a2['name']} represent distinctly different cultural traditions, offering valuable contrasts."
        
        # Build comparison sections
        sections = [intro, ""]
        
        # Design and Craftsmanship
        sections.append("Design and Craftsmanship")
        sections.append(f"The {a1['name']} ({a1.get('materials', 'various materials')}) and {a2['name']} ({a2.get('materials', 'various materials')}) showcase the distinctive craftsmanship of their respective cultures.")
        sections.append("")
        
        # Cultural Context
        sections.append("Cultural Context")
        if a1.get('origin') == a2.get('origin'):
            sections.append(f"Both artifacts emerge from {a1['origin']}, reflecting shared cultural values and artistic traditions.")
        else:
            sections.append(f"While the {a1['name']} originates from {a1.get('origin', 'its homeland')}, the {a2['name']} comes from {a2.get('origin', 'its homeland')}. This comparison illuminates how different cultures addressed similar needs.")
        sections.append("")
        
        # Functional Analysis
        sections.append("Functional Analysis")
        func1 = a1.get('function', '')[:200] + '...' if len(a1.get('function', '')) > 200 else a1.get('function', '')
        func2 = a2.get('function', '')[:200] + '...' if len(a2.get('function', '')) > 200 else a2.get('function', '')
        sections.append(f"{a1['name']}: {func1}")
        sections.append(f"{a2['name']}: {func2}")
        sections.append("")
        
        # Symbolic Significance
        sections.append("Symbolic Significance")
        sym1 = a1.get('symbolism', '')[:200] + '...' if len(a1.get('symbolism', '')) > 200 else a1.get('symbolism', '')
        sym2 = a2.get('symbolism', '')[:200] + '...' if len(a2.get('symbolism', '')) > 200 else a2.get('symbolism', '')
        sections.append(f"{a1['name']}: {sym1}")
        sections.append(f"{a2['name']}: {sym2}")
        sections.append("")
        
        # Conclusion
        sections.append("Cross-Cultural Insights")
        if score >= 0.6:
            sections.append(f"With a semantic similarity of {score*100:.1f}%, these artifacts demonstrate how cultural practices and artistic expressions can transcend geographical boundaries. Both pieces serve as important witnesses to human creativity and cultural exchange.")
        else:
            sections.append(f"Despite their differences (similarity: {score*100:.1f}%), comparing these artifacts reveals universal human needs for ceremonial objects, artistic expression, and cultural identity. Each represents the unique genius of its originating culture.")
        
        return "\n".join(sections)
    
    # Helper methods for comparison analysis
    def _categories_related(self, cat1: str, cat2: str) -> bool:
        """Check if categories are related"""
        cat1_lower = cat1.lower()
        cat2_lower = cat2.lower()
        
        related_groups = [
            ['sword', 'weapon', 'blade', 'dagger'],
            ['mask', 'headdress', 'crown', 'ceremonial'],
            ['drum', 'musical', 'instrument', 'bell'],
            ['statue', 'sculpture', 'figure', 'idol'],
            ['jewelry', 'ornament', 'pendant', 'necklace'],
            ['vessel', 'pot', 'container', 'bowl']
        ]
        
        for group in related_groups:
            if any(term in cat1_lower for term in group) and any(term in cat2_lower for term in group):
                return True
        return False
    
    def _origins_related(self, origin1: str, origin2: str) -> bool:
        """Check if origins are from related regions"""
        asian_countries = ['sri lanka', 'india', 'china', 'japan', 'korea', 'thailand', 'indonesia', 'nepal', 'tibet']
        
        origin1_lower = origin1.lower()
        origin2_lower = origin2.lower()
        
        is_asian1 = any(country in origin1_lower for country in asian_countries)
        is_asian2 = any(country in origin2_lower for country in asian_countries)
        
        return is_asian1 and is_asian2
    
    def _extract_region(self, origin: str) -> str:
        """Extract main region from origin string"""
        if 'sri lanka' in origin.lower():
            return 'Sri Lanka'
        elif 'india' in origin.lower():
            return 'India'
        elif 'china' in origin.lower():
            return 'China'
        elif 'japan' in origin.lower():
            return 'Japan'
        return origin.split('—')[0].strip() if '—' in origin else origin.split(',')[0].strip()
    
    def _eras_overlap(self, era1: str, era2: str) -> bool:
        """Check if two eras overlap"""
        import re
        
        def extract_years(era):
            numbers = re.findall(r'\d+', era)
            if len(numbers) >= 2:
                return (int(numbers[0]), int(numbers[-1]))
            elif len(numbers) == 1:
                num = int(numbers[0])
                return (num - 100, num + 100)
            return None
        
        years1 = extract_years(era1)
        years2 = extract_years(era2)
        
        if years1 and years2:
            return not (years1[1] < years2[0] or years2[1] < years1[0])
        return False
    
    def _find_common_materials(self, mat1: str, mat2: str) -> List[str]:
        """Find common materials between two artifacts"""
        materials = ['gold', 'silver', 'bronze', 'brass', 'copper', 'iron', 'steel',
                    'wood', 'ivory', 'jade', 'stone', 'clay', 'ceramic', 'silk',
                    'leather', 'lacquer', 'enamel', 'gemstone', 'pearl']
        
        mat1_lower = mat1.lower()
        mat2_lower = mat2.lower()
        
        return [m for m in materials if m in mat1_lower and m in mat2_lower]
    
    def _find_unique_materials(self, mat1: str, mat2: str) -> List[str]:
        """Find materials unique to each artifact"""
        common = self._find_common_materials(mat1, mat2)
        materials = ['gold', 'silver', 'bronze', 'brass', 'copper', 'iron', 'steel',
                    'wood', 'ivory', 'jade', 'stone', 'clay', 'ceramic']
        
        mat1_lower = mat1.lower()
        mat2_lower = mat2.lower()
        
        unique = []
        for m in materials:
            if m not in common:
                if m in mat1_lower:
                    unique.append(f"{m} (first artifact)")
                elif m in mat2_lower:
                    unique.append(f"{m} (second artifact)")
        return unique
    
    def _analyze_function_similarity(self, func1: str, func2: str) -> Optional[str]:
        """Analyze functional similarity between artifacts"""
        ceremonial_terms = ['ceremony', 'ritual', 'religious', 'sacred', 'worship', 'temple']
        royal_terms = ['royal', 'king', 'queen', 'palace', 'court', 'noble']
        military_terms = ['war', 'battle', 'military', 'warrior', 'combat', 'weapon']
        
        func1_lower = func1.lower()
        func2_lower = func2.lower()
        
        if any(t in func1_lower for t in ceremonial_terms) and any(t in func2_lower for t in ceremonial_terms):
            return "Both serve ceremonial or religious purposes"
        if any(t in func1_lower for t in royal_terms) and any(t in func2_lower for t in royal_terms):
            return "Both associated with royal or noble contexts"
        if any(t in func1_lower for t in military_terms) and any(t in func2_lower for t in military_terms):
            return "Both have military or warrior associations"
        return None
    
    def _find_common_themes(self, sym1: str, sym2: str) -> List[str]:
        """Find common symbolic themes"""
        themes = {
            'power': ['power', 'authority', 'strength', 'dominance'],
            'spirituality': ['spiritual', 'divine', 'sacred', 'holy', 'religious'],
            'protection': ['protection', 'guard', 'ward', 'shield', 'amulet'],
            'prosperity': ['prosperity', 'wealth', 'fortune', 'abundance'],
            'wisdom': ['wisdom', 'knowledge', 'enlightenment', 'learning']
        }
        
        sym1_lower = sym1.lower()
        sym2_lower = sym2.lower()
        
        common = []
        for theme, keywords in themes.items():
            if any(k in sym1_lower for k in keywords) and any(k in sym2_lower for k in keywords):
                common.append(theme)
        
        return common


# Training script - run this to train the model
def train_model():
    """Train the artifact comparison model using the dataset"""
    import pandas as pd
    
    print("Loading artifact dataset...")
    df = pd.read_excel('Dataset 2 component 2 - Comparison.xlsx')
    
    # Load image mapping
    image_mapping = {}
    if os.path.exists('artifact_images.json'):
        with open('artifact_images.json', 'r', encoding='utf-8') as f:
            image_mapping = json.load(f)
    
    # Convert to artifact dictionaries
    artifacts = []
    for _, row in df.iterrows():
        artifact_id = str(row['Artifact ID'])
        artifact = {
            'id': artifact_id,
            'name': str(row['Name']),
            'category': str(row['Category / Type']),
            'origin': str(row['Origin']),
            'era': str(row['Era / Historical Time Range']),
            'dimensions': str(row['Dimensions / Typical Size']),
            'materials': str(row['Materials Used']),
            'function': str(row['Function / Use (expanded)']),
            'symbolism': str(row['Symbolism / Cultural Meaning (expanded)']),
            'location': str(row['Region / Museum / Location']),
            'notes': str(row['Notes / Special Features (expanded)']),
            'is_sri_lankan': artifact_id.startswith('A'),
            'image': image_mapping.get(artifact_id, None)
        }
        artifacts.append(artifact)
    
    print(f"Loaded {len(artifacts)} artifacts")
    
    # Create and train the model
    model = ArtifactComparisonModel(model_name='all-MiniLM-L6-v2')
    model.train(artifacts, n_clusters=5)
    
    # Test the model
    print("\n--- Testing Model ---")
    if len(artifacts) >= 2:
        test_id1 = artifacts[0]['id']
        test_id2 = artifacts[1]['id']
        
        print(f"\nComparing {artifacts[0]['name']} with {artifacts[1]['name']}:")
        comparison = model.compare_artifacts(test_id1, test_id2)
        print(f"Similarity Score: {comparison['similarity_score']}%")
        print(f"Relationship: {comparison['relationship_type']}")
        print(f"\nSimilarities:")
        for s in comparison['similarities']:
            print(f"  - {s}")
        print(f"\nDifferences:")
        for d in comparison['differences']:
            print(f"  - {d}")
        
        print(f"\nFinding similar artifacts to {artifacts[0]['name']}:")
        similar = model.find_similar(test_id1, top_k=3)
        for s in similar:
            print(f"  - {s['name']}: {s['similarity_score']*100:.1f}%")
    
    print("\n✓ Model training complete! The model is saved in 'trained_model/' directory.")
    return model


if __name__ == '__main__':
    train_model()
