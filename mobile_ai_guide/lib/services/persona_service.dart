import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile_ai_guide/models/persona.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';
import 'package:mobile_ai_guide/services/session_access_service.dart';
import 'package:mobile_ai_guide/ui/api_constants.dart';

class PersonaService {
  PersonaService._();

  /// Get list of available personas (kings)
  static Future<List<Persona>> getPersonas({String language = 'en'}) async {
    await LocalStorageService.instance.initialize();
    await SessionAccessService.requireActiveSession();
    final cachedList = await LocalStorageService.instance
        .getCachedPersonaList();
    if (cachedList != null && cachedList.isNotEmpty) {
      return cachedList;
    }

    try {
      final url = Uri.parse(
        '${ApiConstants.baseBackendUrl}/api/kings?language=$language',
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final list = data['data'] as List<dynamic>;
          final personas = list.map((item) {
            final map = item as Map<String, dynamic>;
            final kingId =
                (map['king_id'] ?? map['kingId'] ?? map['_id'] ?? '') as String;
            final kingName = (language == 'si')
                ? (map['name_si'] ??
                          map['name_en'] ??
                          map['king_name'] ??
                          map['name'] ??
                          '')
                      as String
                : (map['name_en'] ??
                          map['name_si'] ??
                          map['king_name'] ??
                          map['name'] ??
                          '')
                      as String;
            final reign =
                (map['reign_period'] ?? map['reignPeriod'] ?? '') as String;
            final capital = (language == 'si')
                ? (map['capital_si'] ??
                          map['capital_en'] ??
                          map['capital_city'] ??
                          map['capital'] ??
                          '')
                      as String
                : (map['capital_en'] ??
                          map['capital_si'] ??
                          map['capital_city'] ??
                          map['capital'] ??
                          '')
                      as String;
            final description = (language == 'si')
                ? (map['biography_si'] ??
                          map['aiKnowlageBase_si'] ??
                          map['biography_en'] ??
                          map['aiKnowlageBase_en'] ??
                          map['description'] ??
                          '')
                      as String?
                : (map['biography_en'] ??
                          map['aiKnowlageBase_en'] ??
                          map['biography_si'] ??
                          map['aiKnowlageBase_si'] ??
                          map['description'] ??
                          '')
                      as String?;

            return Persona(
              kingId: kingId,
              nameEn:
                  (map['name_en'] ?? map['name_en'] ?? map['name'] ?? '')
                      as String,
              nameSi:
                  (map['name_si'] ?? map['name_si'] ?? map['name'] ?? '')
                      as String,
              capitalEn: map['capital_en'] as String?,
              capitalSi: map['capital_si'] as String?,
              biographyEn: map['biography_en'] as String?,
              biographySi: map['biography_si'] as String?,
              aiKnowlageBaseEn: map['aiKnowlageBase_en'] as String?,
              aiKnowlageBaseSi: map['aiKnowlageBase_si'] as String?,
              imageUrls:
                  (map['imageUrls'] as List<dynamic>?)
                      ?.map((e) => e as String)
                      .toList() ??
                  <String>[],
              createdAt: map['created_at'] != null
                  ? DateTime.tryParse(map['created_at'].toString())
                  : null,
              updatedAt: map['updated_at'] != null
                  ? DateTime.tryParse(map['updated_at'].toString())
                  : null,
            );
          }).toList();

          await LocalStorageService.instance.cachePersonaList(personas);
          return personas;
        }
        throw Exception('Invalid response format');
      } else {
        throw Exception(
          'Failed to load personas: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      if (cachedList != null && cachedList.isNotEmpty) {
        return cachedList;
      }
      throw Exception('Error fetching personas: $e');
    }
  }

