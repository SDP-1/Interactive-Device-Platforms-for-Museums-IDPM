# Example Outputs: What the System Should Produce

This document shows example outputs your 7-Layer Causal Logic Engine should generate for different local events/exhibits.

---

## Example 1: Tea Heritage Exhibit

**Input:**
```bash
python pipeline_main.py --input "Tea Heritage Exhibit"
```

**Expected Output:**
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
   Description: War disrupting global cotton supply chains and causing massive economic shifts worldwide

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
      American Civil War → Tea (commodity) → Establishment of Tea Plantations in Ceylon

--------------------------------------------------------------------------------
Influence #2
--------------------------------------------------------------------------------

🌍 Global Cause: Industrial Revolution
   Date: 1760-01-01
   Location: Europe
   Description: Technological and economic transformation creating global demand for commodities and rising middle class consumption

📊 Influence Metrics:
   Causal Strength: 0.78
   Reliability Score: 85.5/100
   Final Score: 0.81
   Mechanism: economic_shift

🔍 Reliability Components:
   Directness (D): 0.90
   Source Consistency (S): 0.60
   Temporal Proximity (T): 0.72
   Evidence Strength: 0.70

✓ Constraint Checks:
   Temporal Order: ✓
   Geographic Plausibility: ✓
   Source Consistency: ✓

🔗 Explanation Paths:
   Path 1 (Score: 0.75):
      Industrial Revolution → Tea (commodity) → Establishment of Tea Plantations in Ceylon

--------------------------------------------------------------------------------
Influence #3
--------------------------------------------------------------------------------

🌍 Global Cause: Coffee Leaf Rust Epidemic
   Date: 1869-01-01
   Location: Global
   Description: Global coffee leaf rust disease devastated coffee plantations worldwide

📊 Influence Metrics:
   Causal Strength: 0.72
   Reliability Score: 78.3/100
   Final Score: 0.74
   Mechanism: trade_shock

🔍 Reliability Components:
   Directness (D): 0.85
   Source Consistency (S): 0.67
   Temporal Proximity (T): 0.99
   Evidence Strength: 0.65

✓ Constraint Checks:
   Temporal Order: ✓
   Geographic Plausibility: ✓
   Source Consistency: ✓

🔗 Explanation Paths:
   Path 1 (Score: 0.70):
      Coffee Leaf Rust Epidemic directly influenced Establishment of Tea Plantations in Ceylon

================================================================================
```

---

## Example 2: Railway History Exhibit

**Input:**
```bash
python pipeline_main.py --input "Railway History Exhibit"
```

**Expected Output:**
```
================================================================================
💡 GLOBAL-LOCAL HISTORICAL INFLUENCE DISCOVERY
================================================================================

📌 Local Event: Expansion of the Ceylon Railway Network
   Exhibit: Railway History Exhibit
   Date: 1864-01-01
   Location: Sri Lanka (Colombo–Kandy)

📊 Discovery Statistics:
   Total Candidates: 2
   High Confidence (>0.7): 2
   Medium Confidence (0.5-0.7): 0
   Low Confidence (<0.5): 0

================================================================================
🌍 TOP GLOBAL INFLUENCES
================================================================================

--------------------------------------------------------------------------------
Influence #1
--------------------------------------------------------------------------------

🌍 Global Cause: Industrial Revolution
   Date: 1760-01-01
   Location: Europe
   Description: Technological and economic transformation creating global demand for commodities

📊 Influence Metrics:
   Causal Strength: 0.88
   Reliability Score: 91.5/100
   Final Score: 0.89
   Mechanism: technology

🔍 Reliability Components:
   Directness (D): 1.00
   Source Consistency (S): 0.60
   Temporal Proximity (T): 0.72
   Evidence Strength: 0.80

✓ Constraint Checks:
   Temporal Order: ✓
   Geographic Plausibility: ✓
   Source Consistency: ✓

🔗 Explanation Paths:
   Path 1 (Score: 0.85):
      Industrial Revolution → Transportation Infrastructure → Expansion of the Ceylon Railway Network

--------------------------------------------------------------------------------
Influence #2
--------------------------------------------------------------------------------

🌍 Global Cause: British Colonial Expansion
   Date: 1850-01-01
   Location: Global
   Description: Expansion of British colonial empire and economic control

📊 Influence Metrics:
   Causal Strength: 0.75
   Reliability Score: 82.3/100
   Final Score: 0.78
   Mechanism: colonial_control

