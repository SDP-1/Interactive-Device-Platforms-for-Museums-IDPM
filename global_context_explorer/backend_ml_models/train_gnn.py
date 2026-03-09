"""
Train a GNN for causal link prediction using your local CSV data.

This script trains CausalGNN embeddings + a small link predictor head on:
  - Positive edges from edges CSV (source_node_id -> target_node_id)
  - Negative edges sampled from non-existing (GLOBAL_* -> LOC_*) pairs

It saves weights to:
  models/causal_gnn.pt

Layer 4 (layer4_gnn_reasoning.py) will automatically load these weights if present.
"""

import argparse
from pathlib import Path
from typing import List, Tuple, Set, Dict

import numpy as np
import torch
import torch.nn as nn
from torch.optim import Adam

from data_loader import HistoricalDataLoader
from gnn_model import CausalGNN


class LinkPredictor(nn.Module):
    """Simple MLP link predictor over concatenated node embeddings."""

    def __init__(self, emb_dim: int, hidden_dim: int = 64, dropout: float = 0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(emb_dim * 2, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, 1),
        )

    def forward(self, src_emb: torch.Tensor, dst_emb: torch.Tensor) -> torch.Tensor:
        x = torch.cat([src_emb, dst_emb], dim=-1)
        return self.net(x).squeeze(-1)


