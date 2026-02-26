import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile_ai_guide/services/local_storage_service.dart';
import 'package:mobile_ai_guide/services/session_access_service.dart';
import 'package:mobile_ai_guide/ui/api_constants.dart';

class AiGuideService {
  static Future<String> askQuestion({
    required String artifactId,
    required String question,
    String language = 'en',
    String? sessionId,
  }) async {
    try {
      final resolvedSessionId =
          sessionId ?? await SessionAccessService.requireActiveSessionId();
      final url = Uri.parse(
        '${ApiConstants.baseAiModelUrl}${ApiConstants.artifactAskEndpoint}',
      );
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'artifact_id': artifactId,
              'question': question,
              'language': language,
              'session_id': resolvedSessionId,
            }),
          )
          .timeout(
            const Duration(seconds: 60),
            onTimeout: () =>
                throw TimeoutException('Request timed out after 30 seconds'),
          );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        return json['answer'] as String? ?? 'No response received.';
      } else if (response.statusCode == 400) {
        return 'Sorry, this question is not related to this artifact.';
      } else {
        throw Exception('Server error: ${response.statusCode}');
      }
    } on TimeoutException {
      return 'Request timed out. Please try again.';
    } catch (e) {
      return 'Error communicating with AI service: $e';
    }
  }
}

class TimeoutException implements Exception {
  TimeoutException(this.message);
  final String message;
  @override
  String toString() => message;
}
