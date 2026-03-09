import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/pages/session_intro_page.dart';
import 'package:mobile_ai_guide/widgets/common/alert.dart';

class SessionGuard {
  SessionGuard._();

  static Future<void> redirectToSessionIntro(
    BuildContext context, {
    String message =
        'Your session is not active. Please scan a valid session QR to continue.',
  }) async {
    if (!context.mounted) return;

    await Alert.showError(
      context: context,
      title: 'Session Required',
      message: message,
      primaryButtonText: 'Go to Session Access',
      onPrimaryPressed: () {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const SessionIntroPage()),
          (route) => false,
        );
      },
    );
  }
}
