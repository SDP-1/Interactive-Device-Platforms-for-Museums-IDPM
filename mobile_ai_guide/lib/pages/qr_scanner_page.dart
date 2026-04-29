import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:mobile_ai_guide/ui/colors.dart';
import 'package:mobile_ai_guide/services/artifact_service.dart';
import 'package:mobile_ai_guide/services/reconstruction_service.dart';
import 'package:mobile_ai_guide/services/session_access_service.dart';
import 'package:mobile_ai_guide/pages/artifact_detail_page.dart';
import 'package:mobile_ai_guide/pages/reconstruction_model_viewer_page.dart';
import 'package:mobile_ai_guide/pages/visitor_artifact_display_page.dart';
import 'package:mobile_ai_guide/widgets/common/alert.dart';
import 'package:mobile_ai_guide/widgets/common/session_guard.dart';

class QRScannerPage extends StatefulWidget {
  const QRScannerPage({super.key});

  @override
  State<QRScannerPage> createState() => _QRScannerPageState();
}

class _QRScannerPageState extends State<QRScannerPage> {
  late MobileScannerController controller;
  bool _isScanning = true;

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

  static final RegExp _uuidRegex = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
  );

  Future<void> _handleScannedCode(String code) async {
    setState(() => _isScanning = false);
    controller.stop();

    final raw = code.trim();

    // Reconstruction QR: direct model URL -> show 3D viewer
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => ReconstructionModelViewerPage(modelUrl: raw),
          ),
        );
      }
      return;
    }

    // Reconstruction QR: artifact UUID -> fetch from reconstruction backend, show visitor display
    if (_uuidRegex.hasMatch(raw)) {
      try {
        final artifact =
            await ReconstructionService.instance.getArtifactById(raw);
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (_) => VisitorArtifactDisplayPage(artifact: artifact),
            ),
          );
        }
        return;
      } catch (_) {
        // Not found in reconstruction DB; fall through to museum flow below
      }
    }

    // Museum QR: artifact_id (e.g. ART001)
    try {
      String artifactId = raw;
      if (raw.contains('/')) {
        artifactId = raw.split('/').last;
      }

      final artifact = await ArtifactService.getArtifactByArtifactId(
        artifactId,
      );

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => ArtifactDetailPage(artifact: artifact),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        if (e is SessionAccessException) {
          await SessionGuard.redirectToSessionIntro(
            context,
            message: e.message,
          );
          return;
        }

        Alert.showError(
          context: context,
          title: 'Artifact Not Found',
          message: 'We couldn\'t find this artifact in our collection.',
          bulletPoints: const [
            'QR code is clear and not damaged',
            'QR code belongs to this museum',
            'Try scanning again',
          ],
          primaryButtonText: 'Try Again',
          onPrimaryPressed: () {
            setState(() => _isScanning = true);
            controller.start();
          },
          secondaryButtonText: 'Go Back',
          onSecondaryPressed: () {
            Navigator.of(context).pop();
          },
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Scan Artifact QR Code'),
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
          // Scanning frame overlay
          Center(
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                border: Border.all(color: kGold, width: 3),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Position QR Code',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'within the frame',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          // Darken corners
          Positioned.fill(
            child: CustomPaint(
              painter: ScannerOverlayPainter(
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
          // Bottom instructions
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
                    'Align QR code to scan',
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

class ScannerOverlayPainter extends CustomPainter {
  final Rect scanWindow;

  ScannerOverlayPainter({required this.scanWindow});

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
  bool shouldRepaint(ScannerOverlayPainter oldDelegate) => false;
}