🔍 Reliability Components:
   Directness (D): 0.85
   Source Consistency (S): 0.60
   Temporal Proximity (T): 0.96
   Evidence Strength: 0.70

✓ Constraint Checks:
   Temporal Order: ✓
   Geographic Plausibility: ✓
   Source Consistency: ✓

🔗 Explanation Paths:
   Path 1 (Score: 0.72):
      British Colonial Expansion directly influenced Expansion of the Ceylon Railway Network

================================================================================
```

---

## Example 3: Coffee-to-Tea Transition Exhibit

**Input:**
```bash
python pipeline_main.py --input "Coffee-to-Tea Transition Exhibit"
```

**Expected Output:**
```
================================================================================
💡 GLOBAL-LOCAL HISTORICAL INFLUENCE DISCOVERY
================================================================================

📌 Local Event: Decline of Coffee Plantations in Ceylon
   Exhibit: Coffee-to-Tea Transition Exhibit
   Date: 1869-01-01
   Location: Sri Lanka (Central Province)

📊 Discovery Statistics:
   Total Candidates: 2
   High Confidence (>0.7): 2
   Medium Confidence (0.5-0.7): 0
   Low Confidence (<0.5): 0

================================================================================
🌍 TOP GLOBAL INFLUENCES
================================================================================

--------------------------------------------------------------------------------
Influence #1
--------------------------------------------------------------------------------

🌍 Global Cause: Coffee Leaf Rust Epidemic
   Date: 1869-01-01
   Location: Global
   Description: Global coffee leaf rust disease devastated coffee plantations worldwide

📊 Influence Metrics:
   Causal Strength: 0.92
   Reliability Score: 94.5/100
   Final Score: 0.93
   Mechanism: trade_shock

🔍 Reliability Components:
   Directness (D): 1.00
   Source Consistency (S): 0.60
   Temporal Proximity (T): 1.00
   Evidence Strength: 0.85

✓ Constraint Checks:
   Temporal Order: ✓
   Geographic Plausibility: ✓
   Source Consistency: ✓

🔗 Explanation Paths:
   Path 1 (Score: 0.90):
      Coffee Leaf Rust Epidemic directly influenced Decline of Coffee Plantations in Ceylon

--------------------------------------------------------------------------------
Influence #2
--------------------------------------------------------------------------------

🌍 Global Cause: American Civil War
   Date: 1861-04-12
   Location: United States
   Description: War disrupting global cotton supply chains and causing massive economic shifts worldwide

📊 Influence Metrics:
   Causal Strength: 0.80
   Reliability Score: 86.2/100
   Final Score: 0.82
   Mechanism: trade_shock

🔍 Reliability Components:
   Directness (D): 0.90
   Source Consistency (S): 0.80
   Temporal Proximity (T): 0.98
   Evidence Strength: 0.75

✓ Constraint Checks:
   Temporal Order: ✓
   Geographic Plausibility: ✓
   Source Consistency: ✓

🔗 Explanation Paths:
   Path 1 (Score: 0.78):
      American Civil War → Economic Shift → Decline of Coffee Plantations in Ceylon

================================================================================
```

---

## Example 4: Colombo Port Heritage Exhibit

**Input:**
```bash
python pipeline_main.py --input "Colombo Port Heritage Exhibit"
```

**Expected Output:**
```
================================================================================
💡 GLOBAL-LOCAL HISTORICAL INFLUENCE DISCOVERY
================================================================================

📌 Local Event: Development of Colombo Port as a Colonial Trade Hub
   Exhibit: Colombo Port Heritage Exhibit
   Date: 1870-01-01
   Location: Colombo Sri Lanka

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

🌍 Global Cause: Industrial Revolution
   Date: 1760-01-01
   Location: Europe
   Description: Technological and economic transformation creating global demand for commodities

📊 Influence Metrics:
   Causal Strength: 0.82
   Reliability Score: 88.5/100
   Final Score: 0.85
   Mechanism: economic_shift

🔍 Reliability Components:
   Directness (D): 0.90
   Source Consistency (S): 0.67
   Temporal Proximity (T): 0.72
   Evidence Strength: 0.80

✓ Constraint Checks:
   Temporal Order: ✓
   Geographic Plausibility: ✓
   Source Consistency: ✓

🔗 Explanation Paths:
   Path 1 (Score: 0.80):
      Industrial Revolution → Tea (commodity) → Development of Colombo Port as a Colonial Trade Hub

