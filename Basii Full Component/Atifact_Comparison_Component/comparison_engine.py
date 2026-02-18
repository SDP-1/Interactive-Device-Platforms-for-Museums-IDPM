import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

class ComparisonEngine:
    def __init__(self, artifacts):
        self.artifacts = artifacts
        self.artifact_dict = {a['id']: a for a in artifacts}
        self.vectorizer = None
        self.artifact_vectors = None
        self._build_similarity_index()
    
    def _build_similarity_index(self):
        """Build TF-IDF vectors for all artifacts based on their metadata"""
        # Combine relevant fields for similarity matching
        texts = []
        for artifact in self.artifacts:
            text = ' '.join([
                artifact.get('category', ''),
                artifact.get('materials', ''),
                artifact.get('function', ''),
                artifact.get('symbolism', ''),
                artifact.get('notes', '')
            ])
            texts.append(text)
        
        # Create TF-IDF vectors
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.artifact_vectors = self.vectorizer.fit_transform(texts)
    
    def find_similar(self, artifact_id, num_results=5):
        """Find similar artifacts to the given artifact"""
        if artifact_id not in self.artifact_dict:
            return []
        
        artifact_idx = next(i for i, a in enumerate(self.artifacts) if a['id'] == artifact_id)
        artifact = self.artifact_dict[artifact_id]
        
        # Get similarity scores
        query_vector = self.artifact_vectors[artifact_idx]
        similarities = cosine_similarity(query_vector, self.artifact_vectors)[0]
        
        # Get indices sorted by similarity (excluding the artifact itself)
        similar_indices = np.argsort(similarities)[::-1]
        similar_indices = [idx for idx in similar_indices if idx != artifact_idx][:num_results]
        
        # Build results with similarity scores
        results = []
        for idx in similar_indices:
            similar_artifact = self.artifacts[idx].copy()
            similar_artifact['similarity_score'] = float(similarities[idx])
            
            # Add comparison points
            similar_artifact['comparison_points'] = self._extract_comparison_points(
                artifact, similar_artifact
            )
            
            results.append(similar_artifact)
        
        return results
    
    def _extract_comparison_points(self, artifact1, artifact2):
        """Extract key comparison points between two artifacts"""
        points = []
        
        # Category comparison
        if artifact1['category'] != artifact2['category']:
            points.append({
                'type': 'category',
                'artifact1': artifact1['category'],
                'artifact2': artifact2['category'],
                'similarity': 'different'
            })
        else:
            points.append({
                'type': 'category',
                'artifact1': artifact1['category'],
                'artifact2': artifact2['category'],
                'similarity': 'same'
            })
        
        # Material comparison
        materials1 = set(re.findall(r'\b\w+\b', artifact1['materials'].lower()))
        materials2 = set(re.findall(r'\b\w+\b', artifact2['materials'].lower()))
        common_materials = materials1.intersection(materials2)
        if common_materials:
            points.append({
                'type': 'materials',
                'common': list(common_materials)[:3],
                'similarity': 'similar'
            })
        
        # Era comparison
        if artifact1['era'] and artifact2['era']:
            points.append({
                'type': 'era',
                'artifact1': artifact1['era'],
                'artifact2': artifact2['era']
            })
        
        # Origin comparison
        points.append({
            'type': 'origin',
            'artifact1': artifact1['origin'],
            'artifact2': artifact2['origin']
        })
        
        return points

