"""
Inference Script for Structured Dataset Format
Works with the new structured dataset (name, description, era, what_happened, question_variations)
"""

import torch
import pandas as pd
import numpy as np
from transformers import T5ForConditionalGeneration, T5Tokenizer
from sentence_transformers import SentenceTransformer
import faiss
import os
import random

def convert_to_story(name, description, era, what_happened):
    """Convert structured data to story format (same as training)"""
    points = [p.strip() for p in what_happened.split('|') if p.strip()]
    story_parts = []
    
    openings = [
        f"Long ago, in the {era}, a remarkable chapter unfolded in Sri Lankan history.",
        f"In the {era}, the story of {name} began to unfold.",
        f"Once upon a time, in the {era}, {description.lower()}",
        f"The {era} witnessed the extraordinary tale of {name}.",
    ]
    story_parts.append(random.choice(openings))
    story_parts.append(f"{description}")
    
    for i, point in enumerate(points):
        point = point.replace('•', '').strip()
        if point:
            point = point[0].upper() + point[1:] if len(point) > 1 else point.upper()
        
        if i == 0:
            if point.startswith(('Founded', 'Established', 'Built', 'Created', 'Born')):
                story_parts.append(point)
            else:
                story_parts.append(f"It began when {point.lower()}")
        elif i < len(points) - 2:
            if point.startswith(('The', 'This', 'That', 'King', 'Prince')):
                story_parts.append(point)
            else:
                story_parts.append(f"Over time, {point.lower()}")
        else:
            if point.startswith(('The', 'This', 'That', 'King', 'Prince')):
                story_parts.append(point)
            else:
                story_parts.append(f"Finally, {point.lower()}")
    
    conclusions = [
        f"This remarkable story of {name} remains a testament to the rich history of Sri Lanka.",
        f"The legacy of {name} continues to inspire and shape Sri Lankan identity to this day.",
        f"Thus, the story of {name} became an integral part of Sri Lanka's historical tapestry.",
    ]
    story_parts.append(random.choice(conclusions))
    
    story = " ".join(story_parts)
    story = " ".join(story.split())
    story = story.replace(" ,", ",").replace(" .", ".").replace("  ", " ")
    return story

class SriLankanHistoryQA:
    def __init__(self, model_path=None, dataset_path=None):
        """
        Initialize the Q&A system with structured dataset
        
        Args:
            model_path: Path to trained model (default: ./models/sri_lankan_history_model_structured)
            dataset_path: Path to structured CSV dataset
        """
        # Set default paths
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'sri_lankan_history_model_structured')
        if dataset_path is None:
            dataset_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sri_lankan_historical_events_structured.csv')
        
        # Check if model exists
        if not os.path.exists(model_path):
            print(f"⚠️  Warning: Model not found at {model_path}")
            print("Please train the model first using train_structured.py")
            print("Using pre-trained T5-small for now...")
            self.model_path = "t5-small"
            self.use_trained_model = False
        else:
            self.model_path = model_path
            self.use_trained_model = True
        
        # Load generation model
        print("Loading generation model...")
        self.tokenizer = T5Tokenizer.from_pretrained(self.model_path)
        self.model = T5ForConditionalGeneration.from_pretrained(self.model_path)
        self.model.eval()
        print("✓ Generation model loaded")
        
        # Load semantic similarity model
        print("Loading semantic similarity model...")
        self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✓ Semantic similarity model loaded")
        
        # Load structured dataset
        print("Loading structured Sri Lankan historical events dataset...")
        if not os.path.exists(dataset_path):
            print(f"⚠️  Warning: Dataset not found at {dataset_path}")
            self.df = None
            self.question_embeddings = None
            self.index = None
        else:
            self.df = pd.read_csv(dataset_path)
            print(f"✓ Loaded {len(self.df)} historical events")
            
            # Expand questions from question_variations
            all_questions = []
            self.question_to_event = {}
            
            for _, row in self.df.iterrows():
                name = row['name']
                questions = [q.strip() for q in row['question_variations'].split('|') if q.strip()]
                for question in questions:
                    all_questions.append(question)
                    self.question_to_event[question] = {
                        'name': name,
                        'description': row['description'],
                        'era': row['era'],
                        'what_happened': row['what_happened']
                    }
            
            # Create embeddings
            print("Creating question embeddings for semantic matching...")
            self.question_embeddings = self.similarity_model.encode(
                all_questions,
                convert_to_numpy=True,
                show_progress_bar=True
            )
            
            # Create FAISS index
            dimension = self.question_embeddings.shape[1]
            self.index = faiss.IndexFlatL2(dimension)
            self.index.add(self.question_embeddings.astype('float32'))
            self.all_questions = all_questions
            print("✓ Question embeddings indexed")
        
        print("\n" + "="*60)
        print("🇱🇰 Sri Lankan Historical Events Q&A System Ready!")
        print("="*60 + "\n")
    
    def find_similar_question(self, user_question, threshold=0.7, top_k=5):
        """Find similar questions using semantic similarity"""
        if self.index is None:
            return None, 0
        
        user_embedding = self.similarity_model.encode(
            [user_question],
            convert_to_numpy=True
        )
        
        distances, indices = self.index.search(
            user_embedding.astype('float32'),
            k=top_k
        )
        
        similarities = 1 - (distances[0] ** 2 / 2)
        
        best_idx = None
        best_similarity = 0
        
        for idx, sim in zip(indices[0], similarities):
            if sim > threshold and sim > best_similarity:
                best_idx = idx
                best_similarity = sim
        
        if best_idx is not None:
            matched_question = self.all_questions[best_idx]
            event_data = self.question_to_event[matched_question]
            return event_data, best_similarity
        return None, 0
    
    def generate_story(self, question, use_retrieval=True, similarity_threshold=0.85):
        """Generate story answer"""
        if use_retrieval and self.index is not None:
            # Try to find similar question
            event_data, similarity = self.find_similar_question(question)
            
            if event_data is not None and similarity > similarity_threshold:
                # High similarity - generate story from structured data
                story = convert_to_story(
                    event_data['name'],
                    event_data['description'],
                    event_data['era'],
                    event_data['what_happened']
                )
                return story, f"Found similar question (similarity: {similarity:.2f})"
            elif event_data is not None:
                # Medium similarity - could use as context
                pass
        
        # Generate using model
        input_text = f"question: {question}"
        
        input_ids = self.tokenizer.encode(
            input_text,
            return_tensors='pt',
            max_length=512,
            truncation=True
        )
        
        with torch.no_grad():
            outputs = self.model.generate(
                input_ids,
                max_length=512,
                num_beams=4,
                early_stopping=True,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.2
            )
        
        story = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return story, "Generated using trained model"

# Initialize system
def main():
    qa_system = SriLankanHistoryQA()
    
    print("=" * 60)
    print("🇱🇰 Sri Lankan Historical Events Story Q&A System")
    print("Ask questions about Sri Lankan history in any way!")
    print("Type 'quit' or 'exit' to exit\n")
    print("=" * 60 + "\n")
    
    while True:
        question = input("Ask about Sri Lankan history: ").strip()
        
        if question.lower() in ['quit', 'exit', 'q']:
            print("\nThank you for using the Sri Lankan History Q&A System! 🙏")
            break
        
        if not question:
            continue
        
        print("\n🔍 Processing your question...")
        story, info = qa_system.generate_story(question)
        print(f"ℹ️  {info}")
        print(f"\n📖 Story Answer:\n{story}\n")
        print("-" * 60 + "\n")

if __name__ == "__main__":
    main()


