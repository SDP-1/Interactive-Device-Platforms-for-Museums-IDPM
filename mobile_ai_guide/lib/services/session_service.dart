import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile_ai_guide/models/user_session.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';
import 'package:mobile_ai_guide/ui/api_constants.dart';

class SessionService {
  SessionService._();

  static String get _baseUrl =>
      '${ApiConstants.baseBackendUrl}${ApiConstants.sessionEndpoint}';

  /// Create a new user session.
  static Future<UserSession> createSession({
    required double durationHours,
    String language = 'en',
    double price = 0,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(_baseUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'duration_hours': durationHours,
          'language': language,
          'price': price,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final session = UserSession.fromJson(
            data['data'] as Map<String, dynamic>,
          );
          await LocalStorageService.instance.upsertSession(session);
          return session;
        }
        throw Exception('Invalid response format');
      } else {
        throw Exception(
          'Failed to create session: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error creating session: $e');
    }
  }

  /// Get list of sessions.
  static Future<List<UserSession>> getSessions() async {
    try {
      final response = await http.get(Uri.parse(_baseUrl));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final list = data['data'] as List<dynamic>;
          return list
              .map((item) => UserSession.fromJson(item as Map<String, dynamic>))
              .toList();
        }
        throw Exception('Invalid response format');
      } else {
        throw Exception(
          'Failed to fetch sessions: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error fetching sessions: $e');
    }
  }

  /// Get a single session by session_id.
  static Future<UserSession> getSessionById(String sessionId) async {
    await LocalStorageService.instance.initialize();
    try {
      final response = await http.get(Uri.parse('$_baseUrl/$sessionId'));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final session = UserSession.fromJson(
            data['data'] as Map<String, dynamic>,
          );
          await LocalStorageService.instance.upsertSession(session);
          return session;
        }
        throw Exception('Invalid response format');
      } else if (response.statusCode == 404) {
        throw Exception('Session not found');
      } else {
        throw Exception(
          'Failed to fetch session: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      final cached = await LocalStorageService.instance.getSessionById(
        sessionId,
      );
      if (cached != null) {
        return cached;
      }
      throw Exception('Error fetching session: $e');
    }
  }

  /// Extend a session by adding hours.
  static Future<UserSession> extendSession({
    required String sessionId,
    required double addHours,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/$sessionId/extend'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'add_hours': addHours}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final session = UserSession.fromJson(
            data['data'] as Map<String, dynamic>,
          );
          await LocalStorageService.instance.upsertSession(session);
          return session;
        }
        throw Exception('Invalid response format');
      } else if (response.statusCode == 404) {
        throw Exception('Session not found');
      } else {
        throw Exception(
          'Failed to extend session: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error extending session: $e');
    }
  }

  /// Add feedback to a session, with optional star rating.
  static Future<UserSession> addFeedback({
    required String sessionId,
    required String feedback,
    double? starRating,
  }) async {
    try {
      final payload = <String, dynamic>{'feedback': feedback};
      if (starRating != null) {
        payload['star_rating'] = starRating;
      }

      final response = await http.post(
        Uri.parse('$_baseUrl/$sessionId/feedback'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final session = UserSession.fromJson(
            data['data'] as Map<String, dynamic>,
          );
          await LocalStorageService.instance.upsertSession(session);
          return session;
        }
        throw Exception('Invalid response format');
      } else if (response.statusCode == 404) {
        throw Exception('Session not found');
      } else {
        throw Exception(
          'Failed to add feedback: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error adding feedback: $e');
    }
  }

  /// Replace the feedback list and star rating for a session.
  /// This will send the full set of feedbacks to the backend so edits/deletes
  /// can be persisted. Backend should accept a PUT to the session resource.
  static Future<UserSession> updateFeedbacks({
    required String sessionId,
    required List<String> feedbacks,
    required double starRating,
  }) async {
    try {
      final payload = <String, dynamic>{
        'feedbacks': feedbacks,
        'star_rating': starRating,
      };

      final response = await http.put(
        Uri.parse('$_baseUrl/$sessionId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final session = UserSession.fromJson(
            data['data'] as Map<String, dynamic>,
          );
          await LocalStorageService.instance.upsertSession(session);
          return session;
        }
        throw Exception('Invalid response format');
      }

      // If the server doesn't support replacing the session via PUT
      // (some backends expose only the feedback sub-endpoint), fall back
      // to posting each feedback individually to the feedback endpoint.
      if (response.statusCode == 404 || response.statusCode == 405) {
        try {
          // Try clearing existing feedbacks via DELETE on the feedback sub-endpoint.
          // Some backends support DELETE /sessions/:id/feedback to remove all feedbacks.
          try {
            final delResp = await http.delete(
              Uri.parse('$_baseUrl/$sessionId/feedbacks'),
            );
            if (delResp.statusCode != 200 &&
                delResp.statusCode != 204 &&
                delResp.statusCode != 404) {
              // ignore non-fatal - we'll attempt posting anyway
            }
          } catch (_) {}

          // Re-post each feedback (if any). Include starRating on last post.
          for (var i = 0; i < feedbacks.length; i++) {
            final feed = feedbacks[i];
            final sr = (i == feedbacks.length - 1) ? starRating : null;
            await addFeedback(
              sessionId: sessionId,
              feedback: feed,
              starRating: sr,
            );
          }

          // Return the refreshed session from server/local cache
          return await getSessionById(sessionId);
        } catch (e) {
          throw Exception('Fallback add-feedbacks failed: $e');
        }
      }

      if (response.statusCode == 404) {
        throw Exception('Session not found');
      }

      throw Exception(
        'Failed to update feedbacks: ${response.statusCode} ${response.body}',
      );
    } catch (e) {
      throw Exception('Error updating feedbacks: $e');
    }
  }

  /// Clear all feedbacks for a session using dedicated endpoint.
  static Future<UserSession> clearFeedbacks({required String sessionId}) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/$sessionId/feedbacks'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final session = UserSession.fromJson(
            data['data'] as Map<String, dynamic>,
          );
          await LocalStorageService.instance.upsertSession(session);
          return session;
        }
        throw Exception('Invalid response format');
      } else if (response.statusCode == 404) {
        throw Exception('Session not found');
      } else {
        throw Exception(
          'Failed to clear feedbacks: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error clearing feedbacks: $e');
    }
  }

  /// Update only the star rating for a session.
  static Future<UserSession> updateStarRating({
    required String sessionId,
    required double starRating,
  }) async {
    try {
      final payload = <String, dynamic>{'star_rating': starRating};
      final response = await http.put(
        Uri.parse('$_baseUrl/$sessionId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final session = UserSession.fromJson(
            data['data'] as Map<String, dynamic>,
          );
          await LocalStorageService.instance.upsertSession(session);
          return session;
        }
        throw Exception('Invalid response format');
      } else if (response.statusCode == 404) {
        throw Exception('Session not found');
      } else {
        throw Exception(
          'Failed to update star rating: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error updating star rating: $e');
    }
  }
}
