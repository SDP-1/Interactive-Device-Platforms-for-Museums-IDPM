"""
Accuracy Evaluation Script for Sri Lankan Historical Events Q&A Model
Measures retrieval accuracy, answer quality, and generates visual reports
"""

import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime
import random

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.inference_structured import SriLankanHistoryQA, convert_to_story
from sentence_transformers import SentenceTransformer

# For visualization
try:
    import matplotlib.pyplot as plt
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False
    print("⚠️  matplotlib not installed. Charts disabled. Run: pip install matplotlib")


def evaluate_model():
    """
    Comprehensive model evaluation:
    1. Retrieval Accuracy - Does the system find the correct event?
    2. Answer Similarity - How similar is the generated answer to expected answer?
    3. Question Variation Handling - Does it handle different phrasings?
    """
    
    print("="*70)
    print("🔍 Sri Lankan History Q&A Model - Accuracy Evaluation")
    print("="*70 + "\n")
    
    # Initialize system
    print("Loading model and data...")
    qa_system = SriLankanHistoryQA()
    similarity_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Load dataset
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sri_lankan_historical_events_structured.csv')
    df = pd.read_csv(dataset_path)
    
    print(f"✓ Loaded {len(df)} historical events\n")
    
    # ==================== TEST SETUP ====================
    results = []
    
    # For each event, test with multiple question variations
    for idx, row in df.iterrows():
        event_name = row['name']
        expected_description = row['description']
        expected_era = row['era']
        expected_what_happened = row['what_happened']
        
        # Generate expected story for comparison
        expected_story = convert_to_story(event_name, expected_description, expected_era, expected_what_happened)
        
        # Get all question variations for this event
        questions = [q.strip() for q in row['question_variations'].split('|') if q.strip()]
        
        # Test each question variation
        for question in questions:
            # Generate answer
            generated_story, info = qa_system.generate_story(question)
            
            # Check if correct event was retrieved
            is_correct_retrieval = event_name.lower() in info.lower() or "similar question" in info.lower()
            
            # For more accurate check, see if the generated story mentions the event
            mentions_event = event_name.lower() in generated_story.lower()
            
            # Calculate semantic similarity between generated and expected
            gen_embedding = similarity_model.encode([generated_story])
            exp_embedding = similarity_model.encode([expected_story])
            
            similarity = float(np.dot(gen_embedding[0], exp_embedding[0]) / 
                             (np.linalg.norm(gen_embedding[0]) * np.linalg.norm(exp_embedding[0])))
            
            results.append({
                'event_name': event_name,
                'question': question,
                'info': info,
                'correct_retrieval': is_correct_retrieval or mentions_event,
                'semantic_similarity': similarity,
                'answer_length': len(generated_story)
            })
    
    # ==================== CALCULATE METRICS ====================
    results_df = pd.DataFrame(results)
    
    # Overall retrieval accuracy
    retrieval_accuracy = results_df['correct_retrieval'].mean() * 100
    
    # Average semantic similarity
    avg_similarity = results_df['semantic_similarity'].mean() * 100
    
    # Per-event accuracy
    event_accuracy = results_df.groupby('event_name').agg({
        'correct_retrieval': 'mean',
        'semantic_similarity': 'mean'
    }).reset_index()
    event_accuracy.columns = ['Event', 'Retrieval Accuracy', 'Semantic Similarity']
    event_accuracy['Retrieval Accuracy'] *= 100
    event_accuracy['Semantic Similarity'] *= 100
    
    # ==================== PRINT RESULTS ====================
    print("\n" + "="*70)
    print("📊 EVALUATION RESULTS")
    print("="*70)
    
    print(f"\n🎯 Overall Metrics:")
    print(f"   • Total Questions Tested: {len(results_df)}")
    print(f"   • Total Events: {len(df)}")
    print(f"   • Retrieval Accuracy: {retrieval_accuracy:.1f}%")
    print(f"   • Avg Semantic Similarity: {avg_similarity:.1f}%")
    
    # Show per-event results
    print(f"\n📌 Per-Event Accuracy (Top 10):")
    print("-"*60)
    top_events = event_accuracy.nlargest(10, 'Retrieval Accuracy')
    for _, row in top_events.iterrows():
        print(f"   {row['Event'][:35]:<35} | Retrieval: {row['Retrieval Accuracy']:.0f}% | Similarity: {row['Semantic Similarity']:.0f}%")
    
    # Show lowest performing events
    print(f"\n⚠️  Lowest Performing Events:")
    print("-"*60)
    low_events = event_accuracy.nsmallest(5, 'Retrieval Accuracy')
    for _, row in low_events.iterrows():
        print(f"   {row['Event'][:35]:<35} | Retrieval: {row['Retrieval Accuracy']:.0f}% | Similarity: {row['Semantic Similarity']:.0f}%")
    
    # ==================== SAVE RESULTS ====================
    # Create evaluation folder if needed
    eval_dir = os.path.join(os.path.dirname(__file__), '..', 'models', 'evaluation')
    os.makedirs(eval_dir, exist_ok=True)
    
    # Save detailed results
    results_file = os.path.join(eval_dir, 'accuracy_results.csv')
    results_df.to_csv(results_file, index=False)
    print(f"\n✓ Detailed results saved to: {results_file}")
    
    # Save event summary
    event_file = os.path.join(eval_dir, 'event_accuracy.csv')
    event_accuracy.to_csv(event_file, index=False)
    print(f"✓ Event summary saved to: {event_file}")
    
    # ==================== GENERATE CHARTS ====================
    if MATPLOTLIB_AVAILABLE:
        generate_charts(results_df, event_accuracy, eval_dir, retrieval_accuracy, avg_similarity)
    
    # ==================== SUMMARY ====================
    print("\n" + "="*70)
    print("📋 EVALUATION SUMMARY")
    print("="*70)
    print(f"""
    Model Performance:
    ─────────────────────────────────────
    │ Retrieval Accuracy  │  {retrieval_accuracy:5.1f}%    │
    │ Semantic Similarity │  {avg_similarity:5.1f}%    │
    │ Questions Tested    │  {len(results_df):5d}     │
    │ Events Covered      │  {len(df):5d}     │
    ─────────────────────────────────────
    
    Grade: {'A+' if retrieval_accuracy >= 95 else 'A' if retrieval_accuracy >= 90 else 'B+' if retrieval_accuracy >= 85 else 'B' if retrieval_accuracy >= 80 else 'C' if retrieval_accuracy >= 70 else 'D'}
    """)
    
    return results_df, event_accuracy


