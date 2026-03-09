import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart';

enum AlertType { success, error }

class Alert extends StatelessWidget {
  const Alert({
    super.key,
    required this.type,
    required this.title,
    required this.message,
    this.bulletPoints = const [],
    required this.primaryButtonText,
    required this.onPrimaryPressed,
    this.secondaryButtonText,
    this.onSecondaryPressed,
  });

  final AlertType type;
  final String title;
  final String message;
  final List<String> bulletPoints;
  final String primaryButtonText;
  final VoidCallback onPrimaryPressed;
  final String? secondaryButtonText;
  final VoidCallback? onSecondaryPressed;

  static Future<void> showError({
    required BuildContext context,
    required String title,
    required String message,
    List<String> bulletPoints = const [],
    String primaryButtonText = 'OK',
    required VoidCallback onPrimaryPressed,
    String? secondaryButtonText,
    VoidCallback? onSecondaryPressed,
    bool barrierDismissible = false,
  }) {
    return showDialog<void>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (dialogContext) => Alert(
        type: AlertType.error,
        title: title,
        message: message,
        bulletPoints: bulletPoints,
        primaryButtonText: primaryButtonText,
        onPrimaryPressed: () {
          Navigator.of(dialogContext).pop();
          onPrimaryPressed();
        },
        secondaryButtonText: secondaryButtonText,
        onSecondaryPressed: onSecondaryPressed == null
            ? null
            : () {
                Navigator.of(dialogContext).pop();
                onSecondaryPressed();
              },
      ),
    );
  }

  static Future<void> showSuccess({
    required BuildContext context,
    required String title,
    required String message,
    List<String> bulletPoints = const [],
    String primaryButtonText = 'OK',
    required VoidCallback onPrimaryPressed,
    String? secondaryButtonText,
    VoidCallback? onSecondaryPressed,
    bool barrierDismissible = false,
  }) {
    return showDialog<void>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (dialogContext) => Alert(
        type: AlertType.success,
        title: title,
        message: message,
        bulletPoints: bulletPoints,
        primaryButtonText: primaryButtonText,
        onPrimaryPressed: () {
          Navigator.of(dialogContext).pop();
          onPrimaryPressed();
        },
        secondaryButtonText: secondaryButtonText,
        onSecondaryPressed: onSecondaryPressed == null
            ? null
            : () {
                Navigator.of(dialogContext).pop();
                onSecondaryPressed();
              },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final IconData icon = type == AlertType.error
        ? Icons.error_outline
        : Icons.check_circle_outline;
    final Color iconColor = type == AlertType.error
        ? Colors.red.shade700
        : Colors.green.shade700;

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          Icon(icon, color: iconColor, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(message, style: const TextStyle(fontSize: 15)),
          if (bulletPoints.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Please check:',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  ...bulletPoints.map(_buildCheckItem),
                ],
              ),
            ),
          ],
        ],
      ),
      actions: [
        if (secondaryButtonText != null && onSecondaryPressed != null)
          TextButton(
            onPressed: onSecondaryPressed,
            child: Text(
              secondaryButtonText!,
              style: TextStyle(color: Colors.grey.shade600),
            ),
          ),
        ElevatedButton(
          onPressed: onPrimaryPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: kGold,
            foregroundColor: Colors.black,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: Text(primaryButtonText),
        ),
      ],
    );
  }

  Widget _buildCheckItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 6,
            height: 6,
            margin: const EdgeInsets.only(top: 6, right: 8),
            decoration: const BoxDecoration(
              color: kGold,
              shape: BoxShape.circle,
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 13, color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }
}
