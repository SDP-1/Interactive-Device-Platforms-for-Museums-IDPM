import os
from dotenv import load_dotenv

load_dotenv()

class AIExplainer:
    def __init__(self):
        self.use_openai = os.getenv('OPENAI_API_KEY') is not None
        if self.use_openai:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            except ImportError:
                self.use_openai = False
    
    def explain_artifact(self, artifact):
        """
        Generate AI explanation for an artifact.
        Priority: T5 Fine-tuned Model > OpenAI API > Template
        """
        # Try local fine-tuned T5 model FIRST
        try:
            from artifact_ai_explainer import ArtifactAIExplainer
            if not hasattr(self, '_artifact_ai_explainer'):
                self._artifact_ai_explainer = ArtifactAIExplainer()
            explanation = self._artifact_ai_explainer.explain(artifact)
            if explanation and len(explanation.strip()) > 50:
                return explanation
        except Exception as e:
            print(f"T5 model not available: {e}")
        
        # Fall back to OpenAI if T5 fails
        if self.use_openai:
            return self._explain_with_openai(artifact)
        
        # Last resort: template
        return self._explain_with_template(artifact)
    
    def compare_artifacts(self, artifact1, artifact2):
        """Generate AI comparison between two artifacts"""
        if self.use_openai:
            return self._compare_with_openai(artifact1, artifact2)
        else:
            return self._compare_with_template(artifact1, artifact2)
    
    def _explain_with_openai(self, artifact):
        """Use OpenAI API for explanation"""
        prompt = f"""Provide a detailed, engaging explanation of this artifact in English:

Name: {artifact['name']}
Category: {artifact['category']}
Origin: {artifact['origin']}
Era: {artifact['era']}
Materials: {artifact['materials']}
Function: {artifact['function']}
Symbolism: {artifact['symbolism']}
Special Features: {artifact['notes']}

Write a comprehensive explanation covering:
1. Historical context and significance
2. Materials and craftsmanship
3. Function and use
4. Cultural and symbolic meaning
5. Notable features

Make it engaging and educational for museum visitors."""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a museum curator providing detailed explanations of cultural artifacts. Do not use markdown formatting like # or ** in your response. Use plain text only."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            text = response.choices[0].message.content
            return self._remove_markdown(text)
        except Exception as e:
            return self._explain_with_template(artifact)
    
    def _explain_with_template(self, artifact):
        """Generate explanation using template when AI is not available"""
        explanation = f"""
{artifact['name']}

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

This artifact represents an important piece of cultural heritage, showcasing the craftsmanship, beliefs, and practices of its time and place.
        """.strip()
        return explanation
    
    def _compare_with_openai(self, artifact1, artifact2):
        """Use OpenAI API for comparison"""
        prompt = f"""Compare these two artifacts in English, highlighting similarities and differences:

**Artifact 1: {artifact1['name']}**
- Origin: {artifact1['origin']}
- Era: {artifact1['era']}
- Category: {artifact1['category']}
- Materials: {artifact1['materials']}
- Function: {artifact1['function']}
- Symbolism: {artifact1['symbolism']}

**Artifact 2: {artifact2['name']}**
- Origin: {artifact2['origin']}
- Era: {artifact2['era']}
- Category: {artifact2['category']}
- Materials: {artifact2['materials']}
- Function: {artifact2['function']}
- Symbolism: {artifact2['symbolism']}

Provide a detailed comparison covering:
1. Design similarities and differences
2. Material and craftsmanship comparison
3. Functional purposes
4. Ceremonial/ritual use
5. Historical context
6. Cultural symbolism
7. Cross-cultural connections

Make it insightful and educational."""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a museum curator providing detailed cross-cultural comparisons of artifacts. Do not use markdown formatting like # or ** in your response. Use plain text only."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.7
            )
            comparison_text = response.choices[0].message.content
            comparison_text = self._remove_markdown(comparison_text)
            
            return {
                'artifact1': artifact1,
                'artifact2': artifact2,
                'comparison': comparison_text,
                'similarities': self._extract_similarities(artifact1, artifact2),
                'differences': self._extract_differences(artifact1, artifact2)
            }
        except Exception as e:
            return self._compare_with_template(artifact1, artifact2)
    
    def _compare_with_template(self, artifact1, artifact2):
        """Generate comparison using template"""
        comparison = f"""
Comparison: {artifact1['name']} vs {artifact2['name']}

Design Comparison
Both artifacts share similar functions as {artifact1['category'].lower()}s, though they originate from different cultural contexts: {artifact1['origin']} and {artifact2['origin']}.

Materials
{artifact1['name']}: {artifact1['materials']}
{artifact2['name']}: {artifact2['materials']}

Functional Purposes
{artifact1['name']}: {artifact1['function'][:200]}...
{artifact2['name']}: {artifact2['function'][:200]}...

Cultural Significance
{artifact1['name']}: {artifact1['symbolism'][:200]}...
{artifact2['name']}: {artifact2['symbolism'][:200]}...

Historical Context
These artifacts represent different cultural approaches to similar needs, showcasing both unique regional characteristics and universal human practices.
        """.strip()
        
        return {
            'artifact1': artifact1,
            'artifact2': artifact2,
            'comparison': comparison,
            'similarities': self._extract_similarities(artifact1, artifact2),
            'differences': self._extract_differences(artifact1, artifact2)
        }
    
    def _extract_similarities(self, artifact1, artifact2):
        """Extract key similarities"""
        similarities = []
        if artifact1['category'] == artifact2['category']:
            similarities.append('Same category/type')
        if artifact1['era'] and artifact2['era']:
            similarities.append('Similar historical periods')
        return similarities
    
    def _extract_differences(self, artifact1, artifact2):
        """Extract key differences"""
        differences = []
        if artifact1['origin'] != artifact2['origin']:
            differences.append(f"Different origins: {artifact1['origin']} vs {artifact2['origin']}")
        if artifact1['materials'] != artifact2['materials']:
            differences.append('Different materials used')
        return differences
    
    def _remove_markdown(self, text):
        """Remove markdown formatting from text"""
        import re
        # Remove headers (# ## ###)
        text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
        # Remove bold (**text**)
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        # Remove italic (*text*)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        # Remove links [text](url)
        text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
        return text

