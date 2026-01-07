import os
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer
from functools import lru_cache

class ArtifactAIExplainer:
    def __init__(self, model_dir='t5_artifact_explainer'):
        self.model_dir = model_dir
        self.device = 'cpu' # Force CPU for quantization stability
        
        print("Loading T5 tokenizer...")
        self.tokenizer = T5Tokenizer.from_pretrained(model_dir)
        
        print("Loading T5 model...")
        self.model = T5ForConditionalGeneration.from_pretrained(model_dir)
        
        # Apply Dynamic Quantization (Magic fix for CPU speed)
        # This converts weights to 8-bit integers, making the model 40-50% smaller 
        # and 2-3x faster on CPU with minimal quality loss.
        print("Applying dynamic quantization to model...")
        try:
            self.model = torch.quantization.quantize_dynamic(
                self.model, {torch.nn.Linear}, dtype=torch.qint8
            )
            print("✓ Model quantized successfully")
        except Exception as e:
            print(f"⚠ Quantization failed: {e}")

        self.model.eval()

    @lru_cache(maxsize=100)
    def explain(self, artifact: dict, max_length=512) -> str:
        # Create a hashable string representation for caching since dicts aren't hashable
        # This is a bit of a hack but ensures the cache works based on content
        artifact_key = f"{artifact['name']}|{artifact['category']}|{artifact['origin']}|{artifact['era']}"
        return self._explain_internal(artifact_key, str(artifact), max_length)

    def _explain_internal(self, key, artifact_str, max_length):
        # Reconstruct dict from string is unsafe/hard, so we just use the original logic
        # But we need to pass the dict. So let's refactor slightly.
        # Actually, let's use a simpler wrapper.
        pass

    @lru_cache(maxsize=100)
    def _generate_explanation(self, input_text, max_length):
        input_ids = self.tokenizer.encode(input_text, return_tensors='pt', max_length=512, truncation=True).to(self.device)
        
        with torch.no_grad():
            output = self.model.generate(
                input_ids,
                max_length=max_length,
                min_length=100,
                num_beams=4, # Kept as requested by user
                early_stopping=True,
                no_repeat_ngram_size=3,
                length_penalty=2.0
            )
        return self.tokenizer.decode(output[0], skip_special_tokens=True)

    def explain(self, artifact: dict, max_length=512) -> str:
        input_text = f"Explain this artifact: {artifact['name']} | Category: {artifact['category']} | Origin: {artifact['origin']} | Era: {artifact['era']} | Materials: {artifact['materials']} | Function: {artifact['function']} | Symbolism: {artifact['symbolism']} | Notes: {artifact['notes']}"
        
        # Call the cached worker method
        explanation = self._generate_explanation(input_text, max_length)
        return explanation.strip() if explanation.strip() else self._fallback_explanation(artifact)
    
    def _fallback_explanation(self, artifact: dict) -> str:
        """Fallback to template-based explanation if model fails"""
        return f"""{artifact['name']}

Overview
This {artifact['category'].lower()} originates from {artifact['origin']} and dates to {artifact['era']}.

Materials and Craftsmanship
{artifact['materials']}

Function and Use
{artifact['function']}

Cultural Significance
{artifact['symbolism']}

Special Features
{artifact['notes']}

This artifact represents an important piece of cultural heritage, showcasing the craftsmanship, beliefs, and practices of its time and place."""
