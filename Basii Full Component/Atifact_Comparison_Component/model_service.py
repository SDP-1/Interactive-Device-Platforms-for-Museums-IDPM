"""
Model Service - Runs the trained model in a separate process to avoid DLL conflicts
This service provides model inference via JSON input/output through stdin/stdout
"""

import sys
import json
import os

# Ensure output is unbuffered
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

def main():
    """Process comparison requests from stdin"""
    try:
        # Change to script directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        
        from artifact_model import ArtifactComparisonModel
        
        # Load the model once
        model = ArtifactComparisonModel()
        
        if not model.is_trained:
            print(json.dumps({"error": "Model not trained"}))
            sys.stdout.flush()
            return
        
        # Signal ready
        print(json.dumps({"status": "ready", "artifacts": len(model.artifacts)}))
        sys.stdout.flush()
        
        # Process requests from stdin
        for line in sys.stdin:
            try:
                line = line.strip()
                if not line:
                    continue
                    
                request = json.loads(line)
                action = request.get("action")
                
                if action == "compare":
                    artifact1_id = request.get("artifact1_id")
                    artifact2_id = request.get("artifact2_id")
                    result = model.compare_artifacts(artifact1_id, artifact2_id)
                    result["source"] = "trained_model"
                    print(json.dumps(result, default=str))
                    sys.stdout.flush()
                    
                elif action == "similar":
                    artifact_id = request.get("artifact_id")
                    top_k = request.get("top_k", 5)
                    result = model.find_similar(artifact_id, top_k)
                    print(json.dumps(result, default=str))
                    sys.stdout.flush()
                    
                elif action == "status":
                    print(json.dumps({
                        "model_trained": model.is_trained,
                        "artifact_count": len(model.artifacts),
                        "model_name": model.model_name
                    }))
                    sys.stdout.flush()
                    
                elif action == "quit":
                    break
                    
                else:
                    print(json.dumps({"error": f"Unknown action: {action}"}))
                    sys.stdout.flush()
                    
            except json.JSONDecodeError as e:
                print(json.dumps({"error": f"Invalid JSON: {e}"}))
                sys.stdout.flush()
            except Exception as e:
                print(json.dumps({"error": str(e)}))
                sys.stdout.flush()
                
    except Exception as e:
        print(json.dumps({"error": f"Service startup failed: {e}"}))
        sys.stdout.flush()


if __name__ == "__main__":
    main()
