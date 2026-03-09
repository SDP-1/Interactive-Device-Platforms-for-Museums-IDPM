# Model Training + Input/Output Flow

## Training: what is being trained?

The trainable part is a **Graph Neural Network (GNN)** plus a small **link prediction head**:

- **GNN**: `gnn_model.CausalGNN`
  - Learns **node embeddings** from the graph structure.
- **Link predictor head**: `train_gnn.LinkPredictor`
  - Takes **(source node embedding + target node embedding)** and predicts whether an edge should exist.

This is trained as a **binary classification** problem:
- **Positive (label=1)**: edges that exist in your `edges_template.csv`
- **Negative (label=0)**: edges that do *not* exist (sampled automatically)

## Training data: where does it come from?

Training reads two CSV files:

- **Nodes**: `nodes_from_history.csv`
  - Your local events (LOC_001 … LOC_012)
- **Edges**: `edges_template.csv`
  - Your causal links (GLOBAL_xxx → LOC_xxx)

The graph is built by:
- `data_loader.HistoricalDataLoader.build_graph()`

## How CSV data is taken into model training (CSV → Graph → Training pairs → Tensors)

This is the exact path your data takes from CSV files into the training loop:

### Step 1 — Read CSV files (`data_loader.HistoricalDataLoader.load_data`)

`train_gnn.py` creates:

- `loader = HistoricalDataLoader(nodes_file, edges_file)`

Then calls:

- `data = loader.build_graph()`

Inside `build_graph()`, it first calls `load_data()` which reads:

- `nodes_from_history.csv` → `self.nodes_df`
- `edges_template.csv` → `self.edges_df`

It also builds **ID ↔ index maps** used everywhere later:

- `self.node_to_idx[node_id] = idx`
- `self.idx_to_node[idx] = node_id`

### Step 2 — Build the graph tensors (`data_loader.HistoricalDataLoader.build_graph`)

`build_graph()` converts the CSVs into a **PyTorch Geometric** `Data` object:

- **Node feature matrix**: `data.x` with shape `[num_nodes, 10]`
  - If a node exists in `nodes_from_history.csv` (your LOC_* rows), it gets real features.
  - If a node is only referenced by edges (e.g., `GLOBAL_001`) and not present in the nodes CSV, it gets default features `[0.0]*10`.

- **Edge list tensor**: `data.edge_index` with shape `[2, num_edges]`
  - Each row from `edges_template.csv` becomes one directed edge:
    - `source_node_id` → `target_node_id`

- **Edge attribute matrix**: `data.edge_attr` with shape `[num_edges, 4]`
  - `[directness_score, source_count, max_sources_required, temporal_gap_days]`

This graph is what the GNN consumes during training.

### Step 3 — Create training examples (positive + negative pairs) (`train_gnn._build_edge_pairs`)

After `data` is built, `train_gnn.py` creates a training dataset of node-index pairs:

#### Positives (label = 1)

From each row in `edges_template.csv`:
- `(src_idx, dst_idx)` where:
  - `src_idx = loader.node_to_idx[source_node_id]`
  - `dst_idx = loader.node_to_idx[target_node_id]`

These are your “true” causal links.

#### Negatives (label = 0)

`train_gnn.py` randomly samples pairs that do NOT exist as edges:

- typically `(GLOBAL_* → LOC_*)` pairs
- number of negatives ≈ `neg_mult × num_positives` (controlled by `--neg-mult`)

So the training data becomes:

- `pairs`: numpy array shape `[N, 2]` of `(src_idx, dst_idx)`
- `labels`: numpy array shape `[N]` of `0/1`

### Step 4 — Split train/validation (`train_gnn._train_val_split`)

The code splits the pairs into:
- training set
- validation set

Controlled by `--val-ratio` (default 0.2).

### Step 5 — Training loop (where tensors go into the model)

In each epoch, training does:

1. Compute node embeddings using the GNN:
   - `emb = gnn(data.x, data.edge_index, data.edge_attr)`
   - `emb` shape: `[num_nodes, 32]`

2. Select embeddings for each training pair:
   - `src_emb = emb[src_idx]`
   - `dst_emb = emb[dst_idx]`

3. Predict edge existence using the link head:
   - `logits = head(src_emb, dst_emb)`  (one logit per pair)

4. Compute loss and update weights:
   - `loss = BCEWithLogitsLoss(logits, labels)`
   - backprop + optimizer step

### Step 6 — Save the trained model to disk

At the end:
- file written: `models/causal_gnn.pt`
- contains:
  - `gnn_state_dict` (GNN weights)
  - `link_head_state_dict` (link predictor weights)
  - `meta` (training parameters)

## Important note (data size)

Right now `edges_template.csv` has only a few edges, so the training set is tiny. This can overfit easily (you’ll see perfect train accuracy fast).

To train a better model, add more edges (more GLOBAL_* → LOC_* links) and/or add more nodes/events.

### Positive edges

From `edges_template.csv` columns:
- `source_node_id`
- `target_node_id`

Each becomes one positive training example: \((source, target, 1)\)

### Negative edges

