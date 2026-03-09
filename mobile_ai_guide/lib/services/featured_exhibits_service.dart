import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:mobile_ai_guide/models/featured_exhibit.dart';
import 'package:mobile_ai_guide/ui/api_constants.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';
import 'package:mobile_ai_guide/services/session_access_service.dart';

class FeaturedExhibitsService {
  FeaturedExhibitsService._();

  static final _client = http.Client();

  static Uri _buildUri(String path) {
    final base = ApiConstants.baseBackendUrl ?? '';
    final trimmed = base.endsWith('/')
        ? base.substring(0, base.length - 1)
        : base;
    final full = '$trimmed$path';
    return Uri.parse(full);
  }

  /// Fetches featured exhibits from backend. Returns parsed list.
  static Future<List<FeaturedExhibit>> fetchFeaturedExhibits() async {
    await LocalStorageService.instance.initialize();
    await SessionAccessService.requireActiveSession();

    try {
      final uri = Uri.parse(
        '${ApiConstants.baseBackendUrl}${ApiConstants.featuredExhibitsEndpoint}',
      );
      final response = await _client.get(
        uri,
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final body = json.decode(response.body) as Map<String, dynamic>;
        if (body['success'] == true && body['data'] != null) {
          final List<dynamic> items = body['data'] as List<dynamic>;
          return items
              .where((e) => e != null)
              .map(
                (e) => FeaturedExhibit.fromJson(Map<String, dynamic>.from(e)),
              )
              .toList();
        }
        throw Exception('Invalid response format');
      } else {
        throw Exception(
          'Failed to load featured exhibits: ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error fetching featured exhibits: $e');
    }
  }

  /// Fetch single exhibit by id
  static Future<FeaturedExhibit> fetchFeaturedExhibitById(String id) async {
    await LocalStorageService.instance.initialize();
    await SessionAccessService.requireActiveSession();

    try {
      final uri = Uri.parse(
        '${ApiConstants.baseBackendUrl}${ApiConstants.featuredExhibitsEndpoint}/$id',
      );
      final response = await _client.get(
        uri,
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final body = json.decode(response.body) as Map<String, dynamic>;
        if (body['success'] == true && body['data'] != null) {
          final data = body['data'] as Map<String, dynamic>;
          return FeaturedExhibit.fromJson(Map<String, dynamic>.from(data));
        }
        throw Exception('Invalid response format');
      } else if (response.statusCode == 404) {
        throw Exception('Featured exhibit not found');
      } else {
        throw Exception(
          'Failed to load featured exhibit: ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error fetching featured exhibit: $e');
    }
  }
}
