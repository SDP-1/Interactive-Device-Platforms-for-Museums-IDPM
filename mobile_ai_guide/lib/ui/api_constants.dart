import 'package:flutter_dotenv/flutter_dotenv.dart';

/// API configuration sourced from .env (see .env for defaults).
class ApiConstants {
  ApiConstants._();

  static String get baseAiModelUrl =>
      dotenv.env['BASE_AI_MODEL_URL'] ?? 'http://localhost:8000';

  static String get baseBackendUrl =>
      dotenv.env['BASE_BACKEND_URL'] ?? 'http://localhost:5000';

  static const String artifactAskEndpoint = '/artifact/ask';
  static const String artifactEndpoint = '/api/artifacts';
}
