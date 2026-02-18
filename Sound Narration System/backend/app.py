"""
Flask Backend API for Sri Lankan Historical Events Q&A System
With Vector Database for Video Matching
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add parent directory to path to import inference
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.inference_structured import SriLankanHistoryQA
from services.video_db import get_video_db

app = Flask(__name__)

# Configure CORS explicitly for all routes
CORS(app, 
     resources={r"/api/*": {"origins": "*"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"])

# Initialize Q&A system
print("Initializing Sri Lankan History Q&A System...")
qa_system = SriLankanHistoryQA()
print("System ready!")

# Initialize Video Vector Database
print("Initializing Video Vector Database...")
video_db = get_video_db()
print("Video DB ready!")

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok", 
        "message": "Sri Lankan History Q&A API is running",
        "video_count": video_db.collection.count()
    })

@app.route('/api/ask', methods=['POST', 'OPTIONS'])
def ask_question():
    """Ask a question about Sri Lankan history"""
    # OPTIONS request is handled automatically by flask-cors
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        data = request.get_json()
        
        if not data or 'question' not in data:
            return jsonify({"error": "Please provide a question"}), 400
        
        question = data['question'].strip()
        
        if not question:
            return jsonify({"error": "Question cannot be empty"}), 400
        
        # Generate answer
        story, info = qa_system.generate_story(question)
        
        # Find matching video using vector search
        print(f"\n🔍 Searching for video matching: '{question[:50]}...'")
        video_match = video_db.find_video(question, story)
        
        if video_match:
            print(f"✓ Found video: {video_match['video_id']} (similarity: {video_match['similarity']})")
        else:
            print("✗ No matching video found")
        
        response = jsonify({
            "question": question,
            "answer": story,
            "info": info,
            "video": video_match,  # Will be None if no match
            "success": True
        })
        return response
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/example-questions', methods=['GET', 'OPTIONS'])
def example_questions():
    """Get example questions from structured dataset"""
    # OPTIONS request is handled automatically by flask-cors
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        # Get example questions from the Q&A system's dataset
        import pandas as pd
        dataset_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sri_lankan_historical_events_structured.csv')
        
        if os.path.exists(dataset_path):
            df = pd.read_csv(dataset_path)
            examples = []
            
            # Get first question variation from each event
            for _, row in df.iterrows():
                questions = [q.strip() for q in row['question_variations'].split('|') if q.strip()]
                if questions:
                    examples.append(questions[0])  # Take first question from each event
            
            # Limit to only 3 examples
            return jsonify({"examples": examples[:3]})
        else:
            # Fallback if dataset not found
            examples = [
                "What is the Anuradhapura Kingdom?",
                "Tell me about Sigiriya",
                "When did Sri Lanka get independence?"
            ]
            return jsonify({"examples": examples})
    except Exception as e:
        # Fallback on error
        examples = [
            "What is the Anuradhapura Kingdom?",
            "Tell me about Sigiriya",
            "When did Sri Lanka get independence?"
        ]
        return jsonify({"examples": examples})

# ============== Video Management Endpoints ==============

@app.route('/api/videos', methods=['GET', 'OPTIONS'])
def list_videos():
    """List all videos in the database"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    videos = video_db.list_all_videos()
    return jsonify({
        "videos": videos, 
        "count": len(videos),
        "success": True
    })

@app.route('/api/videos', methods=['POST'])
def add_video():
    """Add a new video to the database"""
    try:
        data = request.get_json()
        
        required = ['id', 'path', 'description', 'topics']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({
                "error": f"Missing required fields: {missing}",
                "required": required
            }), 400
        
        video_db.add_video(
            video_id=data['id'],
            video_path=data['path'],
            description=data['description'],
            topics=data['topics'],
            poster_path=data.get('poster'),
            era=data.get('era')
        )
        
        return jsonify({
            "success": True, 
            "message": f"Video '{data['id']}' added successfully",
            "total_videos": video_db.collection.count()
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/videos/<video_id>', methods=['DELETE', 'OPTIONS'])
def delete_video(video_id):
    """Delete a video from the database"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        video_db.delete_video(video_id)
        return jsonify({
            "success": True, 
            "message": f"Video '{video_id}' deleted",
            "total_videos": video_db.collection.count()
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/videos/seed', methods=['POST', 'OPTIONS'])
def seed_videos():
    """Seed the database with sample videos"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        video_db.seed_sample_videos()
        return jsonify({
            "success": True,
            "message": "Sample videos seeded",
            "total_videos": video_db.collection.count()
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/videos/search', methods=['POST', 'OPTIONS'])
def search_videos():
    """Search for videos matching a query (for testing)"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        data = request.get_json()
        query = data.get('query', '')
        n_results = data.get('n_results', 3)
        
        if not query:
            return jsonify({"error": "Please provide a query"}), 400
        
        videos = video_db.find_videos(query, n_results=n_results)
        
        return jsonify({
            "query": query,
            "videos": videos,
            "count": len(videos),
            "success": True
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🇱🇰 Sri Lankan History Q&A API Server")
    print("="*60)
    print("Server starting on http://localhost:5000")
    print("\nAPI Endpoints:")
    print("  GET  /api/health            - Health check")
    print("  POST /api/ask               - Ask a question")
    print("  GET  /api/example-questions - Get example questions")
    print("\nVideo Endpoints:")
    print("  GET  /api/videos            - List all videos")
    print("  POST /api/videos            - Add a video")
    print("  DELETE /api/videos/<id>     - Delete a video")
    print("  POST /api/videos/seed       - Seed sample videos")
    print("  POST /api/videos/search     - Search videos")
    print("="*60 + "\n")
    # Use threaded=True to handle multiple requests
    app.run(debug=True, port=5000, threaded=True, host='127.0.0.1')
