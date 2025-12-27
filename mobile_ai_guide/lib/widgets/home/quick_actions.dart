import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;

class QuickActionsRow extends StatelessWidget {
  const QuickActionsRow({
    this.onSettingsTap,
    this.onHelpTap,
    this.onMapTap,
    super.key,
  });

  final VoidCallback? onSettingsTap;
  final VoidCallback? onHelpTap;
  final VoidCallback? onMapTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _QuickAction(
            icon: Icons.settings,
            label: 'Settings',
            // onTap wired from parent
            onTap: onSettingsTap,
          ),
        ),
        SizedBox(width: 10),
        Expanded(
          child: _QuickAction(
            icon: Icons.help_outline,
            label: 'Help',
            onTap: onHelpTap,
          ),
        ),
        SizedBox(width: 10),
        Expanded(
          child: _QuickAction(icon: Icons.map, label: 'Map', onTap: onMapTap),
        ),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: app.kCardShadow,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: app.kGold.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 30, color: Colors.black87),
              ),
              const SizedBox(height: 10),
              Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  color: Colors.black87,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
