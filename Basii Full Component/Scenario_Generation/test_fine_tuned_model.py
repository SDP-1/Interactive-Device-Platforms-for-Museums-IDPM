"""
Test script for fine-tuned model integration
"""
import requests
import json
import time

def test_api(base_url="http://localhost:5000"):
    """Test the enhanced RAG API"""
    
    print("🧪 Testing Enhanced RAG API with Fine-tuned Model")
    print("=" * 60)
    
    # Test 1: Health check
    print("1️⃣ Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed")
            print(f"   Model: {data['model']}")
            print(f"   Fine-tuned: {data['fine_tuned']}")
            print(f"   Documents: {data['artifacts_in_db']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
    
    # Test 2: Model status
    print("\n2️⃣ Testing model status...")
    try:
        response = requests.get(f"{base_url}/model-status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Model status retrieved")
            print(f"   Status: {data['status']}")
            if data.get('fine_tuned_model'):
                print(f"   Fine-tuned model: {data['fine_tuned_model']}")
        else:
            print(f"❌ Model status failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Model status error: {str(e)}")
    
    # Test 3: Query with artifact
    print("\n3️⃣ Testing artifact query...")
    test_query = {
        "artid": "art001",
        "question": "What if the Kandyan Kingdom had lost the 1803 battle?"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/answer",
            json=test_query,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Query successful")
            print(f"   Model used: {data.get('model_used', 'Unknown')}")
            print(f"   Tokens used: {data.get('tokens_used', 0)}")
            print(f"   Response preview: {data.get('answerTopic1', 'No topic 1')}...")
        else:
            print(f"❌ Query failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Query error: {str(e)}")

def monitor_fine_tuning():
    """Monitor fine-tuning progress until completion"""
    print("🔍 Monitoring fine-tuning progress...")
    
    while True:
        import subprocess
        import sys
        
        result = subprocess.run(
            [sys.executable, 'check_fine_tuning_status.py'], 
            capture_output=True, 
            text=True
        )
        
        print("\n" + "="*50)
        print(result.stdout)
        
        if 'SUCCESS!' in result.stdout:
            print("🎉 Fine-tuning completed! You can now use your specialized model.")
            break
        elif 'FAILED' in result.stdout:
            print("❌ Fine-tuning failed. Check the logs for details.")
            break
        
        print("⏳ Waiting 30 seconds before next check...")
        time.sleep(30)

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'monitor':
        monitor_fine_tuning()
    else:
        print("Choose an option:")
        print("1. Test API (python test_fine_tuned_model.py)")
        print("2. Monitor fine-tuning (python test_fine_tuned_model.py monitor)")
        print()
        
        # Run API test by default
        test_api()