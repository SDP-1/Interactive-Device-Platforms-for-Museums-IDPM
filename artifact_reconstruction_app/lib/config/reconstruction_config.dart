/// Hugging Face API key for 2D reconstruction (inpainting).
///
/// Set via: flutter run --dart-define=HF_API_KEY=your_hf_token
/// Or for release: flutter build apk --dart-define=HF_API_KEY=your_hf_token
/// Never commit real keys to version control.
const String hfApiKey = String.fromEnvironment(
  'HF_API_KEY',
  defaultValue: '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',
);

/// Gemini API key for 2D reconstruction (image + prompt → image).
/// When set, the app uses Gemini instead of Hugging Face for reconstruction.
///
/// Pass at run time so the correct key is always used (avoids stale builds):
///   flutter run --dart-define=GEMINI_API_KEY=your_gemini_key
///   flutter build apk --dart-define=GEMINI_API_KEY=your_gemini_key
/// Get a key at: https://aistudio.google.com/app/apikey
/// New free accounts still have quota limits; 429 = enable billing or use HF (omit key).
const String geminiApiKey = String.fromEnvironment(
  'GEMINI_API_KEY',
  defaultValue: '',
);

/// Optional. Gemini model ID for reconstruction (e.g. image-capable model).
/// If empty, the service uses its default. Override if you get 404 (model not found).
/// List models: GET https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY
const String geminiModelId = String.fromEnvironment(
  'GEMINI_MODEL_ID',
  defaultValue: '',
);
