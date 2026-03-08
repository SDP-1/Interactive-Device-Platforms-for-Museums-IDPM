import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Meshy AI API key for image-to-3D conversion.
String get meshyApiKey {
  const fromEnv = String.fromEnvironment(
    'MESHY_API_KEY',
    defaultValue: '',
  );
  if (fromEnv.isNotEmpty) return fromEnv;
  return dotenv.env['MESHY_API_KEY']?.trim() ?? '';
}
