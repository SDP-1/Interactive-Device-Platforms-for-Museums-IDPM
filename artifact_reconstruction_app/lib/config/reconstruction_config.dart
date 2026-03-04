/// Hugging Face API key for 2D reconstruction (inpainting).
///
/// Set via: flutter run --dart-define=HF_API_KEY=your_hf_token
/// Or for release: flutter build apk --dart-define=HF_API_KEY=your_hf_token
/// Never commit real keys to version control.
const String hfApiKey = String.fromEnvironment(
  'HF_API_KEY',
  defaultValue: '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',
);
