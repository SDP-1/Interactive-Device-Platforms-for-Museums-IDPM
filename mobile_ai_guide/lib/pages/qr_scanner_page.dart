import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:mobile_ai_guide/ui/colors.dart';
import 'package:mobile_ai_guide/services/artifact_service.dart';
import 'package:mobile_ai_guide/pages/artifact_detail_page.dart';
import 'package:mobile_ai_guide/widgets/qr_scanner/artifact_not_found_dialog.dart';

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

  Future<void> _handleScannedCode(String code) async {
    setState(() => _isScanning = false);
    controller.stop();

    try {
      // Extract artifact ID from QR code
      // Assuming QR code contains artifact_id like "ART001" directly or in a specific format
      String artifactId = code;

      // If QR code contains a URL or full format, extract just the ID
      if (code.contains('/')) {
        artifactId = code.split('/').last;
      }

      // Fetch artifact details using artifact_id (e.g., ART001)
      final artifact = await ArtifactService.getArtifactByArtifactId(
        artifactId,
      );

      if (mounted) {
        // Navigate to artifact detail page
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => ArtifactDetailPage(artifact: artifact),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        // Show user-friendly error dialog
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => ArtifactNotFoundDialog(
            onTryAgain: () {
              Navigator.of(context).pop();
              setState(() => _isScanning = true);
              controller.start();
            },
            onGoBack: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop();
            },
          ),
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
