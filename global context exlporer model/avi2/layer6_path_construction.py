"""
Layer 6: Explanation Path Construction
Finds best explanatory paths in the graph.
"""

from typing import Dict, List, Optional
from collections import deque


class PathConstructor:
    """Constructs explanation paths for causal links."""
    
    def __init__(self):
        pass
    
    def construct_paths(
        self,
        prediction: Dict,
        graph: Dict,
        max_paths: int = 3
    ) -> List[Dict]:
        """
        Construct explanation paths for a prediction.
        
        Args:
            prediction: Scored prediction from Layer 5
            graph: Graph structure
            max_paths: Maximum number of paths to return
        
        Returns:
            List of explanation paths
        """
        global_id = prediction['global_event_id']
        local_id = prediction['local_event_id']
        
        # Find all paths from global to local
        all_paths = self._find_all_paths(graph, global_id, local_id, max_depth=4)
        
        # Score and rank paths
        scored_paths = []
        for path in all_paths[:max_paths * 2]:  # Get more candidates
            score = self._score_path(path, graph, prediction)
            scored_paths.append({
                'path': path,
                'score': score,
                'length': len(path) - 1,
                'explanation': self._generate_explanation(path, graph)
            })
        
        # Sort by score
        scored_paths.sort(key=lambda x: x['score'], reverse=True)
        
        return scored_paths[:max_paths]
    
    def _find_all_paths(
        self,
        graph: Dict,
        source_id: str,
        target_id: str,
        max_depth: int = 4
    ) -> List[List[str]]:
        """Find all paths from source to target using BFS."""
        if source_id not in graph['node_to_idx'] or target_id not in graph['node_to_idx']:
            return []
        
        paths = []
        queue = deque([(source_id, [source_id])])
        visited_paths = set()
        
        while queue:
            current_id, path = queue.popleft()
            
            if current_id == target_id and len(path) > 1:
                paths.append(path)
                continue
            
            if len(path) >= max_depth + 1:
                continue
            
            # Get neighbors
            neighbors = self._get_neighbors(graph, current_id)
            
            for neighbor_id in neighbors:
                if neighbor_id not in path:  # Avoid cycles
                    new_path = path + [neighbor_id]
                    path_key = tuple(new_path)
                    
                    if path_key not in visited_paths:
                        visited_paths.add(path_key)
                        queue.append((neighbor_id, new_path))
        
        return paths
    
    def _get_neighbors(self, graph: Dict, node_id: str) -> List[str]:
        """Get neighbor nodes of a given node."""
        neighbors = []
        
        # Find edges where this node is source
        for edge in graph['edges']:
            if edge['source'] == node_id:
                neighbors.append(edge['target'])
        
        return neighbors
    
    def _score_path(
        self,
        path: List[str],
        graph: Dict,
        prediction: Dict
    ) -> float:
        """Score a path based on edge weights and GNN attention."""
        if len(path) < 2:
            return 0.0
        
        # Calculate path score from edge weights
        edge_scores = []
        for i in range(len(path) - 1):
            source = path[i]
            target = path[i + 1]
            
            # Find edge
            edge = next(
                (e for e in graph['edges'] 
                 if e['source'] == source and e['target'] == target),
                None
            )
            
            if edge:
                edge_scores.append(edge.get('weight', 0.5))
            else:
                edge_scores.append(0.3)  # Default for missing edges
        
        # Average edge score
        avg_edge_score = sum(edge_scores) / len(edge_scores) if edge_scores else 0.0
        
        # Prefer shorter paths
        length_penalty = 1.0 / len(path)
        
        # Combine with prediction score
        prediction_score = prediction.get('final_score', 0.5)
        
        final_score = (
            0.4 * avg_edge_score +
            0.3 * length_penalty +
            0.3 * prediction_score
        )
        
        return final_score
    
    def _generate_explanation(
        self,
        path: List[str],
        graph: Dict
    ) -> str:
        """Generate human-readable explanation for a path."""
        if len(path) < 2:
            return "Direct connection"
        
        explanation_parts = []
        
        for i in range(len(path) - 1):
            source_id = path[i]
            target_id = path[i + 1]
            
            source_node = next((n for n in graph['nodes'] if n['id'] == source_id), None)
            target_node = next((n for n in graph['nodes'] if n['id'] == target_id), None)
            
            if source_node and target_node:
                # Get source name
                source_name = source_node['data'].get('event_name') or source_node['data'].get('name', source_id)
                
                # Get target name - handle intermediate nodes specially
                if target_node['type'] == 'intermediate':
                    target_name = target_node['data'].get('name', target_id)
                    inter_type = target_node['data'].get('type', 'entity')
                else:
                    target_name = target_node['data'].get('event_name', target_id)
                    inter_type = None
                
                # Get edge description
                edge = next(
                    (e for e in graph['edges'] 
                     if e['source'] == source_id and e['target'] == target_id),
                    None
                )
                
                if edge and edge.get('type') == 'causal_candidate':
                    explanation_parts.append(
                        f"{source_name} directly influenced {target_name}"
                    )
                elif target_node['type'] == 'intermediate':
                    explanation_parts.append(
                        f"{source_name} affected {target_name} ({inter_type})"
                    )
                else:
                    explanation_parts.append(
                        f"{source_name} -> {target_name}"
                    )
        
        # Format final explanation
        if not explanation_parts:
            return "Path found"
        
        # For direct connections, use arrow format
        if len(explanation_parts) == 1:
            return explanation_parts[0]
        
        # For multi-hop paths, use arrow format
        return " -> ".join(explanation_parts)

