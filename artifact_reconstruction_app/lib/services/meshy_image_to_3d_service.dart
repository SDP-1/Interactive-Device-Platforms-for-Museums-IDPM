import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/meshy_config.dart';

/// Meshy AI image-to-3D API: create task, poll until done, return GLB bytes.
/// See https://docs.meshy.ai/en/api/image-to-3d
class MeshyImageTo3DService {
  static const _baseUrl = 'https://api.meshy.ai/openapi/v1';
  static const _pollInterval = Duration(seconds: 5);
  static const _maxPollAttempts = 120; // 10 minutes

  String get _apiKey => meshyApiKey;

  /// Creates an image-to-3D task and polls until completion.
  /// [imageUrl] must be a publicly accessible URL (e.g. artifact's reconstructed image).
  /// Returns the GLB file bytes, or null on failure.
  /// Throws on auth/network errors; returns null when task fails or key is missing.
  Future<List<int>?> convertImageToGlb(String imageUrl) async {
    if (_apiKey.isEmpty) return null;

    final taskId = await _createTask(imageUrl);
    if (taskId == null) return null;

    final glbUrl = await _pollUntilSucceeded(taskId);
    if (glbUrl == null || glbUrl.isEmpty) return null;

    return _downloadBytes(glbUrl);
  }

  Future<String?> _createTask(String imageUrl) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/image-to-3d'),
      headers: {
        'Authorization': 'Bearer $_apiKey',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'image_url': imageUrl,
        'should_texture': true,
        'model_type': 'standard',
      }),
    );

    // 200 = OK, 202 = Accepted (task created and queued)
    if (response.statusCode != 200 && response.statusCode != 202) {
      throw MeshyException(
        'Create task failed: ${response.statusCode}',
        statusCode: response.statusCode,
        body: response.body,
      );
    }

    final map = jsonDecode(response.body) as Map<String, dynamic>?;
    final result = map?['result'];
    if (result == null) return null;
    return result is String ? result : result.toString();
  }

  Future<String?> _pollUntilSucceeded(String taskId) async {
    for (var i = 0; i < _maxPollAttempts; i++) {
      await Future.delayed(_pollInterval);

      final task = await _getTask(taskId);
      if (task == null) return null;

      final status = task['status'] as String?;
      if (status == 'SUCCEEDED') {
        final modelUrls = task['model_urls'] as Map<String, dynamic>?;
        final glb = modelUrls?['glb'];
        return glb is String ? glb : glb?.toString();
      }
      if (status == 'FAILED') {
        final err = task['task_error'] as Map<String, dynamic>?;
        final msg = err?['message'] ?? 'Task failed';
        throw MeshyException('Meshy task failed: $msg');
      }
    }
    throw MeshyException('Meshy task timed out');
  }

  Future<Map<String, dynamic>?> _getTask(String taskId) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/image-to-3d/$taskId'),
      headers: {'Authorization': 'Bearer $_apiKey'},
    );

    if (response.statusCode != 200) {
      throw MeshyException(
        'Get task failed: ${response.statusCode}',
        statusCode: response.statusCode,
        body: response.body,
      );
    }

    final map = jsonDecode(response.body) as Map<String, dynamic>?;
    return map;
  }

  Future<List<int>?> _downloadBytes(String url) async {
    final response = await http.get(Uri.parse(url));
    if (response.statusCode != 200) return null;
    return response.bodyBytes;
  }
}

class MeshyException implements Exception {
  MeshyException(this.message, {this.statusCode, this.body});
  final String message;
  final int? statusCode;
  final String? body;
  @override
  String toString() => 'MeshyException: $message';
}
