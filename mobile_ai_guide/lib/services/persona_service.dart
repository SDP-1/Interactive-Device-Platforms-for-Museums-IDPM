import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile_ai_guide/models/persona.dart';
import 'package:mobile_ai_guide/ui/api_constants.dart';

class PersonaService {
  PersonaService._();

  /// Get list of available personas (kings)
  static Future<List<Persona>> getPersonas({String language = 'en'}) async {
    try {
      final url = Uri.parse(
        '${ApiConstants.baseAiModelUrl}/personas?language=$language',
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final personas = data['personas'] as List<dynamic>;
        return personas
            .map((json) => Persona.fromJson(json as Map<String, dynamic>))
            .toList();
      } else {
        throw Exception(
          'Failed to load personas: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error fetching personas: $e');
    }
  }

  /// Get detailed information about a specific persona
  static Future<Persona> getPersona({
    required String kingId,
    String language = 'en',
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConstants.baseAiModelUrl}/persona/$kingId?language=$language',
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return Persona.fromJson(data);
      } else if (response.statusCode == 404) {
        throw Exception('Persona not found');
      } else {
        throw Exception(
          'Failed to load persona: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error fetching persona: $e');
    }
  }

  /// Ask a question to a historical persona
  static Future<String> askPersona({
    required String kingId,
    required String question,
    String language = 'en',
  }) async {
    try {
      final url = Uri.parse('${ApiConstants.baseAiModelUrl}/persona/ask');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'king_id': kingId,
          'question': question,
          'language': language,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return data['answer'] as String;
      } else {
        throw Exception(
          'Failed to ask persona: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error asking persona: $e');
    }
  }
}
