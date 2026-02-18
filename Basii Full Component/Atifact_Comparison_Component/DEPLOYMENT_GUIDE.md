# Basi-Component2 Deployment Guide

## 1. Prerequisites
- **OS**: Windows 10/11 (Recommended) or Linux/Mac
- **Python**: Version 3.10 or 3.11 (Recommended)
- **Node.js**: Version 18+ (for frontend)
- **Disk Space**: ~2GB free space (for T5 model)

## 2. Backend Setup (Flask + AI Models)

### Step A: Clone & Environment
1. Copy the project folder to the new machine
2. Open terminal in `Basi-Component2` folder
3. Create virtual environment (Recommended):
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```

### Step B: Install Dependencies (CRITICAL)
**Do NOT just run `pip install -r requirements.txt`.** You must install PyTorch specially for the T5 model to work on Windows.

1. **Install PyTorch (Windows CPU version):**
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
   ```
   *(Note: This avoids the "DLL initialization failed" error)*

2. **Install Other Dependencies:**
   ```bash
   pip install -r requirements.txt
   pip install transformers sentence-transformers flask flask-cors pandas openpyxl
   ```

### Step C: Setup Data
1. Ensure `Dataset 2 component 2 - Comparison.xlsx` is in the root folder
2. Run image setup:
   ```bash
   python copy_images.py
   ```

### Step D: Train Models (One-Time Setup)

1. **Train Comparison Model** (Required for "Similar Artifacts"):
   ```bash
   python artifact_model.py
   ```
   *Expected Output*: "Training complete!" and new `trained_model/` folder.

2. **Train T5 Explanation Model** (Required for "Generate AI Explanation"):
   ```bash
   python train_artifact_explainer.py
   ```
   *Time*: 15-45 minutes
   *Note*: If you don't want to wait, you can copy the `t5_artifact_explainer/` folder from the old machine to the new one.

## 3. Frontend Setup (React)

1. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build for production (Optional - for deployment):
   ```bash
   npm run build
   ```
   *This creates a `dist` folder with static files.*

## 4. Running the System

You need two terminals running simultaneously:

**Terminal 1 (Backend):**
```bash
python app.py
```
*Wait until you see "✓ T5 model loaded successfully!" or "Running on http://127.0.0.1:5000"*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Then open browser at: `http://localhost:5173`

## 5. Troubleshooting

**Issue: "DLL initialization failed"**
- **Fix**: You installed standard PyTorch. Uninstall it (`pip uninstall torch`) and reinstall the CPU version (Step 2B).

**Issue: "Generate AI Explanation" button spins forever**
- **Check**: Look at the backend terminal. Is T5 downloading? First run takes longer.
- **Fix**: Restart `app.py` to reset the model loader.

**Issue: Images not showing**
- **Fix**: Run `python copy_images.py` again to refresh `artifact_images.json`.
