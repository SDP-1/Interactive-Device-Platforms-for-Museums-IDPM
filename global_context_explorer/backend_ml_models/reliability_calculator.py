"""
Reliability Score Calculator
Implements the Causal Confidence Metric (R) formula:
R = w_d * D + w_s * S + w_t * T
"""

import numpy as np
import torch
from typing import Dict, Optional


class ReliabilityCalculator:
    """Calculates reliability scores for causal links using the specified formula."""
    
    def __init__(self, w_d: float = 0.4, w_s: float = 0.3, w_t: float = 0.3):
        """
        Initialize the reliability calculator with weights.
        
        Args:
            w_d: Weight for Directness of Link (default: 0.4)
            w_s: Weight for Source Consistency (default: 0.3)
            w_t: Weight for Temporal Proximity (default: 0.3)
        """
        self.w_d = w_d
        self.w_s = w_s
        self.w_t = w_t
        
        # Normalize weights to sum to 1
        total_weight = w_d + w_s + w_t
        if total_weight > 0:
            self.w_d /= total_weight
            self.w_s /= total_weight
            self.w_t /= total_weight
    
    def calculate_directness(self, directness_score: float) -> float:
        """
        Calculate D (Directness of Link).
        
        Args:
            directness_score: Binary or decimal value (1.0 for direct, 0.5 for parallel, etc.)
        
        Returns:
            Directness value (D)
        """
        # Clamp between 0 and 1
        return max(0.0, min(1.0, float(directness_score)))
    
    def calculate_source_consistency(self, actual_sources: int, max_sources: int) -> float:
        """
        Calculate S (Source Consistency).
        
        Formula: S = Actual Sources / Max Required Sources
        
        Args:
            actual_sources: Number of independent sources that agree
            max_sources: Maximum required sources
        
        Returns:
            Source consistency value (S), clamped between 0 and 1
        """
        if max_sources <= 0:
            return 0.0
        
        consistency = float(actual_sources) / float(max_sources)
        return max(0.0, min(1.0, consistency))
    
    def calculate_temporal_proximity(self, temporal_gap_days: float) -> float:
        """
        Calculate T (Temporal Proximity) using exponential decay.
        
        Formula: T = e^(-Δt), where Δt is the time gap in years
        
        Args:
            temporal_gap_days: Time gap between events in days
        
        Returns:
            Temporal proximity value (T), between 0 and 1
        """
        # Convert days to years for better scaling
        temporal_gap_years = temporal_gap_days / 365.25
        
        # Exponential decay: e^(-Δt)
        # For very large gaps, this approaches 0
        # For gap = 0, this equals 1
        temporal_proximity = np.exp(-temporal_gap_years)
        
        return max(0.0, min(1.0, float(temporal_proximity)))
    
    def calculate_reliability(
        self,
        directness_score: float,
        actual_sources: int,
        max_sources: int,
        temporal_gap_days: float
    ) -> Dict[str, float]:
        """
        Calculate the complete Reliability Score (R).
        
        Args:
            directness_score: Directness of link (0.0 to 1.0)
            actual_sources: Number of sources that agree
            max_sources: Maximum required sources
            temporal_gap_days: Time gap in days
        
        Returns:
            Dictionary with all components and final reliability score
        """
        D = self.calculate_directness(directness_score)
        S = self.calculate_source_consistency(actual_sources, max_sources)
        T = self.calculate_temporal_proximity(temporal_gap_days)
        
        # Calculate final reliability score
        R = (self.w_d * D) + (self.w_s * S) + (self.w_t * T)
        
        # Convert to 0-100 scale for display
        R_percent = R * 100
        
        return {
            'reliability_score': R,
            'reliability_percent': R_percent,
            'directness': D,
            'source_consistency': S,
            'temporal_proximity': T,
            'components': {
                'w_d * D': self.w_d * D,
                'w_s * S': self.w_s * S,
                'w_t * T': self.w_t * T,
            }
        }
    
    def calculate_reliability_from_edge_data(self, edge_data: Dict) -> Dict[str, float]:
        """
        Calculate reliability from edge data dictionary.
        
        Args:
            edge_data: Dictionary containing edge information with keys:
                - directness_score
                - source_count (or actual_sources)
                - max_sources_required (or max_sources)
                - temporal_gap_days
        
        Returns:
            Dictionary with reliability score and components
        """
        directness = edge_data.get('directness_score', 0.5)
        actual_sources = edge_data.get('source_count', edge_data.get('actual_sources', 0))
        max_sources = edge_data.get('max_sources_required', edge_data.get('max_sources', 5))
        temporal_gap = edge_data.get('temporal_gap_days', 0.0)
        
        return self.calculate_reliability(
            directness_score=directness,
            actual_sources=actual_sources,
            max_sources=max_sources,
            temporal_gap_days=temporal_gap
        )

