import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Hugging Face API key for 2D reconstruction (inpainting).
String get hfApiKey {
  const fromEnv = String.fromEnvironment(
    'HF_API_KEY',
    defaultValue: '',
  );
  if (fromEnv.isNotEmpty) return fromEnv;
  return dotenv.env['HF_API_KEY']?.trim() ?? '';
}

/// Gemini API key for image reconstruction.
String get geminiApiKey {
  const fromEnv = String.fromEnvironment(
    'GEMINI_API_KEY',
    defaultValue: '',
  );
  if (fromEnv.isNotEmpty) return fromEnv;
  return dotenv.env['GEMINI_API_KEY']?.trim() ?? '';
}

/// Optional model id override.
String get geminiModelId {
  const fromEnv = String.fromEnvironment(
    'GEMINI_MODEL_ID',
    defaultValue: '',
  );
  if (fromEnv.isNotEmpty) return fromEnv;
  return dotenv.env['GEMINI_MODEL_ID']?.trim() ?? '';
}
