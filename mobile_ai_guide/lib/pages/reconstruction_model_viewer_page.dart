import 'package:flutter/material.dart';
import 'package:model_viewer_plus/model_viewer_plus.dart';
import 'package:mobile_ai_guide/ui/colors.dart';

/// Visitor 3D model viewer when user scans a reconstruction QR that contains
/// a direct model URL (e.g. https://.../model.glb).
class ReconstructionModelViewerPage extends StatefulWidget {
  const ReconstructionModelViewerPage({
    super.key,
    required this.modelUrl,
    this.title,
  });

  final String modelUrl;
  final String? title;

  @override
  State<ReconstructionModelViewerPage> createState() =>
      _ReconstructionModelViewerPageState();
}

class _ReconstructionModelViewerPageState
    extends State<ReconstructionModelViewerPage> {
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _loading = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kDarkBg,
      appBar: AppBar(
        backgroundColor: kDarkSurface,
        foregroundColor: kDarkOnBg,
        elevation: 0,
        title: Text(
          widget.title ?? '3D Model',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Expanded(
                child: ModelViewer(
                  src: widget.modelUrl,
                  alt: 'Reconstructed artifact 3D model',
                  ar: false,
                  autoRotate: true,
                  cameraControls: true,
                  backgroundColor: kDarkBg,
                ),
              ),
            ],
          ),
          if (_loading)
            Container(
              color: kDarkBg,
              alignment: Alignment.center,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(
                    color: kGold,
                    strokeWidth: 2,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Loading 3D model…',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: kDarkOnMuted,
                        ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
