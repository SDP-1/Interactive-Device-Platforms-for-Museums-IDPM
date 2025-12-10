import time
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from artifact_ai_explainer import ArtifactAIExplainer

def test_speed():
    print("Initializing Explainer...")
    start_init = time.time()
    explainer = ArtifactAIExplainer()
    print(f"Initialization took: {time.time() - start_init:.2f} seconds")

    dummy_artifact = {
        'name': 'Ancient Clay Pot',
        'category': 'Pottery',
        'origin': 'Sri Lanka',
        'era': 'Anuradhapura Kingdom',
        'materials': 'Clay, Terracotta',
        'function': 'Water storage',
        'symbolism': 'Daily life utility',
        'notes': 'Found near ancient ruins'
    }

    print("\nGenerating Explanation 1 (Cold/Warm Start)...")
    start_gen1 = time.time()
    explanation1 = explainer.explain(dummy_artifact)
    time_gen1 = time.time() - start_gen1
    print(f"Generation 1 took: {time_gen1:.2f} seconds")
    print(f"Output length: {len(explanation1)}")

    print("\nGenerating Explanation 2 (Testing Cache if implemented)...")
    start_gen2 = time.time()
    explanation2 = explainer.explain(dummy_artifact)
    time_gen2 = time.time() - start_gen2
    print(f"Generation 2 took: {time_gen2:.2f} seconds")
    
    if time_gen2 < 0.1:
        print("✓ Caching appears to be working!")
    else:
        print("⚠ Caching not active or effective.")

if __name__ == "__main__":
    test_speed()