  /// Get detailed information about a specific persona
  static Future<Persona> getPersona({
    required String kingId,
    String language = 'en',
  }) async {
    await LocalStorageService.instance.initialize();
    await SessionAccessService.requireActiveSession();
    final cached = await LocalStorageService.instance.getCachedPersona(kingId);
    if (cached != null) {
      return cached;
    }

    try {
      // Backend exposes king lookup by king_id
      final url = Uri.parse(
        '${ApiConstants.baseBackendUrl}/api/kings/by-king-id/$kingId?language=$language',
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final payload = data['data'] as Map<String, dynamic>;
          final kingId =
              (payload['king_id'] ?? payload['kingId'] ?? payload['_id'] ?? '')
                  as String;
          final kingName = (language == 'si')
              ? (payload['name_si'] ??
                        payload['name_en'] ??
                        payload['king_name'] ??
                        payload['name'] ??
                        '')
                    as String
              : (payload['name_en'] ??
                        payload['name_si'] ??
                        payload['king_name'] ??
                        payload['name'] ??
                        '')
                    as String;
          final reign =
              (payload['reign_period'] ?? payload['reignPeriod'] ?? '')
                  as String;
          final capital = (language == 'si')
              ? (payload['capital_si'] ??
                        payload['capital_en'] ??
                        payload['capital_city'] ??
                        payload['capital'] ??
                        '')
                    as String
              : (payload['capital_en'] ??
                        payload['capital_si'] ??
                        payload['capital_city'] ??
                        payload['capital'] ??
                        '')
                    as String;
          final description = (language == 'si')
              ? (payload['biography_si'] ??
                        payload['aiKnowlageBase_si'] ??
                        payload['biography_en'] ??
                        payload['aiKnowlageBase_en'] ??
                        payload['description'] ??
                        '')
                    as String?
              : (payload['biography_en'] ??
                        payload['aiKnowlageBase_en'] ??
                        payload['biography_si'] ??
                        payload['aiKnowlageBase_si'] ??
                        payload['description'] ??
                        '')
                    as String?;

          final persona = Persona(
            kingId: kingId,
            nameEn: (payload['name_en'] ?? payload['name'] ?? '') as String,
            nameSi: (payload['name_si'] ?? payload['name'] ?? '') as String,
            capitalEn: payload['capital_en'] as String?,
            capitalSi: payload['capital_si'] as String?,
            biographyEn: payload['biography_en'] as String?,
            biographySi: payload['biography_si'] as String?,
            aiKnowlageBaseEn: payload['aiKnowlageBase_en'] as String?,
            aiKnowlageBaseSi: payload['aiKnowlageBase_si'] as String?,
            imageUrls:
                (payload['imageUrls'] as List<dynamic>?)
                    ?.map((e) => e as String)
                    .toList() ??
                <String>[],
            createdAt: payload['created_at'] != null
                ? DateTime.tryParse(payload['created_at'].toString())
                : null,
            updatedAt: payload['updated_at'] != null
                ? DateTime.tryParse(payload['updated_at'].toString())
                : null,
          );

          await LocalStorageService.instance.cachePersona(persona);
          return persona;
        }
        throw Exception('Invalid response format');
      } else if (response.statusCode == 404) {
        throw Exception('Persona not found');
      } else {
        throw Exception(
          'Failed to load persona: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      if (cached != null) {
        return cached;
      }
      throw Exception('Error fetching persona: $e');
    }
  }

  /// Ask a question to a historical persona
  static Future<String> askPersona({
    required String kingId,
    required String question,
    String language = 'en',
    String? sessionId,
  }) async {
    try {
      final resolvedSessionId =
          sessionId ?? await SessionAccessService.requireActiveSessionId();
      final url = Uri.parse('${ApiConstants.baseAiModelUrl}/persona/ask');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'king_id': kingId,
          'question': question,
          'language': language,
          'session_id': resolvedSessionId,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        // FastAPI backend returns {'answer': '...', 'rejected': bool}
        return (data['answer'] ?? data['data']?['answer'] ?? '') as String;
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
