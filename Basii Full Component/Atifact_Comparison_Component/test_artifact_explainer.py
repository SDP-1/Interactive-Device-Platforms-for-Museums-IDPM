import json
from artifact_ai_explainer import ArtifactAIExplainer

# Load all artifacts from your dataset
with open('trained_model/artifact_metadata.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    artifacts = data['artifacts']

explainer = ArtifactAIExplainer()

print(f"Testing AI Explainer on {len(artifacts)} artifacts...\n")

# Test all artifacts
for i, artifact in enumerate(artifacts):
    print(f"\n{'='*80}")
    print(f'Artifact {i+1}/{len(artifacts)}: {artifact["name"]}')
    print(f'Category: {artifact["category"]}')
    print(f'Origin: {artifact["origin"]}')
    print('='*80)
    explanation = explainer.explain(artifact)
    print(explanation)
    print(f"{'='*80}\n")
    
    # Add a pause every 5 artifacts for readability
    if (i + 1) % 5 == 0 and (i + 1) < len(artifacts):
        input("Press Enter to continue to next batch...")

print(f"\n\nCompleted testing all {len(artifacts)} artifacts!")
