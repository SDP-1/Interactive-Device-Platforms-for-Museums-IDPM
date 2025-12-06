"""
Flask Backend API for Sri Lankan Historical Events Q&A System
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add parent directory to path to import inference
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.inference_structured import SriLankanHistoryQA

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

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Sri Lankan History Q&A API is running"})

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
        
        response = jsonify({
            "question": question,
            "answer": story,
            "info": info,
            "success": True
        })
        return response
    
    except Exception as e:
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

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🇱🇰 Sri Lankan History Q&A API Server")
    print("="*60)
    print("Server starting on http://localhost:5000")
    print("API Endpoints:")
    print("  GET  /api/health - Health check")
    print("  POST /api/ask - Ask a question")
    print("  GET  /api/example-questions - Get example questions")
    print("="*60 + "\n")
    # Use threaded=True to handle multiple requests
    app.run(debug=True, port=5000, threaded=True, host='127.0.0.1')

