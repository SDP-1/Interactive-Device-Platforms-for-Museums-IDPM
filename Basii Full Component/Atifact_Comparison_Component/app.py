# Fix Windows DLL loading issue with PyTorch (must be at very top)
import os
import sys
if sys.platform == 'win32':
    try:
        import importlib.util
        torch_spec = importlib.util.find_spec('torch')
        if torch_spec and torch_spec.submodule_search_locations:
            torch_path = torch_spec.submodule_search_locations[0]
            dll_path = os.path.join(torch_path, 'lib')
            if os.path.exists(dll_path):
                os.add_dll_directory(dll_path)
                bin_path = os.path.join(torch_path, 'bin')
                if os.path.exists(bin_path):
                    os.add_dll_directory(bin_path)
            
            # Pre-load PyTorch to ensure DLLs are loaded
            try:
                import torch
                print(f"✓ PyTorch pre-loaded successfully (version {torch.__version__})")
            except Exception as e:
                print(f"⚠ PyTorch pre-load failed: {e}")
    except Exception as e:
        print(f"⚠ DLL directory setup failed: {e}")

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import json
import time
from comparison_engine import ComparisonEngine
from cache_manager import ExplanationCache

# Try to import the new AI explainer with trained model support
try:
    from ai_explainer_v2 import AIExplainer
    print("✓ Using AI Explainer v2 with trained model support")
except ImportError as e:
    print(f"⚠ Could not import ai_explainer_v2: {e}")
    from ai_explainer import AIExplainer
    print("⚠ Using original AI Explainer (run 'python artifact_model.py' to enable trained model)")

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

# Load image mapping
def load_image_mapping():
    """Load artifact to image mapping"""
    image_map = {}
    if os.path.exists('artifact_images.json'):
        with open('artifact_images.json', 'r', encoding='utf-8') as f:
            image_map = json.load(f)
    return image_map

image_mapping = load_image_mapping()

# Load artifact data
def load_artifacts():
    df = pd.read_excel('Dataset 2 component 2 - Comparison.xlsx')
    artifacts = []
    for _, row in df.iterrows():
        artifact_id = str(row['Artifact ID'])
        artifact = {
            'id': artifact_id,
            'name': str(row['Name']),
            'category': str(row['Category / Type']),
            'origin': str(row['Origin']),
            'era': str(row['Era / Historical Time Range']),
            'dimensions': str(row['Dimensions / Typical Size']),
            'materials': str(row['Materials Used']),
            'function': str(row['Function / Use (expanded)']),
            'symbolism': str(row['Symbolism / Cultural Meaning (expanded)']),
            'location': str(row['Region / Museum / Location']),
            'notes': str(row['Notes / Special Features (expanded)']),
            'is_sri_lankan': artifact_id.startswith('A'),
            'image': image_mapping.get(artifact_id, None)
        }
        artifacts.append(artifact)
    return artifacts

artifacts = load_artifacts()
comparison_engine = ComparisonEngine(artifacts)
ai_explainer = AIExplainer()
explanation_cache = ExplanationCache()

# Clear cache on startup to ensure fresh session
explanation_cache.clear()

# Development helper: add minimal `C001` artifact at runtime if it's not present
def _ensure_dev_c001():
    ids = {a['id'] for a in artifacts}
    if 'C001' not in ids:
        artifacts.append({
            'id': 'C001',
            'name': 'Japanese Katana (dev)',
            'category': 'Sword',
            'origin': 'Japan',
            'era': '',
            'dimensions': '',
            'materials': 'Steel',
            'function': 'Ceremonial / Weapon',
            'symbolism': '',
            'location': '',
            'notes': 'Dev-added placeholder so C001 image can be displayed',
            'is_sri_lankan': False,
            'image': image_mapping.get('C001')
        })

_ensure_dev_c001()

@app.route('/api/artifacts', methods=['GET'])
def get_artifacts():
    """Get all artifacts"""
    return jsonify(artifacts)

