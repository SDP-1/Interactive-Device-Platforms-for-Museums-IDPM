import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;

class MuseumHeader extends StatelessWidget {
  const MuseumHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 6,
              offset: Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: app.kMuseumAccent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.account_balance,
                color: Colors.black,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'National Museum',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: app.kMuseumText,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'AI Guide System',
                    style: TextStyle(fontSize: 11, color: app.kMuseumSubText),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const _LangChip(label: 'English'),
            const SizedBox(width: 10),
            const _MenuButton(),
          ],
        ),
      ),
    );
  }
}

class _LangChip extends StatelessWidget {
  const _LangChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {},
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: app.kMuseumChip,
          borderRadius: BorderRadius.circular(20),
          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
        ),
        child: Row(
          children: [
            const Icon(Icons.translate, size: 14, color: app.kMuseumDeep),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: app.kMuseumDeep,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuButton extends StatelessWidget {
  const _MenuButton();

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {},
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: app.kMuseumChipAlt,
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
        ),
        child: const Icon(Icons.menu_rounded, color: app.kMuseumDeep),
      ),
    );
  }
}
