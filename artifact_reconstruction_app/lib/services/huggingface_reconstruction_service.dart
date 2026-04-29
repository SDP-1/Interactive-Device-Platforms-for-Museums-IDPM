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
  /// [negativePrompt] - things to avoid
  /// [numInferenceSteps] - quality/step count
  /// [seed] - random seed for variety
  Future<List<int>> reconstructImage({
    required List<int> imageBytes,
    required List<int> maskBytes,
    String prompt =
        'Restore ONLY missing parts. Keep original material, erosion, cracks, proportions, lighting, and historical authenticity. Do not redesign or stylize.',
    String negativePrompt = 'blurry, artistic, low quality, distorted, missing parts',
    int numInferenceSteps = 35,
    int? seed,
  }) async {
    final imageB64 = base64Encode(imageBytes);
    final maskB64 = base64Encode(maskBytes);

    final body = jsonEncode({
      'inputs': prompt,
      'image': imageB64,
      'mask_image': maskB64,
      'parameters': {
        'negative_prompt': negativePrompt,
        'num_inference_steps': numInferenceSteps,
        if (seed != null) 'seed': seed,
      },
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
