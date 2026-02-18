"""
Explanation Cache Manager
Provides persistent caching for AI-generated artifact explanations
"""

import json
import os
from datetime import datetime
from typing import Optional


class ExplanationCache:
    """Manages persistent storage of artifact explanations"""
    
    def __init__(self, cache_file='explanation_cache.json'):
        """
        Initialize the cache manager
        
        Args:
            cache_file: Path to the JSON file storing cached explanations
        """
        self.cache_file = cache_file
        self.cache = self._load_cache()
    
    def _load_cache(self) -> dict:
        """Load cache from disk or create new cache"""
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠ Could not load cache file: {e}")
                return {}
        return {}
    
    def _save_cache(self):
        """Save cache to disk"""
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.cache, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"⚠ Could not save cache file: {e}")
    
    def get(self, artifact_id: str) -> Optional[str]:
        """
        Retrieve cached explanation for an artifact
        
        Args:
            artifact_id: Unique identifier of the artifact
            
        Returns:
            Cached explanation string if found, None otherwise
        """
        entry = self.cache.get(artifact_id)
        if entry:
            return entry.get('explanation')
        return None
    
    def set(self, artifact_id: str, explanation: str):
        """
        Store explanation in cache
        
        Args:
            artifact_id: Unique identifier of the artifact
            explanation: Generated explanation text to cache
        """
        self.cache[artifact_id] = {
            'explanation': explanation,
            'timestamp': datetime.now().isoformat(),
            'length': len(explanation)
        }
        self._save_cache()
    
    def has(self, artifact_id: str) -> bool:
        """
        Check if explanation exists in cache
        
        Args:
            artifact_id: Unique identifier of the artifact
            
        Returns:
            True if explanation is cached, False otherwise
        """
        return artifact_id in self.cache
    
    def clear(self, artifact_id: Optional[str] = None):
        """
        Clear cache entries
        
        Args:
            artifact_id: If provided, clear only this artifact's cache.
                        If None, clear entire cache.
        """
        if artifact_id:
            if artifact_id in self.cache:
                del self.cache[artifact_id]
                self._save_cache()
        else:
            self.cache = {}
            self._save_cache()
    
    def stats(self) -> dict:
        """
        Get cache statistics
        
        Returns:
            Dictionary with cache statistics
        """
        total_explanations = len(self.cache)
        total_chars = sum(entry.get('length', 0) for entry in self.cache.values())
        
        return {
            'total_cached': total_explanations,
            'total_characters': total_chars,
            'cache_file': self.cache_file,
            'file_exists': os.path.exists(self.cache_file)
        }