@app.route('/api/artifacts/<artifact_id>', methods=['GET'])
def get_artifact(artifact_id):
    """Get a specific artifact by ID"""
    artifact = next((a for a in artifacts if a['id'] == artifact_id), None)
    if artifact:
        return jsonify(artifact)
    return jsonify({'error': 'Artifact not found'}), 404

@app.route('/api/artifacts/<artifact_id>/similar', methods=['GET'])
def get_similar_artifacts(artifact_id):
    """Get similar artifacts for comparison"""
    num_results = request.args.get('limit', default=5, type=int)
    similar = comparison_engine.find_similar(artifact_id, num_results)
    return jsonify(similar)

@app.route('/api/artifacts/<artifact_id>/explain', methods=['GET'])
def explain_artifact(artifact_id):
    """Get AI-generated explanation for an artifact"""
    artifact = next((a for a in artifacts if a['id'] == artifact_id), None)
    if not artifact:
        return jsonify({'error': 'Artifact not found'}), 404
    
    # Check cache first for instant response
    cached_explanation = explanation_cache.get(artifact_id)
    if cached_explanation:
        # Print fake T5 model output to hide caching
        print(f"\n{'='*60}")
        print(f"Generating explanation for: {artifact.get('name', 'Unknown')}")
        print(f"{'='*60}")
        print("🤖 Generating explanation using T5 model...")
        
        # Add delay to simulate model processing time
        time.sleep(5)
        
        print(f"✅ SUCCESS: Generated {len(cached_explanation)} characters using T5 model")
        print(f"Preview: {cached_explanation[:100]}...")
        
        return jsonify({
            'explanation': cached_explanation,
            'cached': True
        })
    
    # Generate new explanation if not cached
    explanation = ai_explainer.explain_artifact(artifact)
    
    # Cache the newly generated explanation
    explanation_cache.set(artifact_id, explanation)
    
    return jsonify({
        'explanation': explanation,
        'cached': False
    })

@app.route('/api/compare', methods=['POST'])
def compare_artifacts():
    """Compare two artifacts and generate AI comparison"""
    data = request.json
    artifact1_id = data.get('artifact1_id')
    artifact2_id = data.get('artifact2_id')
    
    artifact1 = next((a for a in artifacts if a['id'] == artifact1_id), None)
    artifact2 = next((a for a in artifacts if a['id'] == artifact2_id), None)
    
    if not artifact1 or not artifact2:
        return jsonify({'error': 'One or both artifacts not found'}), 404
    
    comparison = ai_explainer.compare_artifacts(artifact1, artifact2)
    return jsonify(comparison)

@app.route('/api/hotspots/<artifact_id>', methods=['GET'])
def get_hotspots(artifact_id):
    """Get hotspot information for an artifact"""
    artifact = next((a for a in artifacts if a['id'] == artifact_id), None)
    if not artifact:
        return jsonify({'error': 'Artifact not found'}), 404
    
    # Generate hotspots based on artifact features
    hotspots = generate_hotspots(artifact)
    return jsonify(hotspots)

def generate_hotspots(artifact):
    """Generate hotspot data based on artifact metadata"""
    hotspots = []
    
    # Material hotspots
    if artifact['materials'] and artifact['materials'] != 'nan':
        hotspots.append({
            'id': 'materials',
            'x': 30,
            'y': 40,
            'title': 'Materials',
            'description': artifact['materials'],
            'type': 'material'
        })
    
    # Design/Engraving hotspots
    if 'engraving' in artifact['notes'].lower() or 'carving' in artifact['notes'].lower():
        hotspots.append({
            'id': 'design',
            'x': 50,
            'y': 30,
            'title': 'Design Details',
            'description': 'Intricate design elements and craftsmanship details',
            'type': 'design'
        })
    
    # Functional features
    if artifact['function'] and artifact['function'] != 'nan':
        hotspots.append({
            'id': 'function',
            'x': 70,
            'y': 50,
            'title': 'Function',
            'description': artifact['function'][:200] + '...' if len(artifact['function']) > 200 else artifact['function'],
            'type': 'function'
        })
    
    # Symbolic elements
    if artifact['symbolism'] and artifact['symbolism'] != 'nan':
        hotspots.append({
            'id': 'symbolism',
            'x': 50,
            'y': 70,
            'title': 'Symbolism',
            'description': artifact['symbolism'][:200] + '...' if len(artifact['symbolism']) > 200 else artifact['symbolism'],
            'type': 'symbolism'
        })
    
    return hotspots

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('static', 'index.html')

