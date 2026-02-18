# The 7-Layer Causal Logic Engine: Complete Model and Flow

## What is the Model?

The **7-Layer Causal Logic Engine** is a Graph Neural Network (GNN)-based system that discovers and analyzes causal relationships between global historical events and local Sri Lankan events. It's not just a simple search engine—it's an AI reasoning system that:

1. **Understands** curator queries about local historical events
2. **Fetches** knowledge from multiple sources (Wikipedia, etc.)
3. **Generates** candidate global events that might have influenced the local event
4. **Builds** a knowledge graph connecting these events
5. **Reasons** using a Graph Neural Network to predict causal links
6. **Validates** predictions using constraints and evidence
7. **Explains** the causal paths with reliability scores
8. **Presents** beautiful, curator-friendly results

The model uses a **Reliability Score** formula to quantify the confidence in each causal link:
```
R = w_d × D + w_s × S + w_t × T
```
Where:
- **D** = Directness of Link (0.0 to 1.0)
- **S** = Source Consistency (ratio of sources)
- **T** = Temporal Proximity (exponential decay based on time gap)
- **w_d** = 0.4, **w_s** = 0.3, **w_t** = 0.3 (weights)

---

## The Complete Flow: From Input to Output

### **The Journey Begins: Curator Input**

Imagine a museum curator wants to understand the global influences behind a local exhibit. They type:

```
"Tea Heritage Exhibit"
```

This simple text triggers a sophisticated 7-layer processing pipeline that will discover hidden historical connections.

---

### **Layer 0: Curator Input Parser**
**File**: `layer0_curator_input.py`

**What Happens:**
The system receives the raw text input and transforms it into a structured query object.

**Process:**
1. **Text Parsing**: Extracts the core event text ("Tea Heritage Exhibit")
2. **Date Extraction**: Looks for dates in the text (e.g., "1867" or "1867-01-15")
3. **Location Extraction**: Identifies location mentions (e.g., "Sri Lanka", "Ceylon", "Colombo")
4. **Entity Extraction**: Finds important entities using regex patterns:
   - Countries: British, Britain, UK, Sri Lanka, Ceylon, India, China, America
   - Organizations: Colonial administrations, trade companies
5. **Keyword Extraction**: Removes stop words and extracts meaningful keywords:
   - From "Tea Heritage Exhibit" → ["tea", "heritage", "exhibit", "plantation"]

**Output:**
```python
{
    'local_event_text': 'Tea Heritage Exhibit',
    'date_range': {'year': 1867, 'start': '1867-01-01', 'end': '1867-12-31'},
    'location': 'Sri Lanka (Central Highlands)',
    'entities': ['British', 'Sri Lanka'],
    'keywords': ['tea', 'heritage', 'exhibit', 'plantation', 'cultivation']
}
```

**Why This Matters:**
This structured query becomes the foundation for all subsequent layers. It tells the system exactly what to search for and what context to consider.

---

### **Layer 1: Knowledge Collection**
**File**: `layer1_knowledge_collection.py`

**What Happens:**
The system now searches external knowledge sources to gather evidence about the local event and related topics.

**Process:**
1. **Wikipedia Search**: 
   - Searches for "Tea Heritage Exhibit" or "Tea Plantations in Ceylon"
   - Fetches page summaries and extracts
   - Caches results to avoid redundant API calls

2. **Entity Search**:
   - For each entity found (e.g., "British", "Sri Lanka"), searches Wikipedia
   - Collects information about British colonial history, Sri Lankan history

3. **Commodity Extraction**:
   - Identifies commodities mentioned: "tea", "coffee", "cotton"
   - Searches for each commodity to understand trade context

4. **Context Keyword Search**:
   - Searches top 5 keywords (e.g., "plantation", "cultivation", "heritage")
   - Gathers contextual information

**Output:**
```python
{
    'wikipedia_snippets': [
        {
            'title': 'Tea production in Sri Lanka',
            'extract': 'Tea production in Sri Lanka began in 1867...',
            'url': 'https://en.wikipedia.org/...',
            'source': 'wikipedia'
        }
    ],
    'entity_mentions': [...],
    'related_commodities': [...],
    'raw_text_evidence': [/* All collected snippets */]
}
```

**Why This Matters:**
This layer provides the "raw material" for candidate generation. Without evidence, the system can't make informed decisions about which global events might be relevant.

