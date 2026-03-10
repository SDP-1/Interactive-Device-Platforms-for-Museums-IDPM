import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:mobile_ai_guide/ui/colors.dart';
import 'package:mobile_ai_guide/services/reconstruction_service.dart';
import 'package:mobile_ai_guide/pages/reconstruction_model_viewer_page.dart';
import 'package:mobile_ai_guide/pages/visitor_artifact_display_page.dart';
import 'package:mobile_ai_guide/widgets/common/alert.dart';

/// Dedicated QR scanner for 3D artifact codes only. No session required.
/// Handles: model URL (http/https) or reconstruction artifact UUID.
/// Used from session intro so visitors can view 3D artifacts before starting a session.
class ReconstructionQrScanPage extends StatefulWidget {
  const ReconstructionQrScanPage({super.key});

  @override
  State<ReconstructionQrScanPage> createState() =>
      _ReconstructionQrScanPageState();
}

class _ReconstructionQrScanPageState extends State<ReconstructionQrScanPage> {
  late MobileScannerController controller;
  bool _isScanning = true;

  static final RegExp _uuidRegex = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
  );
  /// Matches a UUID anywhere in a string (e.g. in URL path or "artifact:uuid")
  static final RegExp _uuidInStringRegex = RegExp(
    r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
  );

  @override
  void initState() {
    super.initState();
    controller = MobileScannerController();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  /// Tries to find a UUID in a URL (path segment or query param) or returns null.
  String? _extractUuidFromUrl(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return null;
    for (final segment in uri.pathSegments) {
      if (_uuidRegex.hasMatch(segment)) return segment;
    }
    final idParam = uri.queryParameters['id'] ?? uri.queryParameters['artifact_id'];
    if (idParam != null && _uuidRegex.hasMatch(idParam)) return idParam;
    return null;
  }

  Future<void> _handleScannedCode(String code) async {
    setState(() => _isScanning = false);
    controller.stop();

    final raw = code.trim().replaceAll(RegExp(r'[\uFEFF\u200B-\u200D\uFFFE]'), '');

    // URL: try UUID from path/query first for visitor display; else open as model URL
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      final uuidFromUrl = _extractUuidFromUrl(raw);
      if (uuidFromUrl != null) {
        try {
          final artifact =
              await ReconstructionService.instance.getArtifactById(uuidFromUrl);
          if (mounted) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(
                builder: (_) => VisitorArtifactDisplayPage(artifact: artifact),
              ),
            );
          }
          return;
        } catch (_) {}
      }
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => ReconstructionModelViewerPage(modelUrl: raw),
          ),
        );
      }
      return;
    }

    // Try: exact UUID, then UUID found inside string, then raw value as-is
    final uuidToTry = _uuidRegex.hasMatch(raw)
        ? raw
        : _uuidInStringRegex.firstMatch(raw)?.group(0);
    final idsToTry = <String>[
      if (uuidToTry != null && uuidToTry.isNotEmpty) uuidToTry,
      if (raw.isNotEmpty && raw != uuidToTry) raw,
    ];
    for (final id in idsToTry) {
      try {
        final artifact =
            await ReconstructionService.instance.getArtifactById(id);
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (_) => VisitorArtifactDisplayPage(artifact: artifact),
            ),
          );
        }
        return;
      } catch (_) {}
    }

    // Nothing matched – show error and what we scanned (for debugging)
    if (mounted) _showNot3DArtifactAlert(raw);
    setState(() => _isScanning = true);
    controller.start();
  }

  void _showNot3DArtifactAlert([String? scanned]) {
    final preview = scanned != null && scanned.isNotEmpty
        ? '\n\nScanned: "${scanned.length > 50 ? '${scanned.substring(0, 50)}…' : scanned}"'
        : '';
    Alert.showError(
      context: context,
      title: 'Not a 3D Artifact QR',
      message:
          'This QR code is not from a 3D artifact display. Use a QR from the artifact reconstruction kiosk or exhibit.$preview',
      primaryButtonText: 'Try Again',
      onPrimaryPressed: () {
        setState(() => _isScanning = true);
        controller.start();
      },
      secondaryButtonText: 'Go Back',
      onSecondaryPressed: () => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Scan 3D Artifact QR'),
        backgroundColor: kGold,
        foregroundColor: Colors.black,
        centerTitle: true,
        elevation: 0,
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: (capture) {
              if (_isScanning) {
                final List<Barcode> barcodes = capture.barcodes;
                for (final barcode in barcodes) {
                  if (barcode.rawValue != null) {
                    _handleScannedCode(barcode.rawValue!);
                  }
                }
              }
            },
          ),
          Center(
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                border: Border.all(color: kGold, width: 3),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Position 3D Artifact QR',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: 12),
                  Text(
                    'within the frame',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          Positioned.fill(
            child: CustomPaint(
              painter: _ScannerOverlayPainter(
                scanWindow: Rect.fromCenter(
                  center: Offset(
                    MediaQuery.of(context).size.width / 2,
                    MediaQuery.of(context).size.height / 2,
                  ),
                  width: 280,
                  height: 280,
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Column(
              children: [
                if (!_isScanning)
                  const SizedBox(
                    width: 40,
                    height: 40,
                    child: CircularProgressIndicator(
                      color: kGold,
                      strokeWidth: 3,
                    ),
                  )
                else
                  const Text(
                    'Align 3D artifact QR to scan',
                    style: TextStyle(color: Colors.white, fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ScannerOverlayPainter extends CustomPainter {
  final Rect scanWindow;

  _ScannerOverlayPainter({required this.scanWindow});

  @override
  void paint(Canvas canvas, Size size) {
    final backgroundPath = Path()..addRect(Rect.largest);
    final cutoutPath = Path()
      ..addRRect(
        RRect.fromRectAndRadius(scanWindow, const Radius.circular(20)),
      );
    final path = Path.combine(
      PathOperation.difference,
      backgroundPath,
      cutoutPath,
    );
    canvas.drawPath(
      path,
      Paint()
        ..color = Colors.black.withValues(alpha: 0.6)
        ..style = PaintingStyle.fill,
    );
  }

  @override
  bool shouldRepaint(_ScannerOverlayPainter oldDelegate) => false;
}
