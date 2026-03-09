import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/pages/mobile_guide_access_page.dart';
import 'package:mobile_ai_guide/pages/session_intro_page.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';
import 'package:mobile_ai_guide/services/session_service.dart';
import 'package:mobile_ai_guide/ui/chat_language.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;
import 'package:mobile_ai_guide/ui/content_language.dart';
import 'package:mobile_ai_guide/ui/font_scale.dart';
import 'package:mobile_ai_guide/widgets/common/alert.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class SessionQrScanPage extends StatefulWidget {
  const SessionQrScanPage({super.key});

  @override
  State<SessionQrScanPage> createState() => _SessionQrScanPageState();
}

class _SessionQrScanPageState extends State<SessionQrScanPage> {
  late MobileScannerController controller;
  bool _isScanning = true;
  bool _isLeaving = false;

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

  Future<void> _navigateToIntro() async {
    if (_isLeaving || !mounted) return;
    _isLeaving = true;
    await controller.stop();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const SessionIntroPage()),
    );
  }

  String _extractSessionId(String raw) {
    final value = raw.trim();

    final uri = Uri.tryParse(value);
    if (uri != null) {
      final queryId = uri.queryParameters['session_id'];
      if (queryId != null && queryId.isNotEmpty) {
        return queryId;
      }

      if (uri.pathSegments.isNotEmpty) {
        final last = uri.pathSegments.last;
        if (last.isNotEmpty) {
          return last;
        }
      }
    }

    final regex = RegExp(r'session_id=([a-zA-Z0-9\-]+)');
    final match = regex.firstMatch(value);
    if (match != null && match.groupCount >= 1) {
      return match.group(1)!;
    }

    return value;
  }

  Future<void> _handleScannedCode(String code) async {
    setState(() => _isScanning = false);
    controller.stop();

    try {
      final sessionId = _extractSessionId(code);
      final session = await SessionService.getSessionById(sessionId);
      await LocalStorageService.instance.activateSession(session);
      await AppChatLanguage.instance.loadForActiveSession();
      await AppContentLanguage.instance.loadForActiveSession();
      await AppFontScale.instance.loadForActiveSession();

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => MobileGuideAccessPage(session: session),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      Alert.showError(
        context: context,
        title: 'Session Not Found',
        message: 'This QR code has no valid session. Try scanning again.',
        primaryButtonText: 'Try Again',
        onPrimaryPressed: () {
          setState(() => _isScanning = true);
          controller.start();
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        await _navigateToIntro();
        return false;
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _navigateToIntro,
          ),
          title: const Text('Scan Session QR'),
          backgroundColor: app.kGold,
          foregroundColor: Colors.black,
          centerTitle: true,
          elevation: 0,
        ),
        body: Stack(
          children: [
            MobileScanner(
              controller: controller,
              onDetect: (capture) {
                if (!_isScanning) return;
                for (final barcode in capture.barcodes) {
                  final raw = barcode.rawValue;
                  if (raw != null && raw.isNotEmpty) {
                    _handleScannedCode(raw);
                    break;
                  }
                }
              },
            ),
            Center(
              child: Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  border: Border.all(color: app.kGold, width: 3),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Position Session QR',
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
                painter: _SessionScannerOverlayPainter(
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
                        color: app.kGold,
                        strokeWidth: 3,
                      ),
                    )
                  else
                    const Text(
                      'Align session QR code to scan',
                      style: TextStyle(color: Colors.white, fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SessionScannerOverlayPainter extends CustomPainter {
  _SessionScannerOverlayPainter({required this.scanWindow});

  final Rect scanWindow;

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
  bool shouldRepaint(_SessionScannerOverlayPainter oldDelegate) => false;
}
