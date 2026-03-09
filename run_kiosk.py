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
    print("      SRI LANKAN HERITAGE SYSTEM - FULL KIOSK LAUNCHER      ")
    print("="*80)
    print("\n📋 System Components:")
    print("   1. [Basii] Comparison Backend (Port 5000)")
    print("   2. [Basii] Scenario Backend (Port 5001)")
    print("   3. [Basii] Unified Frontend  (Port 5173)  ← Comparison + Scenario + Craft")
    print("   4. [Basii] Admin Server (Port 5002)")
    print("   5. [Basii] Admin Frontend (Port 5175)")
    print("   6. Unified Kiosk Server (Port 8000)")
    print("="*80)
    print()

    # BASII COMPONENTS
    basii_dir = os.path.join(base_dir, "Basii Full Component")

    # 1. Start Artifact Comparison Backend
    run_command(
        "python app.py", 
        os.path.join(basii_dir, "Atifact_Comparison_Component"),
        "Basii - Comparison Backend"
    )

    # 2. Start Scenario Generation Backend
    run_command(
        "python rag_api_server_fine_tuned.py", 
        os.path.join(basii_dir, "Scenario_Generation"),
        "Basii - Scenario Backend"
    )

    # 3. Start Unified Frontend (Comparison + Scenario + Craft)
    run_command(
        "npm run dev",
        os.path.join(basii_dir, "frontend"),
        "Basii - Unified Frontend (All 3 Components)"
    )

    # 4. Start Admin / Moderation Server
    run_command(
        "python admin_server.py",
        basii_dir,
        "Basii - Admin Server"
    )

    # 5. Start Admin Panel React Frontend
    run_command(
        "npm run dev",
        os.path.join(basii_dir, "admin_panel", "frontend"),
        "Basii - Admin Frontend"
    )

    # 6. Start Kiosk HTTP Server (Root Directory)
    run_command(
        "python -m http.server 8000",
        base_dir,
        "Kiosk Unified Server"
    )

    print("\n⏳ Waiting for servers to initialize...")
    time.sleep(10)

    # Open the Unified Kiosk Home Page
    kiosk_url = "http://localhost:8000/kiosk_home.html"
    print(f"✨ Opening Kiosk Home: {kiosk_url}")
    webbrowser.open(kiosk_url)

if __name__ == "__main__":
    main()
