"""
Updated RAG API Server with Scenario-Based Generation
Now uses predefined scenarios instead of free-form questions
"""
import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from openai import OpenAI
import chromadb
import json
import threading
import sys
from scenario_templates import get_scenario_list, get_scenario_prompt, get_scenario_info

load_dotenv()

app = Flask(__name__)

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize ChromaDB with new API
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_collection("museum_artifacts")

# Model configuration - will use fine-tuned model when available
def get_model_id():
    """Get the model ID to use - fine-tuned if available, otherwise default"""
    try:
        if os.path.exists('fine_tuned_model_id.txt'):
            with open('fine_tuned_model_id.txt', 'r') as f:
                fine_tuned_model = f.read().strip()
                if fine_tuned_model:
                    print(f"🎯 Using fine-tuned model: {fine_tuned_model}")
                    return fine_tuned_model
    except:
        pass
    
    # Default model if fine-tuned not available
    default_model = "gpt-4o-mini"
    print(f"📝 Using default model: {default_model}")
    return default_model

def create_embedding(text):
    """Create embedding for query"""
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=[text]
    )
    return response.data[0].embedding

def retrieve_artifact_context(artid, question, top_k=1):
    """Retrieve relevant artifact context using RAG"""
    # Create query embedding
    query_embedding = create_embedding(question)
    
    # Search in vector database
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"artifact_id": artid}  # Filter by artifact ID
    )
    
    if results['documents'] and len(results['documents'][0]) > 0:
        return results['documents'][0][0]  # Return first result
    return None

def generate_analysis_from_scenario(artid, scenario_id, context):
    """Generate 3-topic analysis using predefined scenario template"""
    
    model_id = get_model_id()
    scenario_info = get_scenario_info(scenario_id)
    
    if not scenario_info:
        raise ValueError(f"Invalid scenario: {scenario_id}")
    
    # Get the structured prompt for this scenario
    prompt = get_scenario_prompt(scenario_id, context)
    
    # Add the JSON structure requirement
    prompt += """

Return your response as a JSON object with this exact structure:
{{
    "answerTopic1": "topic name",
    "answerDescription1": "detailed description",
    "answerTopic2": "topic name", 
    "answerDescription2": "detailed description",
    "answerTopic3": "topic name",
    "answerDescription3": "detailed description"
}}
"""

    try:
        response = openai_client.chat.completions.create(
            model=model_id,
            messages=[
                {
                    "role": "system", 
                    "content": "You are a museum AI assistant specializing in Sri Lankan cultural artifacts. Always return valid JSON with exactly 3 topics and descriptions."
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},  # Force JSON output
            temperature=0.7,
            max_tokens=3000
        )
        
        # Parse JSON response
        try:
            result = json.loads(response.choices[0].message.content)
            return {
                "result": result,
                "model_used": model_id,
                "tokens_used": response.usage.total_tokens if hasattr(response, 'usage') else 0
            }
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "result": {
                    "answerTopic1": "General",
                    "answerDescription1": response.choices[0].message.content,
                    "answerTopic2": "",
                    "answerDescription2": "",
                    "answerTopic3": "",
                    "answerDescription3": ""
                },
                "model_used": model_id,
                "tokens_used": 0
            }
        
    except Exception as e:
        print(f"Error with fine-tuned model: {str(e)}")
        return {"error": str(e)}

@app.route('/api/scenarios', methods=['GET'])
def get_scenarios():
    """
    API endpoint: GET /api/scenarios - Get list of available scenario types
    
    Response:
    [
        {
            "id": "historical_impact",
            "name": "Historical Impact Analysis",
            "description": "...",
            "icon": "🏛️",
            "color": "blue"
        },
        ...
    ]
    """
    return jsonify(get_scenario_list()), 200