def _build_edge_pairs(
    loader: HistoricalDataLoader,
    negative_multiplier: int = 3,
    seed: int = 42,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Returns:
      edge_index_pairs: shape [N, 2] with integer node indices (src_idx, dst_idx)
      labels: shape [N] with 1 for positive, 0 for negative
    """
    if loader.nodes_df is None or loader.edges_df is None:
        loader.load_data()

    node_to_idx = loader.node_to_idx
    nodes_df = loader.nodes_df
    edges_df = loader.edges_df

    # positives from edges_df
    pos_pairs: List[Tuple[int, int]] = []
    pos_set: Set[Tuple[int, int]] = set()

    for _, row in edges_df.iterrows():
        s = row["source_node_id"]
        t = row["target_node_id"]
        if s in node_to_idx and t in node_to_idx:
            pair = (node_to_idx[s], node_to_idx[t])
            pos_pairs.append(pair)
            pos_set.add(pair)

    # candidate negative space: GLOBAL_* -> LOC_* pairs (common for this project)
    global_ids = [nid for nid in node_to_idx.keys() if str(nid).startswith("GLOBAL_")]
    local_ids = [nid for nid in node_to_idx.keys() if str(nid).startswith("LOC_")]

    # Fallback: if naming not followed, use all node IDs
    if not global_ids:
        global_ids = list(node_to_idx.keys())
    if not local_ids:
        local_ids = list(node_to_idx.keys())

    rng = np.random.default_rng(seed)
    num_negs = max(len(pos_pairs) * negative_multiplier, 1)

    neg_pairs: List[Tuple[int, int]] = []
    tries = 0
    max_tries = num_negs * 50

    while len(neg_pairs) < num_negs and tries < max_tries:
        tries += 1
        s = rng.choice(global_ids)
        t = rng.choice(local_ids)
        pair = (node_to_idx[s], node_to_idx[t])
        if pair in pos_set:
            continue
        # avoid duplicates
        if pair in neg_pairs:
            continue
        neg_pairs.append(pair)

    all_pairs = np.array(pos_pairs + neg_pairs, dtype=np.int64)
    labels = np.array([1] * len(pos_pairs) + [0] * len(neg_pairs), dtype=np.int64)

    # shuffle
    perm = rng.permutation(len(all_pairs))
    return all_pairs[perm], labels[perm]


def _train_val_split(pairs: np.ndarray, labels: np.ndarray, val_ratio: float = 0.2):
    n = len(pairs)
    n_val = max(int(n * val_ratio), 1)
    return (pairs[n_val:], labels[n_val:]), (pairs[:n_val], labels[:n_val])


@torch.no_grad()
def _evaluate(
    gnn: CausalGNN,
    head: LinkPredictor,
    data,
    pairs: np.ndarray,
    labels: np.ndarray,
    device: str,
) -> Dict[str, float]:
    gnn.eval()
    head.eval()

    x = data.x.to(device)
    edge_index = data.edge_index.to(device)
    edge_attr = getattr(data, "edge_attr", None)
    if edge_attr is not None:
        edge_attr = edge_attr.to(device)

    emb = gnn(x, edge_index, edge_attr)

    src_idx = torch.tensor(pairs[:, 0], dtype=torch.long, device=device)
    dst_idx = torch.tensor(pairs[:, 1], dtype=torch.long, device=device)
    logits = head(emb[src_idx], emb[dst_idx])
    probs = torch.sigmoid(logits)

    y = torch.tensor(labels, dtype=torch.float32, device=device)
    preds = (probs >= 0.5).float()
    acc = (preds == y).float().mean().item()

    # simple precision/recall
    tp = ((preds == 1) & (y == 1)).sum().item()
    fp = ((preds == 1) & (y == 0)).sum().item()
    fn = ((preds == 0) & (y == 1)).sum().item()
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0

    return {"acc": acc, "precision": precision, "recall": recall}


def main():
    parser = argparse.ArgumentParser(description="Train GNN for causal link prediction")
    parser.add_argument("--nodes", type=str, default="nodes_from_history.csv", help="Nodes CSV")
    parser.add_argument("--edges", type=str, default="edges_template.csv", help="Edges CSV")
    parser.add_argument("--epochs", type=int, default=200, help="Training epochs")
    parser.add_argument("--lr", type=float, default=1e-2, help="Learning rate")
    parser.add_argument("--neg-mult", type=int, default=3, help="Negative samples per positive")
    parser.add_argument("--val-ratio", type=float, default=0.2, help="Validation ratio")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--device", type=str, default="cpu", help="cpu or cuda")

    args = parser.parse_args()

    device = args.device
    if device == "cuda" and not torch.cuda.is_available():
        print("[train] cuda requested but not available; using cpu")
        device = "cpu"

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)

    loader = HistoricalDataLoader(args.nodes, args.edges)
    data = loader.build_graph()

    pairs, labels = _build_edge_pairs(loader, negative_multiplier=args.neg_mult, seed=args.seed)
    (train_pairs, train_labels), (val_pairs, val_labels) = _train_val_split(pairs, labels, val_ratio=args.val_ratio)

    print(f"[train] total pairs: {len(pairs)} (pos+neg)")
    print(f"[train] train: {len(train_pairs)} | val: {len(val_pairs)}")

    gnn = CausalGNN(
        input_dim=data.x.shape[1],
        hidden_dim=64,
        output_dim=32,
        num_layers=3,
        dropout=0.2,
    ).to(device)

    head = LinkPredictor(emb_dim=32, hidden_dim=64, dropout=0.2).to(device)

    opt = Adam(list(gnn.parameters()) + list(head.parameters()), lr=args.lr)
    loss_fn = nn.BCEWithLogitsLoss()

    data_x = data.x.to(device)
    data_edge_index = data.edge_index.to(device)
    data_edge_attr = getattr(data, "edge_attr", None)
    if data_edge_attr is not None:
        data_edge_attr = data_edge_attr.to(device)

    y_train = torch.tensor(train_labels, dtype=torch.float32, device=device)
    train_src = torch.tensor(train_pairs[:, 0], dtype=torch.long, device=device)
    train_dst = torch.tensor(train_pairs[:, 1], dtype=torch.long, device=device)

    for epoch in range(1, args.epochs + 1):
        gnn.train()
        head.train()

        opt.zero_grad()

        emb = gnn(data_x, data_edge_index, data_edge_attr)
        logits = head(emb[train_src], emb[train_dst])
        loss = loss_fn(logits, y_train)
        loss.backward()
        opt.step()

        if epoch == 1 or epoch % 20 == 0 or epoch == args.epochs:
            train_metrics = _evaluate(gnn, head, data, train_pairs, train_labels, device)
            val_metrics = _evaluate(gnn, head, data, val_pairs, val_labels, device)
            print(
                f"[epoch {epoch:03d}] loss={loss.item():.4f} | "
                f"train acc={train_metrics['acc']:.3f} prec={train_metrics['precision']:.3f} rec={train_metrics['recall']:.3f} | "
                f"val acc={val_metrics['acc']:.3f} prec={val_metrics['precision']:.3f} rec={val_metrics['recall']:.3f}"
            )

    out_dir = Path("models")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "causal_gnn.pt"

    payload = {
        "gnn_state_dict": gnn.state_dict(),
        "link_head_state_dict": head.state_dict(),
        "meta": {
            "nodes": args.nodes,
            "edges": args.edges,
            "epochs": args.epochs,
            "lr": args.lr,
            "neg_mult": args.neg_mult,
            "val_ratio": args.val_ratio,
            "seed": args.seed,
        },
    }
    torch.save(payload, out_path)
    print(f"[train] saved model to: {out_path}")


if __name__ == "__main__":
    main()


