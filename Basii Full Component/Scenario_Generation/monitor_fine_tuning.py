"""
Automated Fine-tuning Monitor
Continuously checks status until completion
"""
import os
import time
import datetime
from dotenv import load_dotenv
from openai import OpenAI

def monitor_fine_tuning():
    """Continuously monitor fine-tuning until completion"""
    load_dotenv()
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # Read job ID
    with open('fine_tuning_job_id.txt', 'r') as f:
        job_id = f.read().strip()
    
    print("🤖 AUTOMATED FINE-TUNING MONITOR")
    print("=" * 60)
    print(f"📋 Job ID: {job_id}")
    print(f"⏰ Started at: {datetime.datetime.now().strftime('%H:%M:%S')}")
    print("=" * 60)
    
    start_time = time.time()
    check_count = 0
    
    while True:
        check_count += 1
        elapsed = time.time() - start_time
        elapsed_str = f"{int(elapsed//60)}m {int(elapsed%60)}s"
        
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
            timestamp = datetime.datetime.now().strftime('%H:%M:%S')
            
            print(f"[{timestamp}] Check #{check_count} | Elapsed: {elapsed_str} | Status: {emoji} {job.status.upper()}")
            
            # Check if completed
            if job.status == 'succeeded':
                print("\n" + "=" * 60)
                print("🎉 FINE-TUNING COMPLETED SUCCESSFULLY!")
                print("=" * 60)
                print(f"✅ Fine-tuned model: {job.fine_tuned_model}")
                print(f"⏱️  Total time: {elapsed_str}")
                print(f"💰 Training cost: Check your OpenAI billing")
                
                # Save the model ID
                with open('fine_tuned_model_id.txt', 'w') as f:
                    f.write(job.fine_tuned_model)
                print("📁 Model ID saved to: fine_tuned_model_id.txt")
                
                print("\n🚀 NEXT STEPS:")
                print("1. Your enhanced RAG server will automatically use the fine-tuned model")
                print("2. Run: python rag_api_server_fine_tuned.py")
                print("3. Test: python test_fine_tuned_model.py")
                print("=" * 60)
                break
                
            elif job.status == 'failed':
                print("\n" + "=" * 60)
                print("❌ FINE-TUNING FAILED!")
                print("=" * 60)
                if hasattr(job, 'error'):
                    print(f"Error: {job.error}")
                print("Check the OpenAI dashboard for more details:")
                print("https://platform.openai.com/finetunes")
                print("=" * 60)
                break
                
            elif job.status == 'cancelled':
                print("\n" + "=" * 60)
                print("🛑 FINE-TUNING CANCELLED")
                print("=" * 60)
                break
            
            # Wait before next check
            if job.status in ['running', 'queued']:
                print("   ⏳ Waiting 30 seconds before next check...")
                time.sleep(30)
            else:
                time.sleep(10)  # Check more frequently for other states
                
        except KeyboardInterrupt:
            print(f"\n\n⚠️  Monitoring stopped by user")
            print(f"📋 Job ID: {job_id}")
            print("You can resume monitoring later or check manually:")
            print("python check_fine_tuning_status.py")
            break
            
        except Exception as e:
            print(f"\n❌ Error checking status: {str(e)}")
            print("Retrying in 30 seconds...")
            time.sleep(30)

if __name__ == "__main__":
    monitor_fine_tuning()