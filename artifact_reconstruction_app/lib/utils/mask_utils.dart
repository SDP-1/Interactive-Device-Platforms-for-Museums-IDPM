import 'dart:io';
import 'package:image/image.dart' as img;

/// Generates a mask image for inpainting.
///
/// [imageFile] - the source image (used to get dimensions)
/// [fraction] - 0.0 to 1.0, portion of image height to mark as inpaint (white).
///   Default 0.3 = bottom 30% (common for broken artifacts with missing base).
///
/// Returns a temp file with the mask (white = inpaint, black = keep).
Future<File> generateBottomMask(File imageFile, {double fraction = 0.3}) async {
  final bytes = await imageFile.readAsBytes();
  final image = img.decodeImage(bytes);
  if (image == null) throw Exception('Could not decode image');

  final mask = img.Image(width: image.width, height: image.height);
  img.fill(mask, color: img.ColorRgb8(0, 0, 0));

  final inpaintHeight = (image.height * fraction).round();
  final yStart = image.height - inpaintHeight;
  img.fillRect(
    mask,
    x1: 0,
    y1: yStart,
    x2: image.width,
    y2: image.height,
    color: img.ColorRgb8(255, 255, 255),
  );

  final pngBytes = img.encodePng(mask);
  final tempDir = await Directory.systemTemp.createTemp('mask');
  final maskFile = File('${tempDir.path}/mask.png');
  await maskFile.writeAsBytes(pngBytes);
  return maskFile;
}
