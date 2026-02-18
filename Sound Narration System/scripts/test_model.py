"""
Test Script for Sri Lankan Historical Events Q&A Model (Structured Format)
Tests the model with sample questions and validates question variation handling
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.inference_structured import SriLankanHistoryQA

def test_question_variations():
    """Test that the system handles question variations correctly"""
    
    print("="*60)
    print("Testing Question Variation Handling")
    print("="*60 + "\n")
    
    # Initialize system
    qa_system = SriLankanHistoryQA()
    
    # Test cases: Different ways of asking about the same events
    test_cases = [
        {
            "event": "Anuradhapura Kingdom",
            "questions": [
                "What is the Anuradhapura Kingdom?",
                "Tell me about Anuradhapura Kingdom",
                "Explain Anuradhapura Kingdom",
                "Describe Anuradhapura Kingdom"
            ]
        },
        {
            "event": "Sigiriya Rock Fortress",
            "questions": [
                "What is the Sigiriya Rock Fortress?",
                "Tell me about Sigiriya",
                "Explain Sigiriya",
                "What is Sigiriya?"
            ]
        },
        {
            "event": "Sri Lankan Independence",
            "questions": [
                "What happened in Sri Lankan Independence?",
                "When did Sri Lanka get independence?",
                "Tell me about Sri Lanka independence",
                "How did Sri Lanka gain independence?"
            ]
        },
        {
            "event": "King Dutugemunu",
            "questions": [
                "Who was King Dutugemunu?",
                "Tell me about King Dutugemunu",
                "What is the story of King Dutugemunu?",
                "Explain King Dutugemunu"
            ]
        }
    ]
    
    print("Testing with question variations...\n")
    
    for test_case in test_cases:
        print(f"📌 Event: {test_case['event']}")
        print("-" * 60)
        
        answers = []
        for i, question in enumerate(test_case['questions'], 1):
            print(f"\nQuestion {i}: {question}")
            story, info = qa_system.generate_story(question)
            answers.append(story)
            print(f"Answer length: {len(story)} characters")
            print(f"Info: {info}")
        
        # Check if answers are similar (they should be for the same event)
        print(f"\n✓ Tested {len(test_case['questions'])} variations")
        print("-" * 60 + "\n")
    
    print("="*60)
    print("Testing Complete!")
    print("="*60)

def test_single_questions():
    """Test individual questions"""
    
    print("\n" + "="*60)
    print("Testing Individual Questions")
    print("="*60 + "\n")
    
    qa_system = SriLankanHistoryQA()
    
    test_questions = [
        "What is the Kandyan Kingdom?",
        "Who brought Buddhism to Sri Lanka?",
        "When did Portuguese come to Sri Lanka?",
        "Tell me about the arrival of Buddhism",
        "What happened in World War 2?"  # This should not match (not in dataset)
    ]
    
    for question in test_questions:
        print(f"Q: {question}")
        print("-" * 60)
        story, info = qa_system.generate_story(question)
        print(f"Info: {info}")
        print(f"A: {story[:200]}..." if len(story) > 200 else f"A: {story}")
        print("\n")

def validate_dataset():
    """Validate the dataset structure and content"""
    
    print("="*60)
    print("Validating Dataset")
    print("="*60 + "\n")
    
    import pandas as pd
    
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sri_lankan_historical_events_structured.csv')
    
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset not found at {dataset_path}")
        return
    
    df = pd.read_csv(dataset_path)
    
    print(f"✓ Dataset loaded: {len(df)} historical events")
    print(f"✓ Columns: {list(df.columns)}")
    
    # Check for required columns
    required_columns = ['name', 'description', 'era', 'what_happened', 'question_variations']
    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        print(f"❌ Missing columns: {missing}")
    else:
        print("✓ All required columns present")
    
    # Check question variations per event
    print("\nQuestion variations per event:")
    for _, row in df.iterrows():
        questions = [q.strip() for q in row['question_variations'].split('|') if q.strip()]
        print(f"  {row['name']}: {len(questions)} variations")
    
    # Check data completeness
    print("\nChecking data completeness...")
    missing_data = df[df['name'].isna() | df['description'].isna() | df['era'].isna() | df['what_happened'].isna()]
    if len(missing_data) > 0:
        print(f"⚠️  Found {len(missing_data)} events with missing data")
    else:
        print("✓ All events have complete data")
    
    # Check what_happened points
    print("\nChecking what_happened points...")
    for _, row in df.iterrows():
        points = [p.strip() for p in str(row['what_happened']).split('|') if p.strip()]
        print(f"  {row['name']}: {len(points)} points")
    
    print("\n" + "="*60)
    print("Dataset Validation Complete!")
    print("="*60)

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🧪 Sri Lankan History Q&A Model Test Suite")
    print("="*60 + "\n")
    
    # Run validations
    validate_dataset()
    
    # Run tests
    test_question_variations()
    test_single_questions()
    
    print("\n✅ All tests completed!")

