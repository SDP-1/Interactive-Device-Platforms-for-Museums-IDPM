# Basi-Component2: Complete System Architecture & Operation Guide

This document provides a comprehensive explanation of how the Basi-Component2 system works, from its core architecture to the specific AI models used, setup instructions, and UI integration.

---

## 1. System Architecture Overview

The system allows users to view cultural artifacts, find semantically similar items, and generate AI-powered explanations. It is built as a **Hybrid AI Web Application**.

### High-Level Diagram
```mermaid
graph TD
    User[User (Browser)] <--> Frontend[React Frontend (Port 5173)]
    Frontend <--> API[Flask Backend API (Port 5000)]
    
    subgraph "The Two Intelligence Engines"
        API --> ExplanationEngine[Explanation Engine]
        API --> ComparisonEngine[Comparison Engine]
    end
    
    subgraph "Explanation Pipeline"
        ExplanationEngine --> T5[Model A: T5 Neural Network]
        ExplanationEngine --> OpenAI[Model B: OpenAI GPT (Optional)]
        ExplanationEngine --> Template[Fallback: Templates]
    end
    
    subgraph "Comparison Pipeline"
        ComparisonEngine --> SBERT[Model C: Sentence Transformers]
        ComparisonEngine --> TFIDF[Fallback: TF-IDF]
    end
    
    ComparisonEngine <--> Subprocess[Model Service (Subprocess)]
```

---

## 2. The Two Core "Models" (Intelligence Engines)

The user inquiry often refers to "two models". Functionally, the system has two distinct "brains":

### Brain 1: The Comparison Engine (Finding Similar Items)
*   **Goal**: "Find me other artifacts that are like this one."
*   **Technical Implementation**:
    *   **Primary Model**: **Sentence Transformers (`all-MiniLM-L6-v2`)**.
    *   **How it works**: It converts artifact descriptions into 384-dimensional vectors. It "understands" that a "Ceremonial Sword" is similar to a "Royal Dagger" even if words don't match exactly.
    *   **Execution**: Runs in a separate subprocess (`model_service.py`) to avoid Windows DLL conflicts and memory issues.
    *   **File**: `artifact_model.py`

### Brain 2: The Explanation Engine (Generating Text)
*   **Goal**: "Write a detailed academic analysis of this artifact."
*   **Technical Implementation**:
    *   **Primary Model**: **T5-Base (`google/t5-v1_1-base`)**.
    *   **How it works**: A structured sequence-to-sequence model fine-tuned specifically on your artifact dataset. It generates text sections (Overview, Materials, Function, etc.).
    *   **Execution**: integrated directly into Flask (`ai_explainer_v2.py`).
    *   **File**: `ai_explainer_v2.py` / `artifact_ai_explainer.py`

---

## 3. How the UI Integrates with the Models

The Frontend is built with **React**. Here is the exact data flow when a user interacts with the system:

### Scenario A: Generating an Explanation
1.  **User Action**: User clicks the **"✨ Generate AI Explanation"** button.
2.  **Frontend**: `DetailScreen.jsx` calls `GET /api/artifacts/<id>/explain`.
3.  **Backend**: 
    - `app.py` receives request.
    - Calls `ai_explainer_v2.py`.
    - Checks priority: **T5** → OpenAI → Template.
    - Loads T5 model (if not loaded) and generates text.
4.  **Response**: Returns JSON `{ "explanation": "Overview\nThis artifact..." }`.
5.  **Frontend Rendering**:
    - React receives the text.
    - **Smart Formatting**: It splits the text by headers (e.g., "Overview", "Materials").
    - Renders each section with bold formatting.

### Scenario B: Finding Similar Artifacts
1.  **User Action**: User views an artifact.
2.  **Frontend**: Automatically calls `GET /api/artifacts/<id>/similar`.
3.  **Backend**:
    - Sends request to `model_service.py` subprocess.
    - `artifact_model.py` calculates dot-product similarity between vectors.
    - Returns top 5 matches.
4.  **Frontend**: Displays "Similar Artifacts" cards.

---

## 4. Setup From Scratch (New Machine)

To set this up on a fresh machine (Windows), follow this exact order to avoid the "DLL Error".

### Step 1: Install Python & Node.js
- Install Python 3.10 or 3.11.
- Install Node.js v18+.

### Step 2: Backend Setup
Open a terminal in the project root:

1.  **Create Environment**:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```

2.  **Install PyTorch (Windows CPU Version)** - *CRITICAL!*
    ```bash
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
    ```

3.  **Install Other Libraries**:
    ```bash
    pip install -r requirements.txt
    pip install transformers sentence-transformers
    ```

4.  **Setup Data**:
    ```bash
    python copy_images.py
    ```

### Step 3: Train the Models (The "Brains")
You must "teach" the system before running it.

1.  **Train Comparison Brain**:
    ```bash
    python artifact_model.py
    ```
    *Creates `trained_model/` folder.*

2.  **Train Explanation Brain (T5)**:
    ```bash
    python train_artifact_explainer.py
    ```
    *Creates `t5_artifact_explainer/` folder (Takes ~15-30 mins).*

### Step 4: Frontend Setup
Open a *new* terminal in `comparison_component/frontend` (or just `frontend`):

1.  **Install Dependencies**:
    ```bash
    cd frontend
    npm install
    ```

---

## 5. How to Run the System

You need **two terminals** running at the same time.

**Terminal 1: The Backend (API)**
```bash
# In project root
python app.py
```
*Wait for "Running on http://127.0.0.1:5000"*

**Terminal 2: The Frontend (UI)**
```bash
# In frontend folder
npm run dev
```
*Wait for "Local: http://localhost:5173"*

**Access**: Open your browser to `http://localhost:5173`.

---

## 6. Verification Checklist

How do you know it's working fully?

1.  **Comparison Check**: Click an artifact. Do you see "Similar Artifacts" at the bottom?
    - *Yes*: Comparison Engine (Sentence Transformers) is working.
2.  **Explanation Check**: Click "Generate AI Explanation". Does it take ~5-10 seconds (first time) and produce text?
    - *Yes*: Explanation Engine (T5) is working.
    - *Note*: If it's instant (<1s) and generic, it might be using the Template fallback. Check `app.py` terminal logs for "✅ SUCCESS: Generated... using T5 model".
