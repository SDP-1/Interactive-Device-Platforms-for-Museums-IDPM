import 'package:flutter/material.dart';

class ArtifactDetailTabs extends StatelessWidget {
  const ArtifactDetailTabs({
    required this.selectedTab,
    required this.onTabSelected,
    super.key,
  });

  final String selectedTab;
  final ValueChanged<String> onTabSelected;

  static const tabs = [
    {'label': 'Description', 'icon': Icons.description_outlined},
    {'label': 'Details', 'icon': Icons.info_outline},
    {'label': 'Gallery', 'icon': Icons.photo_library_outlined},
    {'label': 'Reviews', 'icon': Icons.star_outline},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: tabs.map((tab) {
            final label = tab['label'] as String;
            final icon = tab['icon'] as IconData;
            final isSelected = selectedTab == label;

            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: _TabButton(
                label: label,
                icon: icon,
                isSelected: isSelected,
                onTap: () => onTabSelected(label),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? Colors.black : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? Colors.white : Colors.grey.shade700,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : Colors.grey.shade700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
