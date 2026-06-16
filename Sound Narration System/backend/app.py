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
from services.reviews_store import get_reviews_store

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

reviews_store = get_reviews_store()
if reviews_store.enabled:
    print("Reviews store ready!")
else:
    print(f"Reviews store unavailable: {reviews_store.last_error}")


def _serialize_review(doc):
    created = doc.get("created_at")
    created_iso = created.isoformat().replace("+00:00", "Z") if hasattr(created, "isoformat") else None
    out = {
        "id": doc.get("_id"),
        "name": doc.get("name"),
        "age": doc.get("age"),
        "rating": int(doc.get("rating")),
        "comment": doc.get("comment"),
        "session_type": doc.get("session_type"),
        "created_at": created_iso,
    }
    return out


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok", 
        "message": "Sri Lankan History Q&A API is running",
        "video_count": video_db.collection.count(),
        "reviews_enabled": reviews_store.enabled,
    })

@app.route('/api/reviews/summary', methods=['GET', 'OPTIONS'])
def reviews_summary():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:
        if not reviews_store.enabled:
            return jsonify({
                "success": False,
                "avgRating": 0,
                "totalReviews": 0,
                "enabled": False,
                "error": reviews_store.last_error or "Reviews unavailable",
            }), 503

        avg, total = reviews_store.summary()
        return jsonify({
            "success": True,
            "avgRating": round(avg, 2) if total else 0,
            "totalReviews": total,
            "enabled": True,
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/reviews', methods=['GET', 'POST', 'OPTIONS'])
def reviews():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    if request.method == 'GET':
        try:
            if not reviews_store.enabled:
                return jsonify({
                    "success": False,
                    "reviews": [],
                    "enabled": False,
                    "error": reviews_store.last_error or "Reviews unavailable",
                }), 503

            limit = request.args.get('limit', default=50, type=int)
            docs = reviews_store.list_recent(limit=limit)
            return jsonify({
                "success": True,
                "reviews": [_serialize_review(d) for d in docs],
                "enabled": True,
            })
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    # POST
    try:
        if not reviews_store.enabled:
            return jsonify({
                "success": False,
                "enabled": False,
                "error": reviews_store.last_error or "Reviews unavailable",
            }), 503

        data = request.get_json(silent=True) or {}
        rating = data.get('rating')
        comment = data.get('comment')
        session_type = (data.get('session_type') or 'kiosk').strip() or 'kiosk'
        name = data.get('name')
        age = data.get('age')

        if not isinstance(name, str) or not name.strip():
            return jsonify({"success": False, "error": "name is required"}), 400
        name_clean = name.strip()
        if len(name_clean) > 120:
            return jsonify({"success": False, "error": "name must be at most 120 characters"}), 400

        try:
            age_int = int(age)
        except (TypeError, ValueError):
            return jsonify({"success": False, "error": "age must be a whole number"}), 400

        if age_int < 1 or age_int > 120:
            return jsonify({"success": False, "error": "age must be between 1 and 120"}), 400

        try:
            rating_int = int(rating)
        except (TypeError, ValueError):
            return jsonify({"success": False, "error": "rating must be an integer 1-5"}), 400

        if rating_int < 1 or rating_int > 5:
            return jsonify({"success": False, "error": "rating must be between 1 and 5"}), 400

        if comment is not None and not isinstance(comment, str):
            return jsonify({"success": False, "error": "comment must be a string"}), 400

        doc = reviews_store.insert_review(rating_int, comment, session_type, name_clean, age_int)
        return jsonify({
            "success": True,
            "review": _serialize_review(doc),
            "enabled": True,
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

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
    port = int(os.environ.get('PORT', 5000))
    print(f"Server starting on http://localhost:{port}")
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
    app.run(debug=True, port=port, threaded=True, host='127.0.0.1')
