import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Meshy AI API key for image-to-3D conversion.
/// Set in assets/.env.example as MESHY_API_KEY=your_key, or at run time:
///   flutter run --dart-define=MESHY_API_KEY=your_key
/// Get a key at https://www.meshy.ai/settings/api
String get meshyApiKey {
  const fromEnv = String.fromEnvironment(
    'MESHY_API_KEY',
    defaultValue: '',
  );
  if (fromEnv.isNotEmpty) return fromEnv;
  return dotenv.env['MESHY_API_KEY']?.trim() ?? '';
}
