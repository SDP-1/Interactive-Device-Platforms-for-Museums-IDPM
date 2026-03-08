import 'package:flutter_dotenv/flutter_dotenv.dart';

/// API configuration sourced from .env (see .env for defaults).
class ApiConstants {
  ApiConstants._();

  static String? baseAiModelUrl = dotenv.env['BASE_AI_MODEL_URL'];

  static String? baseBackendUrl = dotenv.env['BASE_BACKEND_URL'];

  static const String artifactAskEndpoint = '/artifact/ask';
  static const String artifactEndpoint = '/api/artifacts';
  static const String featuredExhibitsEndpoint = '/api/featured-exhibits';
  static const String sessionEndpoint = '/api/sessions';
}
