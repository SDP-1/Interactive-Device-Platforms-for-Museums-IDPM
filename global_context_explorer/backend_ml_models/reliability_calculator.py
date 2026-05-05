"""
Reliability Score Calculator
Implements the Causal Confidence Metric (R) formula:
R = w_d * D + w_s * S + w_t * T
"""

import numpy as np
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
        Calculate T (Temporal Proximity) using a piecewise historical scale.

        This is designed for historical influence discovery where valid causal links
        can still occur hundreds of years apart. The score decays gently instead of
        collapsing to ~0 for ancient events.
        
        Args:
            temporal_gap_days: Time gap between events in days
        
        Returns:
            Temporal proximity value (T), between 0 and 1, with a small floor
        """
        temporal_gap_years = abs(float(temporal_gap_days)) / 365.25

        # Anchors reflect a sensible scale:
        # 0 years -> 1.00, <10 years -> above 0.90, 20 years -> 0.80,
        # 50 years -> 0.70, 100 years -> 0.55, 250 years -> 0.35,
        # 500 years -> 0.20, and a non-zero floor beyond that.
        anchors = [
            (0.0, 1.00),
            (10.0, 0.92),
            (20.0, 0.80),
            (50.0, 0.70),
            (100.0, 0.55),
            (250.0, 0.35),
            (500.0, 0.20),
            (1000.0, 0.10),
        ]

        if temporal_gap_years <= anchors[0][0]:
            return anchors[0][1]

        for (start_years, start_score), (end_years, end_score) in zip(anchors, anchors[1:]):
            if temporal_gap_years <= end_years:
                span = end_years - start_years
                if span <= 0:
                    return end_score
                ratio = (temporal_gap_years - start_years) / span
                temporal_proximity = start_score + ratio * (end_score - start_score)
                return max(0.10, min(1.0, float(temporal_proximity)))

        # Beyond the last anchor, keep a small but non-zero floor.
        return 0.10
    
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
        reliability_percent = R * 100
        
        return {
            'reliability_score': R,
            'reliability_percent': reliability_percent,
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

