import 'dart:convert';
import 'package:http/http.dart' as http;

import '../config/reconstruction_config.dart';

/// Calls Gemini API for image editing (image + prompt → image).
/// Reconstructs broken artifact images by describing the desired restoration.
/// No mask: the model infers what to fix from the image and prompt.
class GeminiReconstructionService {
  /// Default: Nano Banana (Gemini 2.5 Flash Image) for 2D reconstruction.
  /// Override with GEMINI_MODEL_ID if needed (e.g. gemini-2.0-flash-exp-image-generation).
  static const _defaultModelId = 'gemini-2.5-flash-image';
  static String _modelId() =>
      geminiModelId.isNotEmpty ? geminiModelId : _defaultModelId;
  static String _baseUrl(String apiKey) =>
      'https://generativelanguage.googleapis.com/v1beta/models/${_modelId()}:generateContent?key=$apiKey';

  final String apiKey;

  GeminiReconstructionService({required this.apiKey});

  /// Reconstructs a broken artifact image using Gemini (image + prompt → image).
  ///
  /// [imageBytes] - original broken image (PNG or JPEG)
  /// [prompt] - describes how to restore (e.g. restore missing parts, keep shape/color)
  /// [mimeType] - e.g. "image/png" or "image/jpeg"
  /// Returns the generated image bytes (e.g. PNG).
  Future<List<int>> reconstructImage({
    required List<int> imageBytes,
    String prompt =
        'Output one image of the COMPLETE, WHOLE object. Restore ALL missing or broken parts so the object looks fully intact. Same shape, material, color, lighting. No gaps or broken edges. Photorealistic, full restoration.',
    String mimeType = 'image/png',
  }) async {
    final imageB64 = base64Encode(imageBytes);
    final modelName = _modelId();

    final body = jsonEncode({
      'model': 'models/$modelName',
      'contents': [
        {
          'parts': [
            {
              'inlineData': {
                'mimeType': mimeType,
                'data': imageB64,
              },
            },
            {'text': prompt},
          ],
        },
      ],
      'generationConfig': {
        'responseModalities': ['TEXT', 'IMAGE'],
      },
    });

    final response = await http.post(
      Uri.parse(_baseUrl(apiKey)),
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    );

    if (response.statusCode != 200) {
      throw Exception(
        'Gemini reconstruction failed: ${response.statusCode} - ${response.body}',
      );
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final candidates = decoded['candidates'] as List<dynamic>?;
    if (candidates == null || candidates.isEmpty) {
      throw Exception(
        'Gemini returned no candidates. ${response.body}',
      );
    }

    final parts = (candidates.first as Map<String, dynamic>)['content']?['parts'] as List<dynamic>?;
    if (parts == null) {
      throw Exception(
        'Gemini response missing content.parts. ${response.body}',
      );
    }

    for (final part in parts) {
      final map = part as Map<String, dynamic>;
      final inlineData = map['inlineData'];
      if (inlineData is Map<String, dynamic>) {
        final data = inlineData['data'] as String?;
        if (data != null && data.isNotEmpty) {
          return base64Decode(data);
        }
      }
    }

    throw Exception(
      'Gemini response contained no image data. ${response.body}',
    );
  }
}
