"""
Graph Neural Network Model for Causal Link Discovery
Uses GCN (Graph Convolutional Network) to learn node embeddings and discover causal paths.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, global_mean_pool
from torch_geometric.data import Data
from typing import List, Tuple, Dict, Optional
import numpy as np


class CausalGNN(nn.Module):
    """Graph Neural Network for discovering causal links between global and local events."""
    
    def __init__(
        self,
        input_dim: int = 10,
        hidden_dim: int = 64,
        output_dim: int = 32,
        num_layers: int = 3,
        dropout: float = 0.2
    ):
        """
        Initialize the GNN model.
        
        Args:
            input_dim: Dimension of input node features
            hidden_dim: Dimension of hidden layers
            output_dim: Dimension of output node embeddings
            num_layers: Number of GCN layers
            dropout: Dropout rate
        """
        super(CausalGNN, self).__init__()
        
        self.num_layers = num_layers
        self.dropout = dropout
        
        # GCN layers
        self.convs = nn.ModuleList()
        self.convs.append(GCNConv(input_dim, hidden_dim))
        
        for _ in range(num_layers - 2):
            self.convs.append(GCNConv(hidden_dim, hidden_dim))
        
        self.convs.append(GCNConv(hidden_dim, output_dim))
        
        # Batch normalization layers
        self.batch_norms = nn.ModuleList()
        for _ in range(num_layers):
            self.batch_norms.append(nn.BatchNorm1d(hidden_dim if _ < num_layers - 1 else output_dim))
        
    def forward(self, x: torch.Tensor, edge_index: torch.Tensor, edge_attr: Optional[torch.Tensor] = None) -> torch.Tensor:
        """
        Forward pass through the GNN.
        
        Args:
            x: Node feature matrix [num_nodes, input_dim]
            edge_index: Graph connectivity [2, num_edges]
            edge_attr: Edge attributes (optional)
        
        Returns:
            Node embeddings [num_nodes, output_dim]
        """
        # Apply GCN layers with residual connections
        for i, (conv, bn) in enumerate(zip(self.convs, self.batch_norms)):
            x_new = conv(x, edge_index)
            x_new = bn(x_new)
            
            if i < len(self.convs) - 1:
                x_new = F.relu(x_new)
                x_new = F.dropout(x_new, p=self.dropout, training=self.training)
            
            # Residual connection (if dimensions match)
            if i > 0 and x.shape[1] == x_new.shape[1]:
                x = x + x_new
            else:
                x = x_new
        
        return x
    
    def get_path_embeddings(self, data: Data, path: List[int]) -> torch.Tensor:
        """
        Get embeddings for a specific path through the graph.
        
        Args:
            data: Graph data object
            path: List of node indices representing the path
        
        Returns:
            Aggregated embedding for the path
        """
        embeddings = self.forward(data.x, data.edge_index, data.edge_attr)
        path_embeddings = embeddings[path]
        
        # Mean pooling over path nodes
        return torch.mean(path_embeddings, dim=0)


class PathFinder:
    """Finds causal paths between global and local events using graph traversal."""
    
    def __init__(self, data: Data, model: Optional[CausalGNN] = None):
        """
        Initialize the path finder.
        
        Args:
            data: Graph data object
            model: Trained GNN model (optional, for embedding-based search)
        """
        self.data = data
        self.model = model
        self.num_nodes = data.x.shape[0]
        
        # Build adjacency list for efficient traversal
        self.adj_list = self._build_adjacency_list()
    
    def _build_adjacency_list(self) -> Dict[int, List[int]]:
        """Build adjacency list from edge_index."""
        adj_list = {i: [] for i in range(self.num_nodes)}
        
        edge_index = self.data.edge_index.cpu().numpy()
        for i in range(edge_index.shape[1]):
            source = int(edge_index[0, i])
            target = int(edge_index[1, i])
            adj_list[source].append(target)
        
        return adj_list
    
    def find_paths(
        self,
        source_node_id: str,
        target_node_id: str,
        max_depth: int = 3,
        max_paths: int = 10
    ) -> List[Dict]:
        """
        Find all paths from source to target node.
        
        Args:
            source_node_id: ID of source (global) node
            target_node_id: ID of target (local) node
            max_depth: Maximum path length
            max_paths: Maximum number of paths to return
        
        Returns:
            List of path dictionaries with node IDs and metadata
        """
        if source_node_id not in self.data.node_to_idx:
            return []
        if target_node_id not in self.data.node_to_idx:
            return []
        
        source_idx = self.data.node_to_idx[source_node_id]
        target_idx = self.data.node_to_idx[target_node_id]
        
        # BFS to find all paths
        paths = []
        queue = [(source_idx, [source_idx])]
        visited_paths = set()
        
        while queue and len(paths) < max_paths:
            current_idx, path = queue.pop(0)
            
            if current_idx == target_idx and len(path) > 1:
                # Found a path
                path_node_ids = [self.data.idx_to_node[idx] for idx in path]
                paths.append({
                    'path': path,
                    'path_node_ids': path_node_ids,
                    'length': len(path) - 1
                })
                continue
            
            if len(path) >= max_depth + 1:
                continue
            
            # Explore neighbors
            for neighbor_idx in self.adj_list.get(current_idx, []):
                if neighbor_idx not in path:  # Avoid cycles
                    new_path = path + [neighbor_idx]
                    path_tuple = tuple(new_path)
                    
                    if path_tuple not in visited_paths:
                        visited_paths.add(path_tuple)
                        queue.append((neighbor_idx, new_path))
        
        return paths
    
    def get_edge_info(self, source_idx: int, target_idx: int) -> Optional[Dict]:
        """Get edge information between two nodes."""
        edge_index = self.data.edge_index.cpu().numpy()
        
        for i in range(edge_index.shape[1]):
            if int(edge_index[0, i]) == source_idx and int(edge_index[1, i]) == target_idx:
                # Found the edge
                if hasattr(self.data, 'edge_metadata') and i < len(self.data.edge_metadata):
                    edge_info = self.data.edge_metadata[i].copy()
                    
                    # Add edge attributes
                    if hasattr(self.data, 'edge_attr') and i < self.data.edge_attr.shape[0]:
                        edge_attr = self.data.edge_attr[i].cpu().numpy()
                        edge_info['directness_score'] = float(edge_attr[0])
                        edge_info['source_count'] = int(edge_attr[1])
                        edge_info['max_sources_required'] = int(edge_attr[2])
                        edge_info['temporal_gap_days'] = float(edge_attr[3])
                    
                    return edge_info
        
        return None

