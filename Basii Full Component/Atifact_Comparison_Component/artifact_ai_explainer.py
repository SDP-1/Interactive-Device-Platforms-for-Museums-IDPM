import os
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer
from functools import lru_cache

class ArtifactAIExplainer:
    def __init__(self, model_dir='t5_artifact_explainer'):
        # Root path resolution
        self.model_dir = model_dir
        self.device = 'cpu' # Force CPU for quantization stability
        
        print(f"Loading T5 model from: {model_dir}")
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
    def _generate_explanation(self, input_text, max_length):
        input_ids = self.tokenizer.encode(input_text, return_tensors='pt', max_length=512, truncation=True).to(self.device)
        
        with torch.no_grad():
            output = self.model.generate(
                input_ids,
                max_length=max_length,
                min_length=100,
                num_beams=4,
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

    def compare_artifacts(self, artifact1: dict, artifact2: dict) -> str:
        """Build a comparison narrative using T5-generated content for each artifact."""
        input1 = f"Explain this artifact: {artifact1['name']} | Category: {artifact1['category']} | Origin: {artifact1['origin']} | Era: {artifact1['era']} | Materials: {artifact1['materials']} | Function: {artifact1['function']} | Symbolism: {artifact1['symbolism']} | Notes: {artifact1.get('notes', '')}"
        input2 = f"Explain this artifact: {artifact2['name']} | Category: {artifact2['category']} | Origin: {artifact2['origin']} | Era: {artifact2['era']} | Materials: {artifact2['materials']} | Function: {artifact2['function']} | Symbolism: {artifact2['symbolism']} | Notes: {artifact2.get('notes', '')}"

        raw1 = self._generate_explanation(input1, max_length=300).strip()
        raw2 = self._generate_explanation(input2, max_length=300).strip()

        craft1 = self._extract_section(raw1, 'Materials and Craftsmanship') or artifact1['materials']
        craft2 = self._extract_section(raw2, 'Materials and Craftsmanship') or artifact2['materials']

        sections = [
            "Design and Craftsmanship",
            f"{artifact1['name']}: {craft1}",
            "",
            f"{artifact2['name']}: {craft2}",
            "",
            "Cultural Context",
            (
                f"Both artifacts emerge from {artifact1['origin']}, sharing cultural values and artistic traditions."
                if artifact1['origin'] == artifact2['origin']
                else f"While the {artifact1['name']} originates from {artifact1['origin']}, "
                     f"the {artifact2['name']} comes from {artifact2['origin']}. "
                     f"This comparison illuminates how different cultures addressed similar human needs."
            ),
            "",
            "Symbolic Significance",
            f"{artifact1['name']}: {artifact1['symbolism'][:220]}{'...' if len(artifact1['symbolism']) > 220 else ''}",
            f"{artifact2['name']}: {artifact2['symbolism'][:220]}{'...' if len(artifact2['symbolism']) > 220 else ''}",
        ]
        return "\n".join(sections)

    def _extract_section(self, text: str, section_title: str) -> str:
        """Extract the content of a named section from T5 output."""
        import re
        header_pattern = re.compile(r'^([A-Z][A-Za-z &/\-]+)$', re.MULTILINE)
        parts = header_pattern.split(text)
        for i, part in enumerate(parts):
            if part.strip() == section_title and i + 1 < len(parts):
                content = parts[i + 1].strip()
                return content if content else ''
        return ''
    
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
