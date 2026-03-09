import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:mobile_ai_guide/models/tour.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';
import 'package:mobile_ai_guide/services/session_access_service.dart';
import 'package:mobile_ai_guide/ui/api_constants.dart';

class TourService {
  static Future<List<Tour>> getTours() async {
    await SessionAccessService.requireActiveSession();

    try {
      final response = await http.get(
        Uri.parse(
          '${ApiConstants.baseBackendUrl}${ApiConstants.toursEndpoint}',
        ),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        throw Exception(
          'Failed to load tours: ${response.statusCode} - ${response.body}',
        );
      }

      final data = json.decode(response.body);
      if (data is! Map<String, dynamic> || data['success'] != true) {
        throw Exception('Invalid tours response format');
      }

      final rawList = data['data'];
      if (rawList is! List) return <Tour>[];

      final list = rawList
          .whereType<Map<String, dynamic>>()
          .map(Tour.fromJson)
          .where((tour) => tour.isActive)
          .toList();
      try {
        await LocalStorageService.instance.cacheTourList(list);
      } catch (_) {}
      return list;
    } catch (e) {
      throw Exception('Error fetching tours: $e');
    }
  }

  static Future<Tour> getTourById(String id) async {
    await SessionAccessService.requireActiveSession();

    try {
      final response = await http.get(
        Uri.parse(
          '${ApiConstants.baseBackendUrl}${ApiConstants.toursEndpoint}/$id',
        ),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        throw Exception(
          'Failed to load tour: ${response.statusCode} - ${response.body}',
        );
      }

      final data = json.decode(response.body);
      if (data is! Map<String, dynamic> ||
          data['success'] != true ||
          data['data'] is! Map<String, dynamic>) {
        throw Exception('Invalid tour response format');
      }

      final tour = Tour.fromJson(data['data'] as Map<String, dynamic>);
      try {
        await LocalStorageService.instance.cacheTour(tour);
      } catch (_) {}
      return tour;
    } catch (e) {
      throw Exception('Error fetching tour: $e');
    }
  }
}
