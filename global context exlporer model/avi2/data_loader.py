"""
Data Loading and Preprocessing Module
Handles loading nodes and edges from CSV files and preparing them for GNN processing.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import torch
from torch_geometric.data import Data


class HistoricalDataLoader:
    """Loads and preprocesses historical event data for GNN processing."""
    
    def __init__(self, nodes_file: str, edges_file: str):
        """
        Initialize the data loader.
        
        Args:
            nodes_file: Path to CSV file containing node data
            edges_file: Path to CSV file containing edge data
        """
        self.nodes_file = nodes_file
        self.edges_file = edges_file
        self.nodes_df = None
        self.edges_df = None
        self.node_to_idx = {}
        self.idx_to_node = {}
        
    def load_data(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Load nodes and edges from CSV files."""
        # Read CSV with explicit dtype for source_references to avoid type inference issues
        # Use object dtype to prevent pandas from trying to convert strings
        dtype_dict = {
            'source_references': 'object',
            'causal_description': 'object',
            'description': 'object',
            'purpose': 'object',
            'location': 'object',
            'event_name': 'object',
            'exhibit_name': 'object'
        }
        self.nodes_df = pd.read_csv(self.nodes_file, dtype=dtype_dict)
        self.edges_df = pd.read_csv(self.edges_file, dtype=dtype_dict)
        
        # Parse dates - handle BC dates and errors gracefully
        try:
            self.nodes_df['date'] = pd.to_datetime(self.nodes_df['date'], errors='coerce')
        except:
            # If date parsing fails, try to handle BC dates or set default
            self.nodes_df['date'] = pd.to_datetime(self.nodes_df['date'], errors='coerce')
        
        # Create node index mapping
        unique_nodes = set(self.nodes_df['node_id'].unique()) | set(
            self.edges_df['source_node_id'].unique()
        ) | set(self.edges_df['target_node_id'].unique())
        
        for idx, node_id in enumerate(sorted(unique_nodes)):
            self.node_to_idx[node_id] = idx
            self.idx_to_node[idx] = node_id
        
        return self.nodes_df, self.edges_df
    
    def calculate_temporal_gap(self, source_date: datetime, target_date: datetime) -> float:
        """Calculate time gap in days between two events."""
        if pd.isna(source_date) or pd.isna(target_date):
            return 0.0
        delta = abs((target_date - source_date).days)
        return float(delta)
    
    def build_graph(self) -> Data:
        """
        Build a PyTorch Geometric Data object from the loaded data.
        
        Returns:
            Data object with node features, edge indices, and edge attributes
        """
        if self.nodes_df is None or self.edges_df is None:
            self.load_data()
        
        num_nodes = len(self.node_to_idx)
        
        # Create node features
        node_features = []
        node_types = []
        node_dates = []
        
        for node_id in sorted(self.node_to_idx.keys()):
            node_data = self.nodes_df[self.nodes_df['node_id'] == node_id]
            if len(node_data) == 0:
                # Global node not in nodes_df, create default features
                node_features.append([0.0] * 10)  # Default feature vector
                node_types.append(0)  # 0 = global
                node_dates.append(None)
            else:
                row = node_data.iloc[0]
                # Feature vector: [node_type_encoded, source_count, max_sources, ...]
                features = [
                    1.0 if row['node_type'] == 'local' else 0.0,  # Local indicator
                    float(row.get('source_count', 0)),
                    float(row.get('max_sources_required', 5)),
                    float(row.get('source_count', 0)) / max(float(row.get('max_sources_required', 5)), 1.0),  # Source ratio
                ]
                # Pad to 10 features
                while len(features) < 10:
                    features.append(0.0)
                node_features.append(features[:10])
                node_types.append(1 if row['node_type'] == 'local' else 0)
                node_dates.append(row['date'])
        
        # Create edge indices and attributes
        edge_indices = []
        edge_attrs = []
        edge_metadata = []
        
        for _, edge_row in self.edges_df.iterrows():
            source_idx = self.node_to_idx[edge_row['source_node_id']]
            target_idx = self.node_to_idx[edge_row['target_node_id']]
            
            # Get dates for temporal calculation
            source_date = None
            target_date = None
            
            source_node_data = self.nodes_df[self.nodes_df['node_id'] == edge_row['source_node_id']]
            target_node_data = self.nodes_df[self.nodes_df['node_id'] == edge_row['target_node_id']]
            
            if len(source_node_data) > 0:
                source_date = source_node_data.iloc[0]['date']
            if len(target_node_data) > 0:
                target_date = target_node_data.iloc[0]['date']
            
            # Calculate temporal gap
            temporal_gap = self.calculate_temporal_gap(source_date, target_date) if source_date and target_date else 0.0
            
            edge_indices.append([source_idx, target_idx])
            
            # Edge attributes: [directness, source_count, max_sources, temporal_gap]
            # Safely convert to float, handling any string values
            try:
                directness = float(edge_row.get('directness_score', 0.5))
            except (ValueError, TypeError):
                directness = 0.5
            
            try:
                source_count = float(edge_row.get('source_count', 0))
            except (ValueError, TypeError):
                source_count = 0.0
            
            try:
                max_sources = float(edge_row.get('max_sources_required', 5))
            except (ValueError, TypeError):
                max_sources = 5.0
            
            edge_attr = [
                directness,
                source_count,
                max_sources,
                temporal_gap,
            ]
            edge_attrs.append(edge_attr)
            
            # Store metadata
            edge_metadata.append({
                'edge_id': edge_row['edge_id'],
                'causal_description': edge_row.get('causal_description', ''),
                'source_node_id': edge_row['source_node_id'],
                'target_node_id': edge_row['target_node_id'],
            })
        
        # Convert to tensors
        node_features_tensor = torch.tensor(node_features, dtype=torch.float)
        edge_index = torch.tensor(edge_indices, dtype=torch.long).t().contiguous()
        edge_attr_tensor = torch.tensor(edge_attrs, dtype=torch.float)
        
        # Create PyTorch Geometric Data object
        data = Data(
            x=node_features_tensor,
            edge_index=edge_index,
            edge_attr=edge_attr_tensor,
        )
        
        # Store metadata as attributes
        data.node_to_idx = self.node_to_idx
        data.idx_to_node = self.idx_to_node
        data.node_types = node_types
        data.node_dates = node_dates
        data.edge_metadata = edge_metadata
        data.nodes_df = self.nodes_df
        data.edges_df = self.edges_df
        
        return data
    
    def get_node_info(self, node_id: str) -> Optional[Dict]:
        """Get information about a specific node."""
        if self.nodes_df is None:
            self.load_data()
        
        node_data = self.nodes_df[self.nodes_df['node_id'] == node_id]
        if len(node_data) == 0:
            return None
        
        row = node_data.iloc[0]
        return {
            'node_id': row['node_id'],
            'node_type': row['node_type'],
            'event_name': row['event_name'],
            'date': row['date'],
            'location': row.get('location', ''),
            'description': row.get('description', ''),
            'purpose': row.get('purpose', ''),
            'exhibit_name': row.get('exhibit_name', ''),
        }