def generate_charts(results_df, event_accuracy, eval_dir, retrieval_accuracy, avg_similarity):
    """Generate visualization charts"""
    
    print("\n📈 Generating charts...")
    
    # Set style
    plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'ggplot')
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Sri Lankan History Q&A Model - Accuracy Evaluation', fontsize=14, fontweight='bold')
    
    # 1. Overall Metrics Bar Chart
    ax1 = axes[0, 0]
    metrics = ['Retrieval\nAccuracy', 'Semantic\nSimilarity']
    values = [retrieval_accuracy, avg_similarity]
    colors = ['#2ecc71' if v >= 80 else '#f39c12' if v >= 60 else '#e74c3c' for v in values]
    bars = ax1.bar(metrics, values, color=colors, edgecolor='black', linewidth=1.2)
    ax1.set_ylim(0, 100)
    ax1.set_ylabel('Percentage (%)')
    ax1.set_title('Overall Model Performance')
    for bar, val in zip(bars, values):
        ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2, 
                f'{val:.1f}%', ha='center', fontweight='bold')
    
    # 2. Similarity Distribution Histogram
    ax2 = axes[0, 1]
    ax2.hist(results_df['semantic_similarity'] * 100, bins=20, color='#3498db', 
             edgecolor='black', alpha=0.7)
    ax2.axvline(avg_similarity, color='red', linestyle='--', linewidth=2, label=f'Mean: {avg_similarity:.1f}%')
    ax2.set_xlabel('Semantic Similarity (%)')
    ax2.set_ylabel('Number of Questions')
    ax2.set_title('Answer Similarity Distribution')
    ax2.legend()
    
    # 3. Top 15 Events by Accuracy
    ax3 = axes[1, 0]
    top_15 = event_accuracy.nlargest(15, 'Retrieval Accuracy')
    y_pos = range(len(top_15))
    colors = ['#2ecc71' if v >= 80 else '#f39c12' if v >= 60 else '#e74c3c' 
              for v in top_15['Retrieval Accuracy']]
    ax3.barh(y_pos, top_15['Retrieval Accuracy'], color=colors, edgecolor='black')
    ax3.set_yticks(y_pos)
    ax3.set_yticklabels([name[:25] + '...' if len(name) > 25 else name 
                        for name in top_15['Event']], fontsize=8)
    ax3.set_xlabel('Retrieval Accuracy (%)')
    ax3.set_title('Top 15 Events by Accuracy')
    ax3.set_xlim(0, 105)
    
    # 4. Accuracy vs Similarity Scatter
    ax4 = axes[1, 1]
    scatter = ax4.scatter(event_accuracy['Retrieval Accuracy'], 
                         event_accuracy['Semantic Similarity'],
                         c=event_accuracy['Retrieval Accuracy'], 
                         cmap='RdYlGn', s=80, edgecolor='black', alpha=0.7)
    ax4.set_xlabel('Retrieval Accuracy (%)')
    ax4.set_ylabel('Semantic Similarity (%)')
    ax4.set_title('Retrieval Accuracy vs Semantic Similarity')
    ax4.plot([0, 100], [0, 100], 'k--', alpha=0.3, label='Perfect correlation')
    plt.colorbar(scatter, ax=ax4, label='Accuracy %')
    
    plt.tight_layout()
    
    # Save chart
    chart_file = os.path.join(eval_dir, 'accuracy_chart.png')
    plt.savefig(chart_file, dpi=150, bbox_inches='tight')
    print(f"✓ Chart saved to: {chart_file}")
    plt.close()
    
    # Generate summary table image
    generate_summary_table(event_accuracy, eval_dir, retrieval_accuracy, avg_similarity, len(results_df))