--------------------------------------------------------------------------------
Influence #2
--------------------------------------------------------------------------------

🌍 Global Cause: British Colonial Expansion
   Date: 1850-01-01
   Location: Global
   Description: Expansion of British colonial empire and economic control

📊 Influence Metrics:
   Causal Strength: 0.78
   Reliability Score: 84.2/100
   Final Score: 0.80
   Mechanism: colonial_control

🔍 Reliability Components:
   Directness (D): 0.85
   Source Consistency (S): 0.67
   Temporal Proximity (T): 0.95
   Evidence Strength: 0.75

✓ Constraint Checks:
   Temporal Order: ✓
   Geographic Plausibility: ✓
   Source Consistency: ✓

🔗 Explanation Paths:
   Path 1 (Score: 0.76):
      British Colonial Expansion → Trade Infrastructure → Development of Colombo Port as a Colonial Trade Hub

================================================================================
```

---

## Example 5: Labor History Exhibit

**Input:**
```bash
python pipeline_main.py --input "Labor History Exhibit"
```

**Expected Output:**
```
================================================================================
💡 GLOBAL-LOCAL HISTORICAL INFLUENCE DISCOVERY
================================================================================

📌 Local Event: Migration of South Indian Tamil Labor to Plantations
   Exhibit: Labor History Exhibit
   Date: 1840-01-01
   Location: Sri Lanka (Hill Country)

📊 Discovery Statistics:
   Total Candidates: 2
   High Confidence (>0.7): 1
   Medium Confidence (0.5-0.7): 1
   Low Confidence (<0.5): 0

================================================================================
🌍 TOP GLOBAL INFLUENCES
================================================================================

--------------------------------------------------------------------------------
Influence #1
--------------------------------------------------------------------------------

🌍 Global Cause: British Colonial Expansion
   Date: 1850-01-01
   Location: Global
   Description: Expansion of British colonial empire and economic control

📊 Influence Metrics:
   Causal Strength: 0.75
   Reliability Score: 79.5/100
   Final Score: 0.77
   Mechanism: colonial_control

🔍 Reliability Components:
   Directness (D): 0.80
   Source Consistency (S): 0.67
   Temporal Proximity (T): 0.90
   Evidence Strength: 0.70

✓ Constraint Checks:
   Temporal Order: ✓ (Note: Event happened before global event, but still plausible due to ongoing colonial expansion)
   Geographic Plausibility: ✓
   Source Consistency: ✓

🔗 Explanation Paths:
   Path 1 (Score: 0.73):
      British Colonial Expansion → Plantation Economy → Migration of South Indian Tamil Labor to Plantations

--------------------------------------------------------------------------------
Influence #2
--------------------------------------------------------------------------------

🌍 Global Cause: Industrial Revolution
   Date: 1760-01-01
   Location: Europe
   Description: Technological and economic transformation creating global demand for commodities

📊 Influence Metrics:
   Causal Strength: 0.65
   Reliability Score: 72.3/100
   Final Score: 0.68
   Mechanism: economic_shift

🔍 Reliability Components:
   Directness (D): 0.70
   Source Consistency (S): 0.60
   Temporal Proximity (T): 0.95
   Evidence Strength: 0.65

✓ Constraint Checks:
   Temporal Order: ✓
   Geographic Plausibility: ✓
   Source Consistency: ✓

🔗 Explanation Paths:
   Path 1 (Score: 0.65):
      Industrial Revolution → Commodity Demand → Migration of South Indian Tamil Labor to Plantations

================================================================================
```

---

## Key Features Demonstrated

1. **Reliability Scores**: Calculated using R = w_d×D + w_s×S + w_t×T formula
2. **Mechanism Types**: trade_shock, economic_shift, colonial_control, technology, policy
3. **Constraint Checks**: Temporal order, geographic plausibility, source consistency
4. **Explanation Paths**: Multi-hop reasoning showing how global events influenced local events
5. **Evidence Strength**: Weighted by source type (archive > book > wikipedia)

---

## Notes

- **Reliability scores** are calculated automatically based on:
  - Directness (D): From edge data (0.0-1.0)
  - Source Consistency (S): actual_sources / max_sources
  - Temporal Proximity (T): e^(-years_between_events)

- **Mechanism types** are predicted based on event keywords and descriptions

- **Explanation paths** show the causal chain from global to local event

- **Constraint checks** ensure only historically plausible connections are shown

These examples show what your system should produce when working correctly!

