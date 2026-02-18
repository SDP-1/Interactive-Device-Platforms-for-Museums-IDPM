"""
AI Explainer with Trained Model Support
Uses local trained model for artifact comparison when available
Falls back to OpenAI API or templates
"""

import os
import re
import sys
import json
import base64
import subprocess
import threading
import time
from dotenv import load_dotenv
from typing import Dict, Optional

load_dotenv()


class ModelServiceClient:
    """Client for communicating with the model service subprocess"""
    
    def __init__(self):
        self.process = None
        self.is_ready = False
        self.artifact_count = 0
        self._start_service()
    
    def _start_service(self):
        """Start the model service subprocess"""
        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            service_path = os.path.join(script_dir, "model_service.py")
            
            # Use PIPE for stdin/stdout, redirect stderr to stdout
            self.process = subprocess.Popen(
                [sys.executable, "-u", service_path],  # -u for unbuffered
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                cwd=script_dir
            )
            
            # Wait for ready signal with timeout
            import select
            import time
            
            start_time = time.time()
            timeout = 60  # Give model 60 seconds to load
            
            while time.time() - start_time < timeout:
                if self.process.poll() is not None:
                    # Process ended
                    break
                
                # Try to read a line
                try:
                    line = self.process.stdout.readline()
                    if line:
                        line = line.strip()
                        # Skip non-JSON output (loading messages)
                        if line.startswith('{'):
                            response = json.loads(line)
                            if response.get("status") == "ready":
                                self.is_ready = True
                                self.artifact_count = response.get("artifacts", 0)
                                print(f"✓ Model service started with {self.artifact_count} artifacts")
                                return
                            elif "error" in response:
                                print(f"⚠ Model service error: {response['error']}")
                                break
                except json.JSONDecodeError:
                    continue  # Skip non-JSON lines
                except Exception as e:
                    print(f"Read error: {e}")
                    continue
            
            if not self.is_ready:
                print("⚠ Model service timed out or failed to start")
                self._cleanup()
                
        except Exception as e:
            print(f"⚠ Could not start model service: {e}")
            self._cleanup()
    
    def _read_response(self, timeout=30):
        """Read a JSON response from the subprocess"""
        try:
            if self.process and self.process.stdout:
                import time
                start = time.time()
                while time.time() - start < timeout:
                    line = self.process.stdout.readline()
                    if line:
                        line = line.strip()
                        if line.startswith('{'):
                            return json.loads(line)
                    if self.process.poll() is not None:
                        break
        except Exception as e:
            print(f"Error reading from model service: {e}")
        return None
    
    def _send_request(self, request: dict) -> Optional[dict]:
        """Send a request to the model service"""
        if not self.is_ready or not self.process:
            return None
        
        try:
            self.process.stdin.write(json.dumps(request) + "\n")
            self.process.stdin.flush()
            return self._read_response()
        except Exception as e:
            print(f"Error communicating with model service: {e}")
            return None
    
    def compare(self, artifact1_id: str, artifact2_id: str) -> Optional[dict]:
        """Compare two artifacts using the trained model"""
        return self._send_request({
            "action": "compare",
            "artifact1_id": artifact1_id,
            "artifact2_id": artifact2_id
        })
    
    def find_similar(self, artifact_id: str, top_k: int = 5) -> Optional[list]:
        """Find similar artifacts"""
        return self._send_request({
            "action": "similar",
            "artifact_id": artifact_id,
            "top_k": top_k
        })
    
    def get_status(self) -> dict:
        """Get model status"""
        if not self.is_ready:
            return {"model_trained": False}
        result = self._send_request({"action": "status"})
        return result if result else {"model_trained": False}
    
    def _cleanup(self):
        """Clean up the subprocess"""
        self.is_ready = False
        if self.process:
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
            except:
                pass
            self.process = None
    
    def __del__(self):
        """Cleanup on deletion"""
        self._cleanup()

