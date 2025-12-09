import time
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from ai_explainer_v2 import AIExplainer

def test_preload():
    print("Initializing AIExplainer (should be instant)...")
    start_init = time.time()
    explainer = AIExplainer(preload_model=True)
    init_time = time.time() - start_init
    print(f"Initialization took: {init_time:.2f} seconds")
    
    if init_time > 1.0:
        print("❌ Initialization blocked! Background loading failed.")
    else:
        print("✓ Initialization was non-blocking.")

    print("\nWaiting for background model to load (timeout 60s)...")
    for i in range(60):
        if explainer._model_ready:
            print(f"✓ Model ready after {i} seconds!")
            break
        time.sleep(1)
        if i % 5 == 0:
            print(f"   ... still loading ({i}s)")
            
    if not explainer._model_ready:
        print("❌ Model failed to load in background.")
        return

    print("\nTesting Explanation (should be instant due to warm-up)...")
    start_gen = time.time()
    # Dummy artifact
    artifact = {
        'name': 'Test Artifact', 'category': 'Test', 'origin': 'Test', 
        'era': 'Test', 'materials': 'Test', 'function': 'Test', 
        'symbolism': 'Test', 'notes': 'Test'
    }
    explainer.explain_artifact(artifact)
    gen_time = time.time() - start_gen
    print(f"Explanation took: {gen_time:.2f} seconds")

if __name__ == "__main__":
    test_preload()