def generate_summary_table(event_accuracy, eval_dir, retrieval_accuracy, avg_similarity, total_questions):
    """Generate a summary table as an image"""
    
    fig, ax = plt.subplots(figsize=(10, 8))
    ax.axis('off')
    
    # Title
    title_text = "Model Accuracy Summary"
    fig.suptitle(title_text, fontsize=16, fontweight='bold', y=0.98)
    
    # Overall metrics
    summary_text = f"""
    ╔═══════════════════════════════════════════════════════╗
    ║              OVERALL MODEL PERFORMANCE                ║
    ╠═══════════════════════════════════════════════════════╣
    ║  Retrieval Accuracy:     {retrieval_accuracy:5.1f}%                      ║
    ║  Semantic Similarity:    {avg_similarity:5.1f}%                      ║
    ║  Total Questions:        {total_questions:5d}                       ║
    ║  Total Events:           {len(event_accuracy):5d}                       ║
    ║                                                       ║
    ║  Grade: {'A+ (Excellent)' if retrieval_accuracy >= 95 else 'A (Very Good)' if retrieval_accuracy >= 90 else 'B+ (Good)' if retrieval_accuracy >= 85 else 'B (Satisfactory)' if retrieval_accuracy >= 80 else 'C (Needs Improvement)' if retrieval_accuracy >= 70 else 'D (Poor)':^15}                          ║
    ╚═══════════════════════════════════════════════════════╝
    
    Evaluation Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}
    """
    
    ax.text(0.5, 0.65, summary_text, transform=ax.transAxes, fontsize=11,
            verticalalignment='center', horizontalalignment='center',
            fontfamily='monospace', bbox=dict(boxstyle='round', facecolor='#f0f0f0', alpha=0.8))
    
    # Create table for top events
    top_10 = event_accuracy.nlargest(10, 'Retrieval Accuracy')
    table_data = [[row['Event'][:30], f"{row['Retrieval Accuracy']:.0f}%", f"{row['Semantic Similarity']:.0f}%"] 
                  for _, row in top_10.iterrows()]
    
    table = ax.table(cellText=table_data,
                     colLabels=['Event', 'Retrieval', 'Similarity'],
                     loc='center',
                     cellLoc='center',
                     bbox=[0.1, 0.05, 0.8, 0.45])
    
    table.auto_set_font_size(False)
    table.set_fontsize(9)
    table.scale(1, 1.5)
    
    # Style header
    for i in range(3):
        table[(0, i)].set_facecolor('#3498db')
        table[(0, i)].set_text_props(color='white', fontweight='bold')
    
    # Color rows based on accuracy
    for i, (_, row) in enumerate(top_10.iterrows(), 1):
        color = '#d4edda' if row['Retrieval Accuracy'] >= 90 else '#fff3cd' if row['Retrieval Accuracy'] >= 70 else '#f8d7da'
        for j in range(3):
            table[(i, j)].set_facecolor(color)
    
    plt.tight_layout()
    
    table_file = os.path.join(eval_dir, 'accuracy_table.png')
    plt.savefig(table_file, dpi=150, bbox_inches='tight')
    print(f"✓ Summary table saved to: {table_file}")
    plt.close()


def test_specific_questions():
    """Test specific questions to debug accuracy issues"""
    
    print("\n" + "="*70)
    print("🔬 Testing Specific Questions")
    print("="*70 + "\n")
    
    qa_system = SriLankanHistoryQA()
    
    # Test questions that might be problematic
    test_questions = [
        "Who was King Kassapa?",
        "Tell me about Sigiriya",
        "What is King Dutugemunu?",
        "Tell me about King Dutugemunu",
        "What is the Anuradhapura Kingdom?",
        "When did Buddhism come to Sri Lanka?",
        "Who built Sigiriya?",
    ]
    
    print("Testing questions:\n")
    for question in test_questions:
        print(f"Q: {question}")
        story, info = qa_system.generate_story(question)
        print(f"   Info: {info}")
        print(f"   Answer: {story[:150]}...")
        print()


if __name__ == "__main__":
    print("\n")
    
    # Run main evaluation
    results_df, event_accuracy = evaluate_model()
    
    # Optionally test specific questions
    print("\nWould you like to test specific questions? Running test...")
    test_specific_questions()
    
    print("\n✅ Evaluation complete!")