---

### **Layer 2: Candidate Generation**
**File**: `layer2_candidate_generation.py`

**What Happens:**
The system now generates a shortlist of candidate global events that might have influenced the local event. This is where the "universe of history" gets narrowed down to manageable candidates.

**Process:**
1. **Build Search Index**:
   - Loads a database of known global events (e.g., Industrial Revolution, American Civil War, Opium Wars)
   - Creates TF-IDF vectors for each global event
   - Builds a searchable index

2. **Semantic Retrieval**:
   - Combines query text + evidence snippets into a search query
   - Uses TF-IDF cosine similarity to find relevant global events
   - Ranks events by semantic similarity

3. **Multi-Factor Scoring**:
   For each candidate, calculates:
   - **Similarity Score** (0.4 weight): How semantically similar is the global event to the query?
   - **Keyword Match** (0.3 weight): How many keywords overlap?
   - **Entity Match** (0.2 weight): Do entities match (e.g., both mention "British")?
   - **Temporal Relevance** (0.1 weight): Did the global event happen before the local event?

4. **Ranking**:
   - Combines all scores into a relevance score
   - Sorts candidates by relevance
   - Returns top 50-200 candidates

**Example Candidates:**
```python
[
    {
        'global_event': {
            'node_id': 'GLOBAL_002',
            'event_name': 'American Civil War',
            'date': '1861-04-12',
            'description': 'War disrupting global cotton supply chains...'
        },
        'relevance_score': 0.85,
        'similarity_score': 0.72,
        'keyword_match': 0.60,
        'entity_match': 0.40,
        'temporal_relevance': 0.90  # Happened before 1867
    },
    {
        'global_event': {
            'node_id': 'GLOBAL_001',
            'event_name': 'Industrial Revolution',
            'date': '1760-01-01',
            'description': 'Technological transformation...'
        },
        'relevance_score': 0.78,
        ...
    }
]
```

**Why This Matters:**
This layer dramatically reduces the search space. Instead of considering all of history, the system focuses on the most promising candidates. This makes the GNN processing feasible.

---

### **Layer 3: Graph Construction**
**File**: `layer3_graph_construction.py`

**What Happens:**
The system now builds a knowledge graph that connects the local event with candidate global events. This graph structure is what the GNN will "reason" over.

**Process:**
1. **Node Creation**:
   - **Local Node**: Creates a node for the local event (e.g., "LOC_001: Establishment of Tea Plantations")
   - **Global Nodes**: Creates nodes for each candidate global event (top 20)
   - **Intermediate Nodes**: Extracts intermediate concepts:
     - Commodities: "Tea", "Coffee", "Cotton"
     - Entities: "British Empire", "Colonial Administration"
     - These act as "bridges" between global and local events

2. **Edge Creation**:
   - **Direct Edges**: Creates edges from global events → local event
     - Weight = relevance score from Layer 2
     - Type = "causal_candidate"
   - **Intermediate Edges**: Creates edges through intermediate nodes
     - Global Event → Commodity → Local Event
     - Global Event → Entity → Local Event
     - These enable multi-hop reasoning

3. **Graph Structure**:
```python
{
    'nodes': [
        {'id': 'LOC_001', 'type': 'local', 'data': {...}},
        {'id': 'GLOBAL_002', 'type': 'global', 'data': {...}},
        {'id': 'INTER_commodity_0', 'type': 'intermediate', 'data': {'name': 'Tea'}}
    ],
    'edges': [
        {
            'source': 'GLOBAL_002',
            'target': 'LOC_001',
            'type': 'causal_candidate',
            'weight': 0.85
        },
        {
            'source': 'GLOBAL_002',
            'target': 'INTER_commodity_0',
            'type': 'mentions',
            'weight': 0.5
        }
    ]
}
```

**Why This Matters:**
The graph structure enables the GNN to "see" relationships. The GNN can now reason about how information flows through the graph, finding paths from global events to local events.

---

### **Layer 4: GNN Reasoning / Link Prediction**
**File**: `layer4_gnn_reasoning.py`

**What Happens:**
This is where the AI "thinks." The Graph Neural Network processes the graph structure to predict which global events truly influenced the local event and how.