class AIExplainer:
    def __init__(self, preload_model=True):
        """Initialize the AI Explainer with model support"""
        # Check for OpenAI API
        self.use_openai = os.getenv('OPENAI_API_KEY') is not None
        self.client = None
        
        if self.use_openai:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            except ImportError:
                self.use_openai = False
        
        # Model service client (runs in subprocess to avoid DLL issues)
        self.model_service = None
        self.trained_model = None  # For backwards compatibility
        self._model_load_attempted = False
        
        # T5 Model state
        self._artifact_ai_explainer = None
        self._model_loading = False
        self._model_ready = False
        
        # BACKGROUND PRELOAD: Start loading everything in background
        print("⏳ Starting background initialization...")
        threading.Thread(target=self._background_init, daemon=True).start()
    
    def _background_init(self):
        """Run all heavy initialization in a background thread"""
        # 1. Start Support Service (Subprocess)
        print("📥 [Background] Starting comparison service...")
        self._start_model_service()
        
        # 2. Load T5 Model
        self._preload_explainer()

    def _preload_explainer(self):
        """Load and warm up the T5 model"""
        try:
            from artifact_ai_explainer import ArtifactAIExplainer
            print("📥 [Background] Loading T5 model (this may take a few seconds)...")
            start_time = time.time()
            
            # Load the model
            explainer = ArtifactAIExplainer()
            
            # WARM UP: Run one dummy explanation
            print("🔥 [Background] Warming up model with proper inference...")
            dummy = {
                'name': 'Warmup', 'category': 'Test', 'origin': 'Test', 
                'era': 'Test', 'materials': 'Test', 'function': 'Test', 
                'symbolism': 'Test', 'notes': 'Test'
            }
            explainer.explain(dummy)
            
            self._artifact_ai_explainer = explainer
            self._model_ready = True
            
            elapsed = time.time() - start_time
            print(f"✅ [Background] T5 Model loaded & warmed up in {elapsed:.2f}s! Ready for instant answers.")
            
        except Exception as e:
            print(f"❌ [Background] Model load failed: {e}")
    
    def _start_model_service(self):
        """Start the model service subprocess"""
        if self._model_load_attempted:
            return
        
        self._model_load_attempted = True
        try:
            self.model_service = ModelServiceClient()
            if self.model_service.is_ready:
                # Create a dummy trained_model for backwards compatibility checks
                self.trained_model = type('TrainedModel', (), {
                    'is_trained': True,
                    'artifacts': [None] * self.model_service.artifact_count,
                    'model_name': 'all-MiniLM-L6-v2',
                    'clusters': True
                })()
        except Exception as e:
            print(f"⚠ Could not start model service: {e}")
            self.model_service = None
    
    def _load_trained_model(self):
        """Backwards compatibility - now starts the service instead"""
        self._start_model_service()
    
    def explain_artifact(self, artifact: Dict) -> str:
        """
        Generate AI explanation for an artifact.
        Priority: T5 Fine-tuned Model > OpenAI API > Template
        """
        print(f"\n{'='*60}")
        print(f"Generating explanation for: {artifact.get('name', 'Unknown')}")
        print(f"{'='*60}")
        
        # Try local fine-tuned T5 model FIRST (best quality, offline, free)
        try:
            # Wait for model if it's still loading (should be done by the time user clicks)
            if not self._model_ready:
                print("⏳ Model still loading in background... waiting...")
                # Wait up to 10 seconds for it to finish
                for _ in range(10):
                    if self._model_ready: break
                    time.sleep(1)
            
            if self._model_ready and self._artifact_ai_explainer:
                print("🤖 Generating explanation using T5 model...")
                explanation = self._artifact_ai_explainer.explain(artifact)
                
                if explanation and len(explanation.strip()) > 50:  # Valid explanation
                    print(f"✅ SUCCESS: Generated {len(explanation)} characters using T5 model")
                    print(f"Preview: {explanation[:100]}...")
                    return explanation
                else:
                    print(f"⚠ T5 generated short/empty output, trying fallback")
        except Exception as e:
            print(f"❌ T5 model error: {type(e).__name__}: {str(e)[:100]}")
        
        # Fall back to OpenAI if T5 fails
        if self.use_openai and self.client:
            print("🌐 Using OpenAI API for explanation...")
            result = self._explain_with_openai(artifact)
            print("✅ Generated explanation using OpenAI")
            return result
        
        # Last resort: template-based
        print("📝 Using template-based explanation (fallback)")
        return self._explain_with_template(artifact)
    
    def compare_artifacts(self, artifact1: Dict, artifact2: Dict) -> Dict:
        """
        Generate AI comparison between two artifacts.
        Priority: Trained Model > OpenAI API > Template
        """
        # Lazy load trained model on first comparison
        if not self._model_load_attempted:
            self._load_trained_model()
        
        # Use trained model if available (fastest and works offline)
        if self.trained_model and self.trained_model.is_trained:
            return self._compare_with_trained_model(artifact1, artifact2)
        
        # Fall back to OpenAI if available
        if self.use_openai and self.client:
            return self._compare_with_openai(artifact1, artifact2)
        
        # Last resort: template-based comparison
        return self._compare_with_template(artifact1, artifact2)
    
    def _compare_with_trained_model(self, artifact1: Dict, artifact2: Dict) -> Dict:
        """Use the trained model service for comparison (real-time, no API needed)"""
        try:
            # Use the model service subprocess
            if self.model_service and self.model_service.is_ready:
                comparison = self.model_service.compare(artifact1['id'], artifact2['id'])
                
                if comparison and 'error' not in comparison:
                    # Ensure consistent response format
                    return {
                        'artifact1': artifact1,
                        'artifact2': artifact2,
                        'comparison': comparison.get('comparison', ''),
                        'similarities': comparison.get('similarities', []),
                        'differences': comparison.get('differences', []),
                        'similarity_score': comparison.get('similarity_score', 0),
                        'relationship_type': comparison.get('relationship_type', 'unknown'),
                        'same_cluster': comparison.get('same_cluster', False),
                        'source': 'trained_model'
                    }
            
            raise Exception("Model service not available")
            
        except Exception as e:
            print(f"Trained model error: {e}, falling back to template")
            return self._compare_with_template(artifact1, artifact2)
    
    def _explain_with_openai(self, artifact: Dict) -> str:
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
            print(f"OpenAI error: {e}")
            return self._explain_with_template(artifact)
    
    def _explain_with_template(self, artifact: Dict) -> str:
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
    
    def _compare_with_openai(self, artifact1: Dict, artifact2: Dict) -> Dict:
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
                'differences': self._extract_differences(artifact1, artifact2),
                'source': 'openai'
            }
        except Exception as e:
            print(f"OpenAI error: {e}")
            return self._compare_with_template(artifact1, artifact2)
    
    def _compare_with_template(self, artifact1: Dict, artifact2: Dict) -> Dict:
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
            'differences': self._extract_differences(artifact1, artifact2),
            'source': 'template'
        }
    
    def _extract_similarities(self, artifact1: Dict, artifact2: Dict) -> list:
        """Extract key similarities"""
        similarities = []
        if artifact1['category'] == artifact2['category']:
            similarities.append(f"Both are {artifact1['category']}s")
        if artifact1['origin'] == artifact2['origin']:
            similarities.append(f"Both originate from {artifact1['origin']}")
        if artifact1.get('era') and artifact2.get('era'):
            similarities.append('Similar historical periods')
        
        # Find common materials
        mat1 = artifact1.get('materials', '').lower()
        mat2 = artifact2.get('materials', '').lower()
        common_mats = []
        for material in ['gold', 'silver', 'bronze', 'brass', 'wood', 'stone', 'iron', 'steel']:
            if material in mat1 and material in mat2:
                common_mats.append(material)
        if common_mats:
            similarities.append(f"Share common materials: {', '.join(common_mats)}")
        
        return similarities if similarities else ["These artifacts represent distinct cultural traditions"]
    
    def _extract_differences(self, artifact1: Dict, artifact2: Dict) -> list:
        """Extract key differences"""
        differences = []
        if artifact1['origin'] != artifact2['origin']:
            differences.append(f"Different origins: {artifact1['origin']} vs {artifact2['origin']}")
        if artifact1['category'] != artifact2['category']:
            differences.append(f"Different types: {artifact1['category']} vs {artifact2['category']}")
        if artifact1['materials'] != artifact2['materials']:
            differences.append('Different primary materials used')
        if artifact1.get('era') != artifact2.get('era'):
            differences.append(f"Different time periods: {artifact1.get('era', 'Unknown')} vs {artifact2.get('era', 'Unknown')}")
        return differences if differences else ["These artifacts share remarkable similarities"]
    
    def compare_artifacts_visual(self, artifact1: Dict, artifact2: Dict, image1: str, image2: str) -> Dict:
        """
        Compare two artifacts visually using GPT-4 Vision API
        
        Args:
            artifact1: First artifact metadata
            artifact2: Second artifact metadata
            image1: Path to first artifact image
            image2: Path to second artifact image
            
        Returns:
            Dictionary with visual comparison results
        """
        if not self.use_openai:
            return {
                'error': 'OpenAI API not available',
                'message': 'Visual comparison requires OpenAI API key',
                'source': 'error'
            }
        
        try:
            # Load and encode images as base64
            image1_base64 = self._encode_image(image1)
            image2_base64 = self._encode_image(image2)
            
            # Create structured prompt for GPT-4 Vision
            prompt = f"""You are an expert art historian analyzing cultural artifacts. Compare these two artifacts visually across specific dimensions.

Artifact A: {artifact1['name']} ({artifact1['origin']}, {artifact1['era']})
Artifact B: {artifact2['name']} ({artifact2['origin']}, {artifact2['era']})

Analyze and compare these artifacts across the following dimensions. For each dimension, provide separate descriptions for Artifact A and Artifact B.

Return your analysis as a JSON object with this exact structure:
{{
  "shape_form": {{
    "artifact_a": "Description of Artifact A's shape, silhouette, and proportions",
    "artifact_b": "Description of Artifact B's shape, silhouette, and proportions"
  }},
  "color_texture": {{
    "artifact_a": "Description of Artifact A's color palette, finish, and aging",
    "artifact_b": "Description of Artifact B's color palette, finish, and aging"
  }},
  "design_motifs": {{
    "artifact_a": "Description of Artifact A's patterns, decorations, and iconography",
    "artifact_b": "Description of Artifact B's patterns, decorations, and iconography"
  }},
  "craftsmanship": {{
    "artifact_a": "Description of Artifact A's technique and manufacturing quality",
    "artifact_b": "Description of Artifact B's technique and manufacturing quality"
  }},
  "overall_impression": {{
    "artifact_a": "Overall visual impression and aesthetic of Artifact A",
    "artifact_b": "Overall visual impression and aesthetic of Artifact B"
  }}
}}

Provide detailed, specific observations based on what you see in the images."""
            
            # Call GPT-4 Vision API (using gpt-4o which has vision capabilities)
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image1_base64}",
                                    "detail": "high"
                                }
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image2_base64}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1500,
                temperature=0.7
            )
            
            # Parse response
            response_text = response.choices[0].message.content
            
            # Extract JSON from response (in case there's extra text)
            try:
                # Try to find JSON in the response
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    visual_data = json.loads(json_str)
                else:
                    visual_data = json.loads(response_text)
            except json.JSONDecodeError:
                # If JSON parsing fails, return raw text
                return {
                    'error': 'Failed to parse GPT-4 Vision response',
                    'raw_response': response_text,
                    'source': 'openai_vision'
                }
            
            return {
                'artifact1': artifact1,
                'artifact2': artifact2,
                'visual_comparison': visual_data,
                'source': 'openai_vision',
                'success': True
            }
            
        except Exception as e:
            print(f"Visual comparison error: {e}")
            return {
                'error': f'Visual comparison failed: {str(e)}',
                'source': 'error'
            }
    
    def _encode_image(self, image_path: str) -> str:
        """
        Encode image file as base64 string
        
        Args:
            image_path: Path to image file (can be relative or absolute)
            
        Returns:
            Base64 encoded string
        """
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # If already absolute and exists, use it
        if os.path.isabs(image_path) and os.path.exists(image_path):
            final_path = image_path
        else:
            # Try multiple possible locations
            possible_paths = [
                # Frontend public folder (primary location)
                os.path.join(script_dir, 'frontend', 'public', image_path),
                os.path.join(script_dir, 'frontend', 'public', 'images', os.path.basename(image_path)),
                # Static folder (fallback)
                os.path.join(script_dir, 'static', image_path),
                os.path.join(script_dir, 'static', 'images', os.path.basename(image_path)),
                # Direct path
                os.path.join(script_dir, image_path)
            ]
            
            final_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    final_path = path
                    break
            
            if not final_path:
                # Debug info for troubleshooting
                tried_paths = '\n  - '.join(possible_paths)
                raise FileNotFoundError(
                    f"Image not found. Original path: {image_path}\n"
                    f"Tried:\n  - {tried_paths}"
                )
        
        with open(final_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def _remove_markdown(self, text: str) -> str:
        """Remove markdown formatting from text"""
        # Remove headers (# ## ###)
        text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
        # Remove bold (**text**)
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        # Remove italic (*text*)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        # Remove links [text](url)
        text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
        return text


# For backwards compatibility and testing
if __name__ == '__main__':
    explainer = AIExplainer()
    print(f"OpenAI available: {explainer.use_openai}")
    print(f"Trained model available: {explainer.trained_model is not None}")
