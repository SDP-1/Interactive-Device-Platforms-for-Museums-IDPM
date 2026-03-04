import 'dart:convert';
import 'package:http/http.dart' as http;

/// Calls Hugging Face Inference API for image inpainting.
/// Reconstructs broken artifact images by filling in masked regions.
class HuggingFaceReconstructionService {
  static const _baseUrl =
      'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0';

  final String apiKey;

  HuggingFaceReconstructionService({required this.apiKey});

  /// Reconstructs a broken artifact image using inpainting.
  ///
  /// [imageBytes] - original broken image (PNG or JPEG)
  /// [maskBytes] - mask image, same size (white = inpaint, black = keep)
  /// [prompt] - describes the complete artifact
  Future<List<int>> reconstructImage({
    required List<int> imageBytes,
    required List<int> maskBytes,
    String prompt =
        'Restore ONLY the missing parts of the EXACT ceramic cup shown. Do NOT change the cup’s shape, handle, or design. Keep the original material, color, and lighting. Do NOT generate new objects or artistic forms. Photorealistic, realistic restoration.',
  }) async {
    final imageB64 = base64Encode(imageBytes);
    final maskB64 = base64Encode(maskBytes);

    final body = jsonEncode({
      'inputs': prompt,
      'image': imageB64,
      'mask_image': maskB64,
    });

    final response = await http.post(
      Uri.parse(_baseUrl),
      headers: {
        'Authorization': 'Bearer $apiKey',
        'Content-Type': 'application/json',
        'Accept': 'image/png',
      },
      body: body,
    );

    if (response.statusCode != 200) {
      throw Exception(
        'Reconstruction failed: ${response.statusCode} - ${response.body}',
      );
    }
    return response.bodyBytes;
  }
}
