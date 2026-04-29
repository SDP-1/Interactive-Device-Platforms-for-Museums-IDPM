/// Hugging Face API key for 2D reconstruction (inpainting).

const String hfApiKey = String.fromEnvironment(
  'HF_API_KEY',
  defaultValue: '',
);


/// Get a key
const String geminiApiKey = String.fromEnvironment(
  'GEMINI_API_KEY',
  defaultValue: '',
);

/// List models: GET
const String geminiModelId = String.fromEnvironment(
  'GEMINI_MODEL_ID',
  defaultValue: '',
);
