import subprocess
import time
import os
import webbrowser
import sys

def run_command(command, cwd, title):
    """Run a command in a new terminal window"""
    print(f"🚀 Starting {title}...")
    # Verify the directory exists
    if not os.path.isdir(cwd):
        print(f"❌ Error: Directory does not exist: {cwd}")
        return
    if sys.platform == 'win32':
        # Windows: Use start command to open new terminal
        # Properly quote the working directory path
        subprocess.Popen(f'start "{title}" cmd /k "cd /d "{cwd}" && {command}"', shell=True)
    else:
        # Linux/Mac: Different approach (simplified for now)
        subprocess.Popen(command, shell=True, cwd=cwd)

def main():
    base_dir = os.getcwd()
    print(f"📂 Working Directory: {base_dir}")
    print("="*80)
    print("      SRI LANKAN HERITAGE SYSTEM - UNIFIED LAUNCHER      ")
    print("="*80)
    print("\n📋 System Components:")
    print("   1. Artifact Comparison Backend  (Port 5000)")
    print("   2. Scenario Generation Backend  (Port 5001)")
    print("   3. Unified Frontend             (Port 5173)  ← All 3 components")
    print("   4. Admin / Moderation Server    (Port 5002)")
    print("   5. Admin Panel Frontend         (Port 5175)")
    print("   6. Dashboard Server             (Port 8000)")
    print("="*80)
    print()

    # 1. Start Artifact Comparison Backend
    # Port: 5000
    run_command(
        "python app.py", 
        os.path.join(base_dir, "Atifact_Comparison_Component"),
        "Component 2 Backend (Comparison)"
    )

    # 2. Start Artifact Comparison Frontend — REMOVED
    # Now served by the Unified Frontend (Port 5173)

    # 3. Start Scenario Generation (RAG Chat) Backend
    # Port: 5001
    run_command(
        "python rag_api_server_fine_tuned.py", 
        os.path.join(base_dir, "Scenario_Generation"),
        "Basiii Backend (RAG Chat)"
    )

    # 4. Start Scenario Generation Frontend — REMOVED
    # 5. Start Craft Simulation Frontend — REMOVED
    # Both are now served by the Unified Frontend below.

    # 3b. Start Unified Frontend (Comparison + Scenario + Craft on one server)
    # Port: 5173
    run_command(
        "npm run dev",
        os.path.join(base_dir, "frontend"),
        "Unified Frontend (All 3 Components)"
    )

    # 4. Start Admin / Moderation Server
    # Port: 5002
    run_command(
        "python admin_server.py",
        base_dir,
        "Admin Moderation Server (Port 5002)"
    )

    # 5. Start Admin Panel React Frontend
    # Port: 5175
    run_command(
        "npm run dev",
        os.path.join(base_dir, "admin_panel", "frontend"),
        "Admin Panel Frontend (Port 5175)"
    )

    # 6. Start Dashboard HTTP Server (to allow cross-origin navigation)
    # Port: 8000
    run_command(
        "python -m http.server 8000",
        base_dir,
        "Dashboard Server"
    )

    print("\n⏳ Waiting for servers to initialize...")
    time.sleep(10)  # Wait for servers to spin up

    # Open the Dashboard via HTTP (prevents browser security blocks)
    dashboard_url = "http://localhost:8000/main_dashboard.html"
    print(f"✨ Opening Dashboard: {dashboard_url}")
    webbrowser.open(dashboard_url)

if __name__ == "__main__":
    main()
