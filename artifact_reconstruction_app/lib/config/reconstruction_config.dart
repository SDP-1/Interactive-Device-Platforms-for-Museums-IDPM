/// Hugging Face API key for 2D reconstruction (inpainting).

const String hfApiKey = String.fromEnvironment(
  'HF_API_KEY',
  defaultValue: '',
);


/// Get a key at: https://aistudio.google.com/app/apikey
const String geminiApiKey = String.fromEnvironment(
  'GEMINI_API_KEY',
  defaultValue: '',
);

/// List models: GET https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY
const String geminiModelId = String.fromEnvironment(
  'GEMINI_MODEL_ID',
  defaultValue: '',
);