Generated inside `train_gnn.py`:
- It samples random pairs of `(GLOBAL_* → LOC_*)` that **are not** in the positive set.
- The number of negatives is controlled by `--neg-mult`:
  - `--neg-mult 3` means **3 negatives per positive** (approx).

## How to train (commands)

### 1) Install dependencies

```bash
pip install -r requirements.txt
```

### 2) Train the model

```bash
python train_gnn.py --nodes nodes_from_history.csv --edges edges_template.csv --epochs 200 --lr 0.01 --neg-mult 3
```

### 3) Output of training (saved model)

Training saves a model file here:

- `models/causal_gnn.pt`

That file contains:
- `gnn_state_dict` (weights for `CausalGNN`)
- `link_head_state_dict` (weights for `LinkPredictor`)
- `meta` (training settings)

## How the trained model is used when you run the pipeline

When you run:

```bash
python pipeline_main.py --input "Tea Heritage Exhibit"
```

Layer 4 automatically loads the saved model:

- `layer4_gnn_reasoning.GNNReasoner` checks for `models/causal_gnn.pt`
- If found, it loads the weights into `CausalGNN`
- You will see a console message:
  - `[Layer 4] Loaded trained GNN weights from: models/causal_gnn.pt`

## Input → Output flow (how the system works)

The full system is run by:
- `pipeline_main.py`

It runs **Layer 0 → Layer 7** in order.

## What is the input?

You provide the input in either:

### Option A: command line

```bash
python pipeline_main.py --input "Tea Heritage Exhibit" --top-k 5
```

Optional:
- `--date "1867"` (YYYY or YYYY-MM-DD)
- `--location "Sri Lanka"`

### Option B: interactive

```bash
python pipeline_main.py
```

Then type an exhibit name or event name at the prompt.

## How the input is processed (Layer-by-layer)

### Layer 0 — Parse input (`layer0_curator_input.py`)

Input: a string (e.g., `"Tea Heritage Exhibit"`)

Output: a structured query dict like:
- `local_event_text`
- `date_range` (optional)
- `location` (optional)
- `entities` (extracted)
- `keywords` (extracted)

### Local event matching (inside `pipeline_main.py`)

The system matches your input to a local node in `nodes_from_history.csv`:
- It searches by event name and exhibit name
- Example match:
  - `"Tea Heritage Exhibit"` → `LOC_001`

After the match, the pipeline uses the **matched local event name + description** to build a better query for Wikipedia.

### Layer 1 — Knowledge collection (`layer1_knowledge_collection.py`)

Goal: pull evidence snippets from Wikipedia (and other sources).

It uses:
- Wikipedia summary (REST)
- MediaWiki search (your curl #1)
- Plaintext extracts (your curl #2)
- Category members (optional)
- Seshat DB (optional)

Output: an `evidence` dict including:
- `wikipedia_snippets`
- `wikipedia_search_results`
- `wikipedia_extracts`
- `raw_text_evidence` (combined)

The pipeline prints the **Wikipedia sources found** after this step.

### Layer 2 — Candidate generation (`layer2_candidate_generation.py`)

Goal: select which global events might influence the local event.

It uses TF-IDF similarity against an internal global-events list (GLOBAL_001…):
- Industrial Revolution
- American Civil War
- Coffee Leaf Rust Epidemic
- etc.

Output: ranked candidate global events.

### Layer 3 — Graph construction (`layer3_graph_construction.py`)

Goal: build a small graph for reasoning:
- local node
- candidate global nodes
- intermediate nodes (commodities/entities)
- edges between them

Output: a graph dict with `nodes` and `edges`.

### Layer 4 — GNN reasoning (`layer4_gnn_reasoning.py`)

Goal: produce a **causal strength** per global candidate.

How it works:
- If a candidate node exists in the base CSV graph, it can use the trained GNN more directly.
- Otherwise it falls back to graph-structure scoring.

Output: predictions like:
- `global_event_id`
- `local_event_id`
- `causal_strength_score`
- `mechanism_probs`

### Layer 5 — Constraints + scoring (`layer5_constraint_scoring.py`)

Goal: validate + compute reliability:
- Temporal order check
- Geographic plausibility
- Source consistency
- Reliability score using:
  - \(R = 0.4D + 0.3S + 0.3T\)

Output: scored predictions with:
- `final_score`
- `reliability`
- `constraint_results`

### Layer 6 — Explanation paths (`layer6_path_construction.py`)

Goal: generate human-readable explanation chains (paths) like:
- `American Civil War → Tea (commodity) → Establishment of Tea Plantations in Ceylon`

### Layer 7 — Packaging + final output (`layer7_result_packaging.py`)

Goal: create the final report:
- Local event details
- Stats
- Wikipedia sources found
- Top influences with scores, reliability, constraints, and paths

## What is the output?

### Console output

The pipeline prints progress logs per layer and then a formatted report.

### Program output (Python object)

Internally, `pipeline_main.py` returns a `results` dictionary containing:
- `local_event`
- `top_influences`
- `statistics`
- `evidence_summary`

## Quick sanity test

Train quickly:

```bash
python train_gnn.py --epochs 20
```

Run:

```bash
python pipeline_main.py --input "Tea Heritage Exhibit" --top-k 3
```


