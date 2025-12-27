import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;

class ActionGrid extends StatelessWidget {
  const ActionGrid({
    super.key,
    this.onBrowse,
    this.onScanQR,
    this.onTours,
    this.onSaved,
    this.selectedTile,
  });

  final VoidCallback? onBrowse;
  final VoidCallback? onScanQR;
  final VoidCallback? onTours;
  final VoidCallback? onSaved;
  final String? selectedTile;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        FeatureTile(
          title: 'Scan QR',
          subtitle: 'Scan artifact\ncodes',
          icon: Icons.qr_code_scanner,
          highlighted: selectedTile == 'Scan QR',
          onTap: onScanQR,
        ),
        FeatureTile(
          title: 'Browse',
          subtitle: 'View all\nartifacts',
          icon: Icons.layers_rounded,
          highlighted: selectedTile == 'Browse',
          onTap: onBrowse,
        ),
        FeatureTile(
          title: 'Tours',
          subtitle: 'Guided paths',
          icon: Icons.alt_route_rounded,
          highlighted: selectedTile == 'Tours',
          onTap: onTours,
        ),
        FeatureTile(
          title: 'Saved',
          subtitle: 'Your favorites',
          icon: Icons.bookmark_outline,
          highlighted: selectedTile == 'Saved',
          onTap: onSaved,
        ),
      ],
    );
  }
}

class FeatureTile extends StatelessWidget {
  const FeatureTile({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.highlighted = false,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final bool highlighted;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final bg = highlighted ? app.kGold : Colors.white;
    final fg = highlighted ? Colors.black : Colors.black87;
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      splashColor: app.kGold.withValues(alpha: 0.3),
      highlightColor: app.kGold.withValues(alpha: 0.15),
      hoverColor: app.kGold.withValues(alpha: 0.1),
      child: Container(
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          boxShadow: app.kCardShadow,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: highlighted
                    ? Colors.black.withValues(alpha: 0.08)
                    : app.kGold.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: fg, size: 28),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: fg,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                color: fg.withValues(alpha: 0.7),
                fontSize: 14,
                height: 1.1,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