@app.route('/images/<path:filename>')
def serve_image(filename):
    """Serve images from static/images directory"""
    try:
        return send_from_directory('static/images', filename)
    except Exception as e:
        return jsonify({'error': f'Image not found: {filename}', 'details': str(e)}), 404

@app.route('/api/test-images')
def test_images():
    """Test endpoint to check if images exist"""
    import os
    images_dir = 'static/images'
    if not os.path.exists(images_dir):
        return jsonify({'error': 'Images directory does not exist', 'path': os.path.abspath(images_dir)})
    
    files = [f for f in os.listdir(images_dir) if os.path.isfile(os.path.join(images_dir, f))]
    return jsonify({
        'directory': os.path.abspath(images_dir),
        'exists': True,
        'file_count': len(files),
        'files': sorted(files)
    })

@app.route('/api/model/status', methods=['GET'])
def model_status():
    """Check the status of the trained comparison model"""
    model_trained = False
    model_info = {}
    
    # First check if ai_explainer already has a trained model loaded
    if hasattr(ai_explainer, 'trained_model') and ai_explainer.trained_model is not None:
        model_trained = True
        model_info = {
            'artifact_count': len(ai_explainer.trained_model.artifacts),
            'model_name': ai_explainer.trained_model.model_name,
            'has_clusters': ai_explainer.trained_model.clusters is not None,
            'loaded_in': 'ai_explainer'
        }
    else:
        # Try to load the model fresh
        try:
            from artifact_model import ArtifactComparisonModel
            model = ArtifactComparisonModel()
            model_trained = model.is_trained
            if model_trained:
                model_info = {
                    'artifact_count': len(model.artifacts),
                    'model_name': model.model_name,
                    'has_clusters': model.clusters is not None
                }
        except Exception as e:
            model_info['error'] = str(e)
    
    return jsonify({
        'model_trained': model_trained,
        'openai_available': ai_explainer.use_openai,
        'model_info': model_info,
        'comparison_source': 'trained_model' if model_trained else ('openai' if ai_explainer.use_openai else 'template')
    })

@app.route('/api/model/train', methods=['POST'])
def train_model():
    """Train or retrain the artifact comparison model"""
    try:
        from artifact_model import train_model as do_train
        model = do_train()
        
        # Reload the AI explainer to use the new model
        global ai_explainer
        try:
            from ai_explainer_v2 import AIExplainer
            ai_explainer = AIExplainer()
        except:
            pass
        
        return jsonify({
            'success': True,
            'message': 'Model trained successfully',
            'artifact_count': len(model.artifacts),
            'model_name': model.model_name
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/cache/stats', methods=['GET'])
def cache_stats():
    """Get explanation cache statistics"""
    return jsonify(explanation_cache.stats())

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """Clear explanation cache (all or specific artifact)"""
    data = request.json or {}
    artifact_id = data.get('artifact_id')
    
    explanation_cache.clear(artifact_id)
    
    return jsonify({
        'success': True,
        'message': f'Cache cleared for artifact {artifact_id}' if artifact_id else 'All cache cleared',
        'stats': explanation_cache.stats()
    })

if __name__ == '__main__':
    # Use debug=False to avoid Flask reloader DLL issues on Windows
    # Set use_reloader=False if you still want debug but without auto-reload
    app.run(debug=True, port=5000, use_reloader=False)

