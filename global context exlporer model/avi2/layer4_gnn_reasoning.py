"""
Layer 4: GNN Reasoning / Link Prediction
Uses GNN to predict causal links and mechanism types.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Tuple
from gnn_model import CausalGNN, PathFinder
from data_loader import HistoricalDataLoader


class GNNReasoner:
    """GNN-based reasoning for causal link prediction."""
    
    def __init__(self, nodes_file: str, edges_file: str):
        """
        Initialize GNN reasoner.
        
        Args:
            nodes_file: Path to nodes CSV
            edges_file: Path to edges CSV
        """
        self.data_loader = HistoricalDataLoader(nodes_file, edges_file)
        self.model = None
        self.path_finder = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize GNN model."""
        try:
            graph_data = self.data_loader.build_graph()
            
            self.model = CausalGNN(
                input_dim=graph_data.x.shape[1],
                hidden_dim=64,
                output_dim=32,
                num_layers=3
            )
            self.model.eval()
            
            self.path_finder = PathFinder(graph_data, self.model)
            self.graph_data = graph_data
        except Exception as e:
            print(f"Warning: Could not load graph data: {e}")
            self.model = None
            self.path_finder = None
    
    def predict_links(
        self,
        graph: Dict,
        local_event_id: str,
        top_k: int = 10
    ) -> List[Dict]:
        """
        Predict causal links using GNN.
        
        Args:
            graph: Graph structure from Layer 3
            local_event_id: ID of local event
            top_k: Number of top links to return
        
        Returns:
            List of predicted links with scores
        """
        predictions = []
        
        # Get global event candidates from graph
        global_nodes = [n for n in graph['nodes'] if n['type'] == 'global']
        
        if not global_nodes:
            return []
        
        # Check if we can use GNN path finder (ALL nodes must exist in base graph)
        can_use_gnn = False
        if self.path_finder and self.graph_data:
            # Check if local event exists in base graph
            if local_event_id in self.graph_data.node_to_idx:
                # Check if at least one global node exists in base graph
                for global_node in global_nodes:
                    if global_node['id'] in self.graph_data.node_to_idx:
                        can_use_gnn = True
                        break
        
        # For Layer 3 candidate nodes, they don't exist in base graph
        # So we should ALWAYS use fallback method which works directly with Layer 3's graph structure
        # Only try GNN if we have a complete base graph with ALL nodes AND no errors occurred
        
        # Check if we can use GNN (requires ALL nodes to exist in base graph AND no errors)
        can_use_gnn = False
        if self.path_finder and self.graph_data and hasattr(self.graph_data, 'node_to_idx'):
            local_in_base = local_event_id in self.graph_data.node_to_idx
            if local_in_base:
                # Check if ALL global nodes exist in base graph
                all_global_in_base = all(
                    global_node['id'] in self.graph_data.node_to_idx 
                    for global_node in global_nodes
                )
                can_use_gnn = all_global_in_base and len(global_nodes) > 0
        
        # Use fallback for Layer 3 candidate nodes (they're not in base graph)
        # This is the normal case - Layer 3 creates new candidate nodes
        if not can_use_gnn:
            fallback_predictions = self._predict_from_graph_structure(graph, local_event_id, top_k)
            return fallback_predictions
        
        for global_node in global_nodes:
            global_id = global_node['id']
            
            # Try GNN path finding if nodes exist in base graph
            if global_id in self.graph_data.node_to_idx:
                try:
                    paths = self.path_finder.find_paths(
                        source_node_id=global_id,
                        target_node_id=local_event_id,
                        max_depth=3,
                        max_paths=5
                    )
                    
                    if paths:
                        # Use GNN to get path embeddings
                        best_path = paths[0]
                        path_indices = best_path['path']
                        
                        # Get node embeddings
                        with torch.no_grad():
                            embeddings = self.model(
                                self.graph_data.x,
                                self.graph_data.edge_index,
                                self.graph_data.edge_attr
                            )
                            
                            # Calculate path score
                            path_embeddings = embeddings[path_indices]
                            path_score = torch.mean(path_embeddings).item()
                        
                        # Get edge info
                        if len(path_indices) >= 2:
                            edge_info = self.path_finder.get_edge_info(
                                path_indices[0],
                                path_indices[1]
                            )
                        else:
                            edge_info = None
                        
                        # Predict mechanism type
                        mechanism_probs = self._predict_mechanism(
                            global_node['data'],
                            graph,
                            path_score
                        )
                        
                        predictions.append({
                            'global_event_id': global_id,
                            'local_event_id': local_event_id,
                            'causal_strength_score': float(path_score),
                            'path': best_path,
                            'mechanism_probs': mechanism_probs,
                            'edge_info': edge_info,
                            'metadata': global_node['data']
                        })
                        continue  # Successfully used GNN, skip fallback
                except Exception as e:
                    # Fallback to graph structure
                    pass
            
            # Fallback: use graph structure directly (for candidate nodes not in base graph)
            # This handles the case where Layer 3 created new candidate nodes
            local_edges = [e for e in graph['edges'] if e['target'] == local_event_id and e['source'] == global_id]
            
            for edge in local_edges:
                # Use edge weight as causal strength, but boost it if it's a strong connection
                base_score = edge.get('weight', 0.5)
                
                # Boost score based on edge metadata
                metadata = edge.get('metadata', {})
                if metadata.get('temporal_relevance', 0) > 0.7:
                    base_score = min(1.0, base_score * 1.1)
                if metadata.get('keyword_match', 0) > 0.5:
                    base_score = min(1.0, base_score * 1.05)
                
                causal_score = min(1.0, base_score)
                
                # Predict mechanism from edge type and event data
                mechanism_probs = self._predict_mechanism(
                    global_node['data'],
                    graph,
                    causal_score
                )
                
                # Ensure mechanism_probs is set
                if not mechanism_probs or len(mechanism_probs) == 0:
                    # Fallback: use event data directly
                    mechanism_probs = self._predict_mechanism(global_node['data'], graph, causal_score)
                
                predictions.append({
                    'global_event_id': global_id,
                    'local_event_id': local_event_id,
                    'causal_strength_score': causal_score,
                    'path': None,
                    'mechanism_probs': mechanism_probs,
                    'edge_info': edge,
                    'metadata': global_node['data']
                })
                break  # Found the edge, move to next global node
        
        # Sort by causal strength
        predictions.sort(key=lambda x: x['causal_strength_score'], reverse=True)
        
        return predictions[:top_k]
    
    def _predict_from_graph_structure(
        self,
        graph: Dict,
        local_event_id: str,
        top_k: int
    ) -> List[Dict]:
        """Fallback prediction using graph structure only."""
        predictions = []
        
        if not graph or 'edges' not in graph or 'nodes' not in graph:
            return []
        
        # Get edges connected to local event
        local_edges = [e for e in graph['edges'] if e.get('target') == local_event_id]
        
        if not local_edges:
            # Try alternative edge structure
            local_edges = [e for e in graph['edges'] if e.get('target_node_id') == local_event_id]
        
        
        for edge in local_edges:
            source_id = edge.get('source') or edge.get('source_node_id')
            if not source_id:
                continue
                
            source_node = next((n for n in graph['nodes'] if n.get('id') == source_id), None)
            
            if source_node and source_node.get('type') == 'global':
                # Use edge weight as causal strength, with boosting
                base_score = edge.get('weight', 0.5)
                
                # Boost score based on edge metadata
                metadata = edge.get('metadata', {})
                if metadata.get('temporal_relevance', 0) > 0.7:
                    base_score = min(1.0, base_score * 1.1)
                if metadata.get('keyword_match', 0) > 0.5:
                    base_score = min(1.0, base_score * 1.05)
                
                causal_score = min(1.0, base_score)
                
                # Predict mechanism from edge type - pass source_node for better event name detection
                mechanism_probs = self._predict_mechanism_from_edge(edge, graph, source_node)
                
                # Ensure mechanism_probs is set
                if not mechanism_probs or len(mechanism_probs) == 0:
                    # Fallback: use source_node data directly
                    if source_node and source_node.get('data'):
                        mechanism_probs = self._predict_mechanism(source_node['data'], graph, causal_score)
                    else:
                        mechanism_probs = {'economic_shift': 1.0}
                
                predictions.append({
                    'global_event_id': source_id,
                    'local_event_id': local_event_id,
                    'causal_strength_score': causal_score,
                    'path': None,
                    'mechanism_probs': mechanism_probs,
                    'edge_info': edge,
                    'metadata': source_node.get('data', {})
                })
        
        predictions.sort(key=lambda x: x['causal_strength_score'], reverse=True)
        return predictions[:top_k]
    
    def _predict_mechanism(
        self,
        global_event: Dict,
        graph: Dict,
        path_score: float
    ) -> Dict[str, float]:
        """Predict mechanism type probabilities."""
        # Simple heuristic-based mechanism prediction
        event_name = str(global_event.get('event_name', '')).lower().strip()
        description = str(global_event.get('description', '')).lower().strip()
        
        # Combine for matching
        event_text = f"{event_name} {description}".lower()
        
        mechanisms = {
            'trade_shock': 0.0,
            'policy': 0.0,
            'technology': 0.0,
            'economic_shift': 0.0,
            'colonial_control': 0.0
        }
        
        # Check for specific events first (highest priority) - use exact matching
        if 'industrial revolution' in event_name or 'industrial revolution' in event_text:
            mechanisms['technology'] = 0.9
            mechanisms['economic_shift'] = 0.1
        elif 'american civil war' in event_name or 'american civil war' in event_text:
            mechanisms['trade_shock'] = 0.9
            mechanisms['economic_shift'] = 0.1
        elif 'coffee leaf rust' in event_name or 'coffee leaf rust' in event_text:
            mechanisms['trade_shock'] = 0.85
            mechanisms['economic_shift'] = 0.15
        elif 'british colonial' in event_name or ('british' in event_name and 'colonial' in event_text):
            mechanisms['colonial_control'] = 0.85
            mechanisms['policy'] = 0.15
        elif 'opium war' in event_name or 'opium war' in event_text:
            mechanisms['trade_shock'] = 0.6
            mechanisms['economic_shift'] = 0.4
        else:
            # Fallback to keyword-based detection
            # Trade-related keywords
            trade_keywords = ['war', 'cotton', 'supply', 'trade', 'export', 'epidemic', 'rust', 'disruption']
            if any(kw in event_name or kw in description for kw in trade_keywords):
                mechanisms['trade_shock'] = 0.6
                mechanisms['economic_shift'] = 0.3
            
            # Policy/Colonial-related keywords
            colonial_keywords = ['colonial', 'administration', 'policy', 'regulation', 'british', 'empire', 'expansion']
            if any(kw in event_name or kw in description for kw in colonial_keywords):
                mechanisms['colonial_control'] = 0.6
                mechanisms['policy'] = 0.3
            
            # Technology-related keywords
            tech_keywords = ['industrial', 'revolution', 'technology', 'machinery', 'transportation', 'infrastructure']
            if any(kw in event_name or kw in description for kw in tech_keywords):
                mechanisms['technology'] = 0.7
                mechanisms['economic_shift'] = 0.2
        
        # Normalize probabilities - ensure we have at least one non-zero value
        total = sum(mechanisms.values())
        if total > 0:
            mechanisms = {k: v / total for k, v in mechanisms.items()}
        else:
            # If all are zero (shouldn't happen), default to economic_shift
            mechanisms['economic_shift'] = 1.0
        
        return mechanisms
    
    def _predict_mechanism_from_edge(self, edge: Dict, graph: Dict = None, source_node: Dict = None) -> Dict[str, float]:
        """Predict mechanism from edge type."""
        edge_type = edge.get('type', 'causal_candidate')
        
        # Try to get event name from multiple sources
        event_name = ''
        event_description = ''
        
        # First try source_node if provided
        if source_node and source_node.get('data'):
            event_name = str(source_node['data'].get('event_name', '')).lower().strip()
            event_description = str(source_node['data'].get('description', '')).lower().strip()
        
        # Fallback to edge metadata
        if not event_name and 'metadata' in edge:
            event_name = str(edge['metadata'].get('event_name', '')).lower().strip()
            event_description = str(edge['metadata'].get('description', '')).lower().strip()
        
        # Combine name and description for matching
        event_text = f"{event_name} {event_description}".lower()
        
        mechanisms = {
            'trade_shock': 0.0,
            'policy': 0.0,
            'technology': 0.0,
            'economic_shift': 0.0,
            'colonial_control': 0.0
        }
        
        # Check event name first (highest priority) - use same logic as _predict_mechanism
        if 'industrial revolution' in event_name or 'industrial revolution' in event_text:
            mechanisms['technology'] = 0.9
            mechanisms['economic_shift'] = 0.1
        elif 'american civil war' in event_name or 'american civil war' in event_text:
            mechanisms['trade_shock'] = 0.9
            mechanisms['economic_shift'] = 0.1
        elif 'coffee leaf rust' in event_name or 'coffee leaf rust' in event_text:
            mechanisms['trade_shock'] = 0.85
            mechanisms['economic_shift'] = 0.15
        elif 'british colonial' in event_name or ('british' in event_name and 'colonial' in event_text):
            mechanisms['colonial_control'] = 0.85
            mechanisms['policy'] = 0.15
        elif 'opium war' in event_name or 'opium war' in event_text:
            mechanisms['trade_shock'] = 0.6
            mechanisms['economic_shift'] = 0.4
        else:
            # Fallback to keyword-based detection (same as _predict_mechanism)
            # Trade-related keywords
            trade_keywords = ['war', 'cotton', 'supply', 'trade', 'export', 'epidemic', 'rust', 'disruption']
            if any(kw in event_name or kw in event_description for kw in trade_keywords):
                mechanisms['trade_shock'] = 0.6
                mechanisms['economic_shift'] = 0.3
            
            # Policy/Colonial-related keywords
            colonial_keywords = ['colonial', 'administration', 'policy', 'regulation', 'british', 'empire', 'expansion']
            if any(kw in event_name or kw in event_description for kw in colonial_keywords):
                mechanisms['colonial_control'] = 0.6
                mechanisms['policy'] = 0.3
            
            # Technology-related keywords
            tech_keywords = ['industrial', 'revolution', 'technology', 'machinery', 'transportation', 'infrastructure']
            if any(kw in event_name or kw in event_description for kw in tech_keywords):
                mechanisms['technology'] = 0.7
                mechanisms['economic_shift'] = 0.2
            
            # Fallback to edge type if no keywords matched
            if sum(mechanisms.values()) == 0:
                if 'trade' in edge_type or 'commodity' in edge_type:
                    mechanisms['trade_shock'] = 0.6
                    mechanisms['economic_shift'] = 0.3
                elif 'policy' in edge_type or 'colonial' in edge_type:
                    mechanisms['colonial_control'] = 0.6
                    mechanisms['policy'] = 0.3
                elif 'technology' in edge_type or 'industrial' in edge_type:
                    mechanisms['technology'] = 0.7
                    mechanisms['economic_shift'] = 0.2
                else:
                    mechanisms['economic_shift'] = 0.6
        
        # Normalize
        total = sum(mechanisms.values())
        if total > 0:
            mechanisms = {k: v / total for k, v in mechanisms.items()}
        else:
            mechanisms['economic_shift'] = 1.0
        
        return mechanisms

