"""
Fine-tuning preparation for OpenAI model
This creates training data in the format required by OpenAI
"""
import csv
import json
import os

def prepare_fine_tuning_data():
    """Convert your dataset into OpenAI fine-tuning format"""
    training_data = []
    
    with open('dataset/Dataset - Sheet1.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        # Clean header names (strip whitespace)
        reader.fieldnames = [name.strip() for name in reader.fieldnames]
        for row in reader:
            # Create system message for context
            system_context = f"""You are an expert museum AI assistant specializing in Sri Lankan cultural artifacts. 
You provide detailed, educational responses about {row['Name']}, a {row['type/category']} from the {row['period']} period.

Artifact Context:
- Name: {row['Name']}
- Type: {row['type/category']}
- Period: {row['period']}
- Origin: {row['origin']}
- Historical Background: {row['historical_background']}
- Purpose: {row['purpose']}
- Cultural Significance: {row['cultural_significance']}
- Related Events: {row['related_events']}

Always provide structured responses with historical context, cultural significance, and educational branches for exploration."""

            # Parse pre-written questions
            questions_text = str(row['Pre_written examples (What-If Questions)'])
            questions = [q.strip() for q in questions_text.split('\n') if q.strip() and not q.strip().isdigit()]
            
            # Get the full detailed answers
            answers = str(row['pre_written_answers'])
            
            # Create training examples for each question
            for question in questions:
                if question.strip() and len(question) > 20:  # Filter out short/empty questions
                    training_example = {
                        "messages": [
                            {"role": "system", "content": system_context},
                            {"role": "user", "content": question.strip()},
                            {"role": "assistant", "content": answers}
                        ]
                    }
                    training_data.append(training_example)
    
    # Save training data
    with open('fine_tuning_data.jsonl', 'w', encoding='utf-8') as f:
        for example in training_data:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')
    
    print(f"Created {len(training_data)} training examples")
    print("Training data saved to: fine_tuning_data.jsonl")
    return training_data

def start_fine_tuning():
    """Start fine-tuning process with OpenAI"""
    from openai import OpenAI
    from dotenv import load_dotenv
    load_dotenv()
    
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    print("🔄 Starting fine-tuning process...")
    print("📁 Uploading training file...")
    
    # Upload training file
    try:
        with open("fine_tuning_data.jsonl", "rb") as f:
            response = client.files.create(
                file=f,
                purpose="fine-tune"
            )
        
        file_id = response.id
        print(f"✅ Training file uploaded successfully: {file_id}")
        
        # Start fine-tuning job
        print("🚀 Starting fine-tuning job...")
        job = client.fine_tuning.jobs.create(
            training_file=file_id,
            model="gpt-4o-mini-2024-07-18",  # Using latest compatible model
            hyperparameters={
                "n_epochs": 3,
                "batch_size": 1,
                "learning_rate_multiplier": 2
            }
        )
        
        print(f"✅ Fine-tuning job started successfully!")
        print(f"📋 Job ID: {job.id}")
        print(f"📊 Model: {job.model}")
        print(f"📈 Status: {job.status}")
        print("\n" + "="*60)
        print("🔍 MONITORING YOUR FINE-TUNING JOB")
        print("="*60)
        print(f"Job ID: {job.id}")
        print("You can monitor progress using:")
        print(f"  openai api fine_tuning.jobs.retrieve -i {job.id}")
        print("\nOr check the OpenAI web dashboard:")
        print("  https://platform.openai.com/finetunes")
        print("\n💰 Estimated cost: $1-5 USD")
        print("⏱️  Expected completion: 10-30 minutes")
        print("="*60)
        
        return job.id
        
    except Exception as e:
        print(f"❌ Error during fine-tuning: {str(e)}")
        return None

def check_fine_tuning_status(job_id):
    """Check the status of a fine-tuning job"""
    from openai import OpenAI
    from dotenv import load_dotenv
    load_dotenv()
    
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    try:
        job = client.fine_tuning.jobs.retrieve(job_id)
        print(f"Status: {job.status}")
        print(f"Model: {job.model}")
        if job.fine_tuned_model:
            print(f"Fine-tuned model: {job.fine_tuned_model}")
        return job
    except Exception as e:
        print(f"Error checking status: {str(e)}")
        return None

if __name__ == "__main__":
    print("="*60)
    print("🏛️  FINE-TUNING OPENAI MODEL FOR SRI Lankan ARTIFACTS")
    print("="*60)
    
    # Step 1: Prepare training data
    print("📝 Step 1: Preparing training data...")
    training_data = prepare_fine_tuning_data()
    
    if len(training_data) == 0:
        print("❌ No training data created. Please check your CSV file.")
        exit(1)
    
    print(f"✅ Training data prepared: {len(training_data)} examples")
    
    # Step 2: Start fine-tuning
    print("\n🚀 Step 2: Starting fine-tuning...")
    job_id = start_fine_tuning()
    
    if job_id:
        print(f"\n🎉 SUCCESS! Fine-tuning started with job ID: {job_id}")
        
        # Save job ID for future reference
        with open('fine_tuning_job_id.txt', 'w') as f:
            f.write(job_id)
        
        print("📁 Job ID saved to: fine_tuning_job_id.txt")
        print("\n📋 NEXT STEPS:")
        print("1. Wait 10-30 minutes for training to complete")
        print("2. Check status periodically")
        print("3. Once complete, update your RAG system to use the fine-tuned model")
    else:
        print("❌ Fine-tuning failed to start. Please check your API key and try again.")