import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile_ai_guide/ui/api_constants.dart';
import 'package:mobile_ai_guide/models/artifact.dart';

class ArtifactService {
  // Get all artifacts
  static Future<List<Artifact>> getAllArtifacts() async {
    try {
      final response = await http.get(
        Uri.parse(
          '${ApiConstants.baseBackendUrl}${ApiConstants.artifactEndpoint}',
        ),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          final List<dynamic> artifactsJson = data['data'];
          return artifactsJson
              .map((json) => Artifact.fromJson(json as Map<String, dynamic>))
              .toList();
        }
        throw Exception('Invalid response format');
      } else {
        throw Exception(
          'Failed to load artifacts: ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error fetching artifacts: $e');
    }
  }

  // Get single artifact by ID
  static Future<Artifact> getArtifactById(String id) async {
    try {
      final response = await http.get(
        Uri.parse(
          '${ApiConstants.baseBackendUrl}${ApiConstants.artifactEndpoint}/$id',
        ),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return Artifact.fromJson(data['data'] as Map<String, dynamic>);
        }
        throw Exception('Invalid response format');
      } else if (response.statusCode == 404) {
        throw Exception('Artifact not found');
      } else {
        throw Exception(
          'Failed to load artifact: ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error fetching artifact: $e');
    }
  }

  // Get single artifact by artifact_id (e.g., ART001)
  static Future<Artifact> getArtifactByArtifactId(String artifactId) async {
    try {
      final response = await http.get(
        Uri.parse(
          '${ApiConstants.baseBackendUrl}${ApiConstants.artifactEndpoint}/by-artifact-id/$artifactId',
        ),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return Artifact.fromJson(data['data'] as Map<String, dynamic>);
        }
        throw Exception('Invalid response format');
      } else if (response.statusCode == 404) {
        throw Exception('Artifact not found');
      } else {
        throw Exception(
          'Failed to load artifact: ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error fetching artifact: $e');
    }
  }

  // Create artifact
  static Future<Artifact> createArtifact(
    Map<String, dynamic> artifactData,
  ) async {
    try {
      final response = await http.post(
        Uri.parse(
          '${ApiConstants.baseBackendUrl}${ApiConstants.artifactEndpoint}',
        ),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(artifactData),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return Artifact.fromJson(data['data'] as Map<String, dynamic>);
        }
        throw Exception('Invalid response format');
      } else if (response.statusCode == 400) {
        final data = json.decode(response.body);
        throw Exception(data['message'] ?? 'Missing required fields');
      } else {
        throw Exception(
          'Failed to create artifact: ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error creating artifact: $e');
    }
  }

  // Update artifact
  static Future<Artifact> updateArtifact(
    String id,
    Map<String, dynamic> artifactData,
  ) async {
    try {
      final response = await http.put(
        Uri.parse(
          '${ApiConstants.baseBackendUrl}${ApiConstants.artifactEndpoint}/$id',
        ),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(artifactData),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return Artifact.fromJson(data['data'] as Map<String, dynamic>);
        }
        throw Exception('Invalid response format');
      } else if (response.statusCode == 404) {
        throw Exception('Artifact not found');
      } else {
        throw Exception(
          'Failed to update artifact: ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error updating artifact: $e');
    }
  }

  // Delete artifact
  static Future<void> deleteArtifact(String id) async {
    try {
      final response = await http.delete(
        Uri.parse(
          '${ApiConstants.baseBackendUrl}${ApiConstants.artifactEndpoint}/$id',
        ),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return;
        }
        throw Exception('Invalid response format');
      } else if (response.statusCode == 404) {
        throw Exception('Artifact not found');
      } else {
        throw Exception(
          'Failed to delete artifact: ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Error deleting artifact: $e');
    }
  }
}
