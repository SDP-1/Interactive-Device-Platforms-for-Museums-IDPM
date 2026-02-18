"""
Status checker for your fine-tuning job
"""
import os
from dotenv import load_dotenv
from openai import OpenAI

def check_status():
    load_dotenv()
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # Read job ID
    with open('fine_tuning_job_id.txt', 'r') as f:
        job_id = f.read().strip()
    
    print(f"🔍 Checking status for job: {job_id}")
    print("=" * 50)
    
    try:
        job = client.fine_tuning.jobs.retrieve(job_id)
        
        status_emoji = {
            'validating_files': '📋',
            'queued': '⏳',
            'running': '🚀',
            'succeeded': '✅',
            'failed': '❌',
            'cancelled': '🛑'
        }
        
        emoji = status_emoji.get(job.status, '🔄')
        
        print(f"Status: {emoji} {job.status.upper()}")
        print(f"Model: {job.model}")
        print(f"Created: {job.created_at}")
        
        if job.status == 'succeeded' and job.fine_tuned_model:
            print(f"\n🎉 SUCCESS! Your fine-tuned model is ready!")
            print(f"📋 Fine-tuned model ID: {job.fine_tuned_model}")
            print("\n🔧 To use this model, update your rag_api_server.py")
            print("Replace the model name in the OpenAI API calls:")
            print(f"   model='{job.fine_tuned_model}'")
            
            # Save the model ID
            with open('fine_tuned_model_id.txt', 'w') as f:
                f.write(job.fine_tuned_model)
            print("📁 Model ID saved to: fine_tuned_model_id.txt")
            
        elif job.status == 'failed':
            print(f"❌ Fine-tuning failed!")
            if hasattr(job, 'error'):
                print(f"Error: {job.error}")
                
        elif job.status == 'running':
            print(f"🚀 Training in progress...")
            if hasattr(job, 'estimated_finish'):
                print(f"Estimated finish: {job.estimated_finish}")
                
        elif job.status == 'queued':
            print(f"⏳ Waiting in queue...")
            
        print("=" * 50)
        return job
        
    except Exception as e:
        print(f"❌ Error checking status: {str(e)}")
        return None

if __name__ == "__main__":
    check_status()