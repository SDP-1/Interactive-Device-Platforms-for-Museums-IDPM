# How to Run: 7-Layer Causal Logic Engine

## Quick Start

### 0. Build `nodes_from_history.csv` from your History file (recommended)

The pipeline **does not read** `History (1).csv` directly. It reads `nodes_from_history.csv`.

If you changed/updated your history file, rebuild nodes like this:

```bash
python build_nodes_from_history.py --history "History (1).csv" --out nodes_from_history.csv
```

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. (Optional) Train the Model (Client requirement: “train a model and run a model”)

trained GNN:

```bash
python train_gnn.py --nodes nodes_from_history.csv --edges edges_template.csv --epochs 200 --lr 0.01 --neg-mult 3
```

This creates: `models/causal_gnn.pt`

After training, **Layer 4 automatically loads** the trained weights when you run `pipeline_main.py`.

> Note: `edges_template.csv` must reference your local nodes as `LOC_###` (not `LOCAL_###`) to match `nodes_from_history.csv`.

### 3. Run the Pipeline

You can run the system in two ways:

#### **Option A: Command Line with Arguments**

```bash
python pipeline_main.py --input "Tea Heritage Exhibit"
```

**With optional parameters:**
```bash
python pipeline_main.py --input "Tea Heritage Exhibit" --date "1867" --location "Sri Lanka" --top-k 10
```

#### **Option B: Interactive Mode**

```bash
python pipeline_main.py
```

This will start an interactive session where you can enter queries one by one.

## What to Enter in the Terminal

### Interactive Mode

When you run `python pipeline_main.py` without arguments, you'll see:

```
================================================================================
7-Layer Causal Logic Engine - Interactive Mode
================================================================================

Enter local event text or exhibit name to discover global influences.
Type 'quit' or 'exit' to stop.

Enter local event/exhibit: 
```

**You can enter:**

1. **Exhibit Names** (from your database):
   - `Tea Heritage Exhibit`
   - `Railway History Exhibit`
   - `Coffee-to-Tea Transition Exhibit`
   - `Colombo Port Heritage Exhibit`
   - `Labor History Exhibit`
   - `Industrial Technology Exhibit`
   - `Colonial Governance Exhibit`
   - `Economic History Exhibit`
   - `Plantation Technology Exhibit`
   - `Colonial Urban History Exhibit`
   - `Transport Infrastructure Exhibit`
   - `Tea Trade Exhibit`

2. **Event Names** (from your database):
   - `Establishment of Tea Plantations in Ceylon`
   - `Expansion of the Ceylon Railway Network`
   - `Decline of Coffee Plantations in Ceylon`
   - `Development of Colombo Port as a Colonial Trade Hub`
   - `Migration of South Indian Tamil Labor to Plantations`
   - etc.

3. **Partial Text** (system will try to match):
   - `tea plantation`
   - `railway`
   - `coffee`
   - `port`
   - `labor migration`

**To exit:** Type `quit`, `exit`, or `q`

### Command Line Arguments

```bash
python pipeline_main.py [OPTIONS]
```

**Required:**
- `--input TEXT` - Local event text or exhibit name

**Optional:**
- `--date DATE` - Date in format YYYY-MM-DD or YYYY (e.g., "1867" or "1867-01-01")
- `--location LOCATION` - Location string (e.g., "Sri Lanka" or "Colombo")
- `--top-k NUMBER` - Number of top results to return (default: 10)
- `--nodes FILE` - Path to nodes CSV file (default: nodes_from_history.csv)
- `--edges FILE` - Path to edges CSV file (default: edges_template.csv)

## Example Commands

### Example 1: Basic Query
```bash
python pipeline_main.py --input "Tea Heritage Exhibit"
```

### Example 2: With Date
```bash
python pipeline_main.py --input "Tea Heritage Exhibit" --date "1867"
```

### Example 3: With Date and Location
```bash
python pipeline_main.py --input "Railway History Exhibit" --date "1864" --location "Colombo-Kandy"
```

### Example 4: Get Top 5 Results
```bash
python pipeline_main.py --input "Coffee-to-Tea Transition Exhibit" --top-k 5
```

### Example 5: Custom Data Files
```bash
python pipeline_main.py --input "Tea Heritage Exhibit" --nodes my_nodes.csv --edges my_edges.csv
```

## Add a NEW local event (so your input will match)

If you type something like **"Establishment of the University of Ceylon"** and it is **not** in your history dataset, the pipeline cannot match it.

## Ad-hoc local events (inputs NOT in History / nodes)

The pipeline now supports **ad-hoc local events** so *any* input text can pass through (useful for a frontend).

### Minimal ad-hoc example (just pass `--input`, optionally `--date` / `--location`)

```bash
python pipeline_main.py --input "Bandaranaike International Airport" --date "1950" --location "Negombo, Sri Lanka"
```

### Fully-specified ad-hoc local event (recommended for frontend)

Required fields you can provide:
- `--local-id` (unique short identifier)
- `--local-title` (human title)
- `--local-date` (ISO-8601 or year)
- `--local-location` (human readable)
- `--local-description` (full, untruncated text)
- `--local-source-url` (authoritative URL)

```bash
python pipeline_main.py --input "Custom Local Event" `
  --local-id "LOC_CUSTOM_001" `
  --local-title "Custom Local Event" `
  --local-date "1950-01-01" `
  --local-location "Negombo, Sri Lanka" `
  --local-description "Full curator-provided description..." `
  --local-source-url "https://example.org/source"
```

### Step A — Add the new event into `History (1).csv` and rebuild nodes

Example (edit the text/date/location as you need):

```bash
python add_history_event.py --history "History (1).csv" `
  --event-name "Establishment of the University of Ceylon" `
  --date "1942" `
  --location "Colombo, Sri Lanka" `
  --description "Founded as the first modern university in Ceylon; major institution-building in late colonial period." `
  --purpose "Education/Policy" `
  --exhibit "Education & Institutions Exhibit" `
  --source-count 2 `
  --max-sources 4 `
  --sources "University archives;Wikipedia" `
  --rebuild-nodes
```

This will print the new id (example: `LOC_043`) and regenerate `nodes_from_history.csv`.

### Step B — Add 1–3 training edges for that new local event (optional but recommended)

Training needs **positive edges** in `edges_template.csv`. Add at least one:

```bash
python add_edge.py --edges "edges_template.csv" `
  --source "GLOBAL_005" `
  --target "LOC_043" `
  --causal-description "Late-colonial governance reforms and imperial education policies enabled establishment of modern higher education institutions." `
  --directness 0.7 `
  --source-count 2 `
  --max-sources 5 `
  --sources "Colonial education reports;University archives"
```

### Step C — Retrain (optional) and run

```bash
python train_gnn.py --nodes nodes_from_history.csv --edges edges_template.csv --epochs 200 --lr 0.01 --neg-mult 3
python pipeline_main.py --input "Establishment of the University of Ceylon"
```

## Optional: curator-friendly influence paragraph via API key (LLM enrichment)

Some Wikipedia-derived descriptions can be noisy. You can enable an **optional last-step enrichment**
that rewrites each influence description into a curator-friendly paragraph.

Set one of these environment variables:
- `INFLUENCE_LLM_API_KEY` (preferred), or `OPENAI_API_KEY`

Optional:
- `INFLUENCE_LLM_ENDPOINT` (default: OpenAI-compatible chat completions endpoint)
- `INFLUENCE_LLM_MODEL` (default: `gpt-4o-mini`)
- `INFLUENCE_LLM_MAX` (default: `5`) max influences to enrich per run

## What Happens When You Run It

1. **Layer 0**: Parses your input, extracts entities and keywords
2. **Layer 1**: Collects knowledge from Wikipedia, Seshat DB, etc.
3. **Layer 2**: Generates candidate global events
4. **Layer 3**: Builds knowledge graph
5. **Layer 4**: GNN reasoning predicts causal links
6. **Layer 5**: Validates and scores with reliability metrics
7. **Layer 6**: Constructs explanation paths
8. **Layer 7**: Formats beautiful output

## Expected Output Format

The system will output a formatted report showing:

```
================================================================================
💡 GLOBAL-LOCAL HISTORICAL INFLUENCE DISCOVERY
================================================================================

📌 Local Event: Establishment of Tea Plantations in Ceylon
   Exhibit: Tea Heritage Exhibit
   Date: 1867-01-01
   Location: Sri Lanka (Central Highlands)

📊 Discovery Statistics:
   Total Candidates: 3
   High Confidence (>0.7): 2
   Medium Confidence (0.5-0.7): 1
   Low Confidence (<0.5): 0

================================================================================
🌍 TOP GLOBAL INFLUENCES
================================================================================

--------------------------------------------------------------------------------
Influence #1
--------------------------------------------------------------------------------

🌍 Global Cause: American Civil War
   Date: 1861-04-12
   Location: United States
   Description: War disrupting global cotton supply chains...

📊 Influence Metrics:
   Causal Strength: 0.85
   Reliability Score: 89.2/100
   Final Score: 0.87
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
      American Civil War → Tea (commodity) → Establishment of Tea Plantations
```

## Available Exhibit Names

You can use any of these exhibit names from your database:

1. Tea Heritage Exhibit
2. Railway History Exhibit
3. Coffee-to-Tea Transition Exhibit
4. Colombo Port Heritage Exhibit
5. Industrial Technology Exhibit
6. Colonial Governance Exhibit
7. Labor History Exhibit
8. Economic History Exhibit
9. Plantation Technology Exhibit
10. Colonial Urban History Exhibit
11. Transport Infrastructure Exhibit
12. Tea Trade Exhibit

## Troubleshooting

### Error: "Could not find local event matching"
- Make sure you're using an exact exhibit name or event name from the database
- Try using partial text that matches the event description
- Check `nodes_from_history.csv` for available events

### Error: Module not found
- Run: `pip install -r requirements.txt`
- Make sure you're in the correct directory

### Slow Performance
- First run may be slow due to Wikipedia API calls
- Subsequent runs use cached results
- Adjust rate limiting in `layer1_knowledge_collection.py` if needed

### No Results Found
- Check that `nodes_from_history.csv` and `edges_template.csv` exist
- Verify the input text matches an exhibit name or event name
- Try using partial text from the event description

## Testing the Wikipedia API

To test the enhanced Wikipedia API implementation:

```bash
python test_wikipedia_api.py
```

This will test all API methods and save results to `test_results.json`.

## Next Steps

1. **Run a query**: Try `python pipeline_main.py --input "Tea Heritage Exhibit"`
2. **Explore results**: Review the discovered global influences
3. **Try different exhibits**: Test with other exhibit names
4. **Add more data**: Expand `nodes_from_history.csv` and `edges_template.csv` with more events


