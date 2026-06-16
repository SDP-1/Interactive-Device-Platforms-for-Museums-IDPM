import 'package:flutter/material.dart';
import 'package:model_viewer_plus/model_viewer_plus.dart';
import 'package:mobile_ai_guide/models/reconstruction_artifact.dart';
import 'package:mobile_ai_guide/ui/colors.dart';

/// Visitor-facing display: 3D model on top, artifact details below.
/// Shown when user scans a reconstruction QR that encodes an artifact ID (UUID).
class VisitorArtifactDisplayPage extends StatefulWidget {
  const VisitorArtifactDisplayPage({
    super.key,
    required this.artifact,
  });

  final ReconstructionArtifact artifact;

  @override
  State<VisitorArtifactDisplayPage> createState() =>
      _VisitorArtifactDisplayPageState();
}

class _VisitorArtifactDisplayPageState extends State<VisitorArtifactDisplayPage> {
  bool _modelLoading = true;

  @override
  void initState() {
    super.initState();
    final hasModel = widget.artifact.modelUrl != null &&
        widget.artifact.modelUrl!.isNotEmpty;
    if (hasModel) {
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _modelLoading = false);
      });
    } else {
      _modelLoading = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final artifact = widget.artifact;
    final hasModel =
        artifact.modelUrl != null && artifact.modelUrl!.isNotEmpty;
    final hasAnyDetail =
        (artifact.category?.isNotEmpty ?? false) ||
        (artifact.era?.isNotEmpty ?? false) ||
        (artifact.origin?.isNotEmpty ?? false) ||
        (artifact.description?.isNotEmpty ?? false);

    return Scaffold(
      backgroundColor: kDarkBg,
      appBar: AppBar(
        backgroundColor: kDarkSurface,
        foregroundColor: kDarkOnBg,
        elevation: 0,
        title: Text(
          artifact.name,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
              child: hasModel
                  ? Stack(
                      children: [
                        SizedBox(
                          height: 320,
                          child: ModelViewer(
                            src: artifact.modelUrl!,
                            alt: '${artifact.name} 3D model',
                            ar: false,
                            autoRotate: true,
                            cameraControls: true,
                            backgroundColor: kDarkBg,
                          ),
                        ),
                        if (_modelLoading)
                          Container(
                            height: 320,
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
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(
                                        color: kDarkOnMuted,
                                      ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    )
                  : Container(
                      height: 200,
                      alignment: Alignment.center,
                      color: kDarkSurface,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.view_in_ar_outlined,
                            size: 48,
                            color: kDarkOnMuted.withValues(alpha: 0.6),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            '3D model not available',
                            style:
                                Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: kDarkOnMuted,
                                    ),
                          ),
                        ],
                      ),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (hasAnyDetail) ...[
                    Row(
                      children: [
                        Container(
                          width: 4,
                          height: 22,
                          decoration: BoxDecoration(
                            color: kGold,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Details',
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    color: kDarkOnBg,
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 20,
                      ),
                      decoration: BoxDecoration(
                        color: kDarkSurface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: kDarkDivider,
                          width: 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (artifact.category != null &&
                              artifact.category!.isNotEmpty) ...[
                            _DetailRow(
                              label: 'Category',
                              value: artifact.category!,
                              icon: Icons.category_outlined,
                            ),
                            const SizedBox(height: 16),
                          ],
                          if (artifact.era != null &&
                              artifact.era!.isNotEmpty) ...[
                            _DetailRow(
                              label: 'Era',
                              value: artifact.era!,
                              icon: Icons.schedule_outlined,
                            ),
                            const SizedBox(height: 16),
                          ],
                          if (artifact.origin != null &&
                              artifact.origin!.isNotEmpty) ...[
                            _DetailRow(
                              label: 'Origin',
                              value: artifact.origin!,
                              icon: Icons.place_outlined,
                            ),
                            const SizedBox(height: 16),
                          ],
                          if (artifact.description != null &&
                              artifact.description!.isNotEmpty)
                            _DetailRow(
                              label: 'Description',
                              value: artifact.description!,
                              icon: Icons.description_outlined,
                            ),
                        ],
                      ),
                    ),
                  ] else
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        child: Text(
                          'No additional details for this artifact.',
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: kDarkOnMuted,
                                  ),
                        ),
                      ),
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

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.label,
    required this.value,
    this.icon,
  });

  final String label;
  final String value;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon ?? Icons.info_outline, size: 18, color: kGold),
            const SizedBox(width: 8),
            Text(
              label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: kDarkOnMuted,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: kDarkOnBg,
                height: 1.4,
              ),
        ),
      ],
    );
  }
}
