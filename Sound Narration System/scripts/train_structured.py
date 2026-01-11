"""
Training Script for Structured Dataset Format
Handles name, description, era, what_happened, question_variations format
"""

import pandas as pd
import torch
from transformers import (
    T5ForConditionalGeneration,
    T5Tokenizer,
    Trainer,
    TrainingArguments,
    DataCollatorForSeq2Seq
)
from datasets import Dataset
from sklearn.model_selection import train_test_split
import os
import random

def convert_to_story(name, description, era, what_happened):
    """
    Convert structured data into a story-formatted answer
    """
    # Split what_happened points
    points = [p.strip() for p in what_happened.split('|') if p.strip()]
    
    # Create story introduction
    story_parts = []
    
    # Opening variations (none include description to avoid duplication)
    openings = [
        f"Long ago, in the {era}, a remarkable chapter unfolded in Sri Lankan history.",
        f"In the {era}, the story of {name} began to unfold.",
        f"Once upon a time, in the {era}, something extraordinary happened.",
        f"The {era} witnessed the extraordinary tale of {name}.",
    ]
    story_parts.append(random.choice(openings))
    
    # Add description with proper ending punctuation
    desc = description.strip()
    if not desc.endswith('.'):
        desc += '.'
    story_parts.append(desc)
    
    # Varied transitions for middle points
    transitions = ["Over time,", "Furthermore,", "Additionally,", "Moreover,"]
    
    # Convert points to narrative with better flow
    for i, point in enumerate(points):
        # Remove bullet if present
        point = point.replace('•', '').strip()
        
        # Capitalize first letter
        if point:
            point = point[0].upper() + point[1:] if len(point) > 1 else point.upper()
        
        # Ensure point ends with period
        if not point.endswith('.'):
            point += '.'
        
        # Convert to narrative sentence with better transitions
        if i == 0:
            # First point
            if point.startswith(('Founded', 'Established', 'Built', 'Created', 'Born')):
                story_parts.append(point)
            else:
                story_parts.append(f"It began when {point.lower()}")
        elif i == len(points) - 1:
            # Only LAST point gets "Finally"
            story_parts.append(f"Finally, {point.lower()}")
        else:
            # Middle points get varied transitions
            if point.startswith(('The', 'This', 'That', 'King', 'Prince')):
                story_parts.append(point)
            else:
                transition = transitions[i % len(transitions)]
                story_parts.append(f"{transition} {point.lower()}")
    
    # Add conclusion
    conclusions = [
        f"This remarkable story of {name} remains a testament to the rich history of Sri Lanka.",
        f"The legacy of {name} continues to inspire and shape Sri Lankan identity to this day.",
        f"Thus, the story of {name} became an integral part of Sri Lanka's historical tapestry.",
    ]
    story_parts.append(random.choice(conclusions))
    
    # Join with spaces and clean up
    story = " ".join(story_parts)
    story = " ".join(story.split())
    story = story.replace(" ,", ",").replace(" .", ".").replace("..", ".").replace("  ", " ")
    
    return story

# Check device
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load structured dataset
print("Loading structured Sri Lankan historical events dataset...")
dataset_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sri_lankan_historical_events_structured.csv')
df = pd.read_csv(dataset_path)
print(f"Loaded {len(df)} historical events")

# Expand data: create training examples from structured format
expanded_data = []
for _, row in df.iterrows():
    name = row['name']
    description = row['description']
    era = row['era']
    what_happened = row['what_happened']
    question_variations = row['question_variations']
    
    # Generate story from structured data
    story_answer = convert_to_story(name, description, era, what_happened)
    
    # Parse question variations
    questions = [q.strip() for q in question_variations.split('|') if q.strip()]
    
    # Create training pair for each question variation
    for question in questions:
        expanded_data.append({
            'question': question,
            'story_answer': story_answer,
            'name': name,
            'era': era
        })

df_expanded = pd.DataFrame(expanded_data)
print(f"Total training examples after expansion: {len(df_expanded)}")
print(f"Unique historical events: {df_expanded['name'].nunique()}")

# Prepare data for training
def prepare_data(df):
    data = []
    for _, row in df.iterrows():
        input_text = f"question: {row['question']}"
        target_text = row['story_answer']
        data.append({
            'input': input_text,
            'target': target_text
        })
    return data

# Prepare dataset
print("Preparing training and validation sets...")
data = prepare_data(df_expanded)
train_data, val_data = train_test_split(data, test_size=0.2, random_state=42)
print(f"Training examples: {len(train_data)}")
print(f"Validation examples: {len(val_data)}")

# Initialize model and tokenizer
print("\nInitializing model and tokenizer...")
model_name = "t5-small"  # Use "t5-base" for better results (requires more memory)
print(f"Loading {model_name}...")
tokenizer = T5Tokenizer.from_pretrained(model_name)
model = T5ForConditionalGeneration.from_pretrained(model_name)
model.to(device)
print(f"Model loaded on {device}")

# Tokenize function
def tokenize_function(examples):
    model_inputs = tokenizer(
        examples['input'],
        max_length=512,
        truncation=True,
        padding='max_length'
    )
    labels = tokenizer(
        examples['target'],
        max_length=512,
        truncation=True,
        padding='max_length'
    )
    model_inputs['labels'] = labels['input_ids']
    return model_inputs

# Convert to datasets
print("Tokenizing datasets...")
train_dataset = Dataset.from_list(train_data)
val_dataset = Dataset.from_list(val_data)

train_dataset = train_dataset.map(tokenize_function, batched=True)
val_dataset = val_dataset.map(tokenize_function, batched=True)

# Data collator
data_collator = DataCollatorForSeq2Seq(
    tokenizer=tokenizer,
    model=model,
    padding=True
)

# Training arguments (adjusted for CPU/GPU)
batch_size = 2 if device == "cpu" else 8
print(f"\nTraining configuration:")
print(f"  Device: {device}")
print(f"  Batch size: {batch_size}")
print(f"  Epochs: 5")

training_args = TrainingArguments(
    output_dir='./models/sri_lankan_history_model_structured',
    num_train_epochs=5,
    per_device_train_batch_size=batch_size,
    per_device_eval_batch_size=batch_size,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir='./models/logs',
    logging_steps=50,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    learning_rate=3e-4,
    save_total_limit=3,
    push_to_hub=False,
    report_to="none",
)

# Create output directory
os.makedirs('./models/sri_lankan_history_model_structured', exist_ok=True)
os.makedirs('./models/logs', exist_ok=True)

# Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    data_collator=data_collator,
)

# Train
print("\n" + "="*60)
print("Starting training on structured Sri Lankan historical events...")
print("="*60 + "\n")
trainer.train()

# Save model
print("\nSaving model...")
model.save_pretrained('./models/sri_lankan_history_model_structured')
tokenizer.save_pretrained('./models/sri_lankan_history_model_structured')
print("Model saved to ./models/sri_lankan_history_model_structured")
print("\nTraining complete! ✅")