**Process:**
1. **GNN Model Architecture**:
   - **Input**: Node features (10 dimensions: node type, source count, source ratio, etc.)
   - **Layers**: 3 Graph Convolutional Network (GCN) layers
   - **Hidden Dimension**: 64
   - **Output Dimension**: 32 (node embeddings)
   - **Activation**: ReLU with dropout (0.2)

2. **Path Finding**:
   - For each global event candidate, finds paths to the local event
   - Uses breadth-first search (BFS) to discover all possible paths
   - Maximum depth: 3 hops (Global → Intermediate → Local)

3. **Embedding Calculation**:
   - Runs the graph through the GNN to get node embeddings
   - For each path, extracts embeddings of nodes along the path
   - Calculates path score = mean of node embeddings

4. **Mechanism Classification**:
   - Predicts the type of causal mechanism:
     - **trade_shock**: Economic disruption (e.g., war affecting supply)
     - **policy**: Colonial policy changes
     - **technology**: Technological transfer
     - **economic_shift**: Economic restructuring
     - **colonial_control**: Direct colonial administration
   - Uses keyword matching and heuristics

**Output:**
```python
[
    {
        'global_event_id': 'GLOBAL_002',
        'local_event_id': 'LOC_001',
        'causal_strength_score': 0.82,  # From GNN
        'path': {
            'path': [0, 5, 1],  # Node indices
            'path_node_ids': ['GLOBAL_002', 'INTER_commodity_0', 'LOC_001'],
            'length': 2
        },
        'mechanism_probs': {
            'trade_shock': 0.4,
            'economic_shift': 0.3,
            'policy': 0.2,
            'technology': 0.1
        },
        'metadata': {...}
    }
]
```

**Why This Matters:**
The GNN doesn't just find connections—it learns to recognize patterns in how global events influence local events. It can identify indirect paths (e.g., Global Event → Commodity → Local Event) that humans might miss.

---

### **Layer 5: Constraint + Evidence Scoring**
**File**: `layer5_constraint_scoring.py`

**What Happens:**
The system now validates the GNN predictions using hard constraints and evidence strength. This is where "AI confidence" meets "historical rigor."

**Process:**
1. **Constraint Checking**:
   For each prediction, checks:
   
   a. **Temporal Order Constraint**:
      - Cause must happen before effect
      - Example: American Civil War (1861) → Tea Plantations (1867) ✓
      - If global event happens after local event, constraint fails
   
   b. **Geographic Plausibility**:
      - Checks if connection makes geographic sense
      - Example: British events can influence Sri Lanka (colonial tie) ✓
      - Example: Chinese events can influence Sri Lanka (trade route) ✓
      - Uses keyword matching: "colonial", "trade", "british"
   
   c. **Source Consistency**:
      - Checks if edge has supporting sources
      - source_count > 0 and source_count ≤ max_sources_required

2. **Evidence Strength Calculation**:
   - Counts how many evidence snippets mention the global event
   - Categorizes sources by type:
     - Archive (weight 1.0): Most reliable
     - Book (weight 0.7): Reliable
     - Wikipedia (weight 0.5): Moderate
     - Other (weight 0.3): Less reliable
   - Calculates weighted evidence strength

3. **Reliability Score Calculation**:
   Uses the formula: **R = w_d × D + w_s × S + w_t × T**
   
   - **D (Directness)**: From edge data (0.0 to 1.0)
   - **S (Source Consistency)**: actual_sources / max_sources
   - **T (Temporal Proximity)**: e^(-Δt) where Δt is years between events
   
   Example:
   - D = 0.9 (strong indirect link)
   - S = 4/5 = 0.8 (4 sources out of 5 required)
   - T = e^(-6) = 0.61 (6 years between 1861 and 1867)
   - R = 0.4×0.9 + 0.3×0.8 + 0.3×0.61 = **0.783** (78.3%)

4. **Final Score Combination**:
   - Combines GNN score (60%) with Reliability score (40%)
   - Final Score = 0.6 × causal_strength + 0.4 × reliability_score

**Output:**
```python
[
    {
        'global_event_id': 'GLOBAL_002',
        'causal_strength_score': 0.82,
        'reliability': {
            'reliability_score': 0.783,
            'reliability_percent': 78.3,
            'directness': 0.9,
            'source_consistency': 0.8,
            'temporal_proximity': 0.61
        },
        'constraint_results': {
            'temporal_order': True,
            'geographic_plausibility': True,
            'source_consistency': True,
            'passed': True
        },
        'evidence_strength': {
            'evidence_strength': 0.75,
            'mention_count': 5
        },
        'final_score': 0.80  # Combined score
    }
]
```

**Why This Matters:**
This layer ensures that predictions are not just "AI confident" but also historically plausible. A prediction that fails constraints is filtered out, ensuring only valid connections are presented.

---

### **Layer 6: Explanation Path Construction**
**File**: `layer6_path_construction.py`

**What Happens:**
The system now finds the best explanatory paths that connect global events to local events. These paths help curators understand "how" the influence happened.

**Process:**
1. **Path Discovery**:
   - For each validated prediction, finds all paths from global to local event
   - Uses BFS (Breadth-First Search) to explore the graph
   - Maximum depth: 4 hops
   - Avoids cycles (no node visited twice in a path)

2. **Path Scoring**:
   For each path, calculates:
   - **Edge Score**: Average weight of edges in the path
   - **Length Penalty**: Prefers shorter paths (1.0 / path_length)
   - **Prediction Score**: Incorporates final_score from Layer 5
   - **Final Path Score**: Weighted combination

3. **Explanation Generation**:
   - For each path, generates human-readable explanation
   - Example: "American Civil War → Tea → Establishment of Tea Plantations"
   - Identifies intermediate nodes and their roles

**Output:**
```python
[
    {
        'path': ['GLOBAL_002', 'INTER_commodity_0', 'LOC_001'],
        'score': 0.82,
        'length': 2,
        'explanation': 'American Civil War affected Tea (commodity) → Establishment of Tea Plantations'
    },
    {
        'path': ['GLOBAL_002', 'LOC_001'],
        'score': 0.75,
        'length': 1,
        'explanation': 'American Civil War directly influenced Establishment of Tea Plantations'
    }
]
```

**Why This Matters:**
Paths provide transparency. Curators can see exactly how the system reasoned from global event to local event, making the AI's "thinking" interpretable.

---

### **Layer 7: Result Packaging**
**File**: `layer7_result_packaging.py`

**What Happens:**
The system now packages all the information into a beautiful, curator-friendly format. This is where technical predictions become actionable insights.

**Process:**
1. **Result Aggregation**:
   - Collects all validated predictions
   - Sorts by final_score (highest first)
   - Takes top 10 influences

2. **Statistics Calculation**:
   - Total candidates found
   - High confidence (>0.7)
   - Medium confidence (0.5-0.7)
   - Low confidence (<0.5)

3. **Formatting**:
   - Creates structured output with:
     - Local event information
     - Top global influences with:
       - Event details (name, date, location, description)
       - Causal strength score
       - Reliability score (0-100)
       - Mechanism type
       - Reliability components (D, S, T)
       - Constraint check results
       - Evidence strength
       - Explanation paths

**Output Format:**
```
================================================================================
💡 GLOBAL-LOCAL HISTORICAL INFLUENCE DISCOVERY
================================================================================

📌 Local Event: Establishment of Tea Plantations in Ceylon
   Exhibit: Tea Heritage Exhibit
   Date: 1867-01-01
   Location: Sri Lanka (Central Highlands)

📊 Discovery Statistics:
   Total Candidates: 5
   High Confidence (>0.7): 2
   Medium Confidence (0.5-0.7): 2
   Low Confidence (<0.5): 1

================================================================================
🌍 TOP GLOBAL INFLUENCES
================================================================================

--------------------------------------------------------------------------------
Influence #1
--------------------------------------------------------------------------------

🌍 Global Cause: American Civil War
   Date: 1861-04-12
   Location: United States
   Description: War disrupting global cotton supply chains causing economic shifts worldwide

📊 Influence Metrics:
   Causal Strength: 0.82
   Reliability Score: 78.3/100
   Final Score: 0.80
   Mechanism: trade_shock

🔍 Reliability Components:
   Directness (D): 0.90
   Source Consistency (S): 0.80
   Temporal Proximity (T): 0.61
   Evidence Strength: 0.75

✓ Constraint Checks:
   Temporal Order: ✓
   Geographic Plausibility: ✓
   Source Consistency: ✓

🔗 Explanation Paths:
   Path 1 (Score: 0.82):
      American Civil War affected Tea (commodity) → Establishment of Tea Plantations
```

**Why This Matters:**
This layer transforms complex AI reasoning into human-readable insights. Curators can now:
- See which global events influenced their exhibit
- Understand the confidence level (reliability score)
- Verify the reasoning (constraint checks)
- Follow the causal path (explanation paths)
- Make informed decisions about accepting/rejecting connections

---

## The Complete Flow Diagram

```
INPUT: "Tea Heritage Exhibit"
    ↓
[Layer 0] Parse → Structured Query
    ↓
[Layer 1] Fetch Knowledge → Evidence Snippets
    ↓
[Layer 2] Generate Candidates → Top 50 Global Events
    ↓
[Layer 3] Build Graph → Nodes + Edges
    ↓
[Layer 4] GNN Reasoning → Causal Predictions
    ↓
[Layer 5] Validate & Score → Reliability Scores
    ↓
[Layer 6] Find Paths → Explanations
    ↓
[Layer 7] Package Results → Beautiful Output
    ↓
OUTPUT: Formatted Discovery Report
```

---

## Key Technical Details

### **Graph Neural Network Architecture**

The GNN uses:
- **Type**: Graph Convolutional Network (GCN)
- **Layers**: 3
- **Input Dimension**: 10 (node features)
- **Hidden Dimension**: 64
- **Output Dimension**: 32 (node embeddings)
- **Activation**: ReLU
- **Regularization**: Batch Normalization + Dropout (0.2)

### **Reliability Score Formula**

```
R = 0.4 × D + 0.3 × S + 0.3 × T
```

Where:
- **D** = Directness (0.0-1.0): How direct is the documented link?
- **S** = Source Consistency (0.0-1.0): actual_sources / max_sources
- **T** = Temporal Proximity (0.0-1.0): e^(-years_between_events)

### **Scoring Weights**

- **Candidate Generation**: Similarity (0.4) + Keywords (0.3) + Entities (0.2) + Temporal (0.1)
- **Final Score**: GNN Score (0.6) + Reliability Score (0.4)
- **Path Score**: Edge Weight (0.4) + Length Penalty (0.3) + Prediction Score (0.3)

---

## Why This Architecture Works

1. **Layered Approach**: Each layer has a specific responsibility, making the system modular and maintainable.

2. **Evidence-Based**: Every prediction is backed by evidence from knowledge sources.

3. **Constraint Validation**: Hard constraints ensure only historically plausible connections are presented.

4. **Transparency**: Explanation paths show exactly how the system reasoned.

5. **Quantified Confidence**: Reliability scores give curators a clear sense of how confident the system is.

6. **Scalable**: The candidate generation layer reduces the search space, making GNN processing feasible even with large historical databases.

---

## Example: Complete Flow for "Tea Heritage Exhibit"

1. **Input**: "Tea Heritage Exhibit"
2. **Layer 0**: Extracts "tea", "heritage", identifies location "Sri Lanka"
3. **Layer 1**: Fetches Wikipedia articles about tea plantations, British colonial history
4. **Layer 2**: Finds candidates: American Civil War (relevance 0.85), Industrial Revolution (0.78)
5. **Layer 3**: Builds graph with nodes for local event, global events, and intermediate "Tea" commodity
6. **Layer 4**: GNN finds path: American Civil War → Tea → Tea Plantations (score 0.82)
7. **Layer 5**: Validates: Temporal ✓ (1861 < 1867), Geographic ✓ (trade connection), Sources ✓ (4/5)
   - Calculates Reliability: R = 0.4×0.9 + 0.3×0.8 + 0.3×0.61 = 0.783
8. **Layer 6**: Finds best path: "American Civil War → Tea → Tea Plantations"
9. **Layer 7**: Formats beautiful output with all metrics and explanations

**Result**: Curator sees that American Civil War (1861) influenced Tea Plantations (1867) with 78.3% reliability, through trade shock mechanism, with clear explanation path.

---

## Conclusion

The 7-Layer Causal Logic Engine is a complete AI reasoning system that transforms simple curator queries into deep historical insights. By combining knowledge retrieval, graph-based reasoning, constraint validation, and transparent explanations, it provides curators with a powerful tool for understanding how global events shaped local history.

The system is **fully functional** and ready to discover causal links in your historical data!