@app.route('/api/generate', methods=['POST'])
def generate_scenario_analysis():
    """
    API endpoint: POST /api/generate - Generate analysis for selected scenario
    
    Request:
    {
        "artid": "art1",
        "scenario_id": "historical_impact"
    }
    
    Response:
    {
        "artid": "art1",
        "scenario_id": "historical_impact",
        "scenario_name": "Historical Impact Analysis",
        "answerTopic1": "Political Impact",
        "answerDescription1": "...",
        "answerTopic2": "Social Impact", 
        "answerDescription2": "...",
        "answerTopic3": "Economic Impact",
        "answerDescription3": "...",
        "model_used": "ft:gpt-4o-mini-2024-07-18:research::CoteFXIT",
        "tokens_used": 1250
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        artid = data.get('artid', '').lower()
        scenario_id = data.get('scenario_id', '')
        
        if not artid or not scenario_id:
            return jsonify({"error": "Missing 'artid' or 'scenario_id' in request"}), 400
        
        # Validate scenario exists
        scenario_info = get_scenario_info(scenario_id)
        if not scenario_info:
            return jsonify({"error": f"Invalid scenario_id: {scenario_id}"}), 400
        
        # Step 1: Retrieve artifact context using RAG
        print(f"Retrieving context for {artid}...")
        # Use scenario name as query for better context retrieval
        context = retrieve_artifact_context(artid, scenario_info['name'])
        
        if not context:
            return jsonify({
                "error": f"Artifact {artid} not found in database"
            }), 404
        
        # Step 2: Generate analysis using scenario template
        print(f"Generating {scenario_info['name']} analysis...")
        result = generate_analysis_from_scenario(artid, scenario_id, context)
        
        if 'error' in result:
            return jsonify({
                'error': result['error'],
                'fallback': 'Fine-tuned model unavailable'
            }), 500
        
        # Step 3: Format response with scenario information
        topics = result['result']
        response = {
            "artid": artid,
            "scenario_id": scenario_id,
            "scenario_name": scenario_info['name'],
            "scenario_description": scenario_info['description'],
            "scenario_icon": scenario_info['icon'],
            "answerTopic1": topics.get("answerTopic1", ""),
            "answerDescription1": topics.get("answerDescription1", ""),
            "answerTopic2": topics.get("answerTopic2", ""),
            "answerDescription2": topics.get("answerDescription2", ""),
            "answerTopic3": topics.get("answerTopic3", ""),
            "answerDescription3": topics.get("answerDescription3", ""),
            # Additional info about model
            "model_used": result.get('model_used', 'unknown'),
            "tokens_used": result.get('tokens_used', 0),
            "fine_tuned": True
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint - Same format as original"""
    try:
        model_id = get_model_id()
        is_fine_tuned = 'ft:' in model_id
        count = collection.count()
        
        return jsonify({
            "status": "healthy",
            "artifacts_in_db": count,
            "model": model_id,
            "fine_tuned": is_fine_tuned
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@app.route('/model-status', methods=['GET'])
def model_status():
    """Check fine-tuning status"""
    try:
        if os.path.exists('fine_tuning_job_id.txt'):
            with open('fine_tuning_job_id.txt', 'r') as f:
                job_id = f.read().strip()
            
            job = openai_client.fine_tuning.jobs.retrieve(job_id)
            
            return jsonify({
                'job_id': job_id,
                'status': job.status,
                'model': job.model,
                'fine_tuned_model': job.fine_tuned_model if hasattr(job, 'fine_tuned_model') else None,
                'created_at': job.created_at
            })
        else:
            return jsonify({'error': 'No fine-tuning job found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("="*80)
    print("🏛️  SCENARIO-BASED ANALYSIS SERVER - SRI LANKAN ARTIFACTS")
    print("="*80)
    
    model_id = get_model_id()
    is_fine_tuned = 'ft:' in model_id
    scenarios = get_scenario_list()
    
    print(f"🤖 Model: {model_id}")
    print(f"🎯 Fine-tuned: {'✅ YES' if is_fine_tuned else '❌ NO (using default)'}")
    print(f"📊 Collection: {collection.name}")
    print(f"📁 Documents: {collection.count()}")
    print(f"🎭 Available Scenarios: {len(scenarios)}")
    
    print("\n📡 Endpoints:")
    print("  GET /api/scenarios - Get list of available analysis scenarios")
    print("  POST /api/generate - Generate scenario-based analysis")
    print("  GET /health - Health check and model status")
    print("  GET /model-status - Check fine-tuning job status")
    
    print("\n📋 Example request:")
    print("""{
  "artid": "art001",
  "scenario_id": "historical_impact"
}""")
    
    print(f"\n🚀 Starting server on http://localhost:5001")
    print("="*80)
    
    app.run(debug=True, host='0.0.0.0', port=5001)