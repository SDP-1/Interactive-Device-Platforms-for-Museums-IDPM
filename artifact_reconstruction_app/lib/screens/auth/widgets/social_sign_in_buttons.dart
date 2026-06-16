import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';

/// UI-only Google and Apple sign-in buttons. Hook up to real auth later.
class SocialSignInButtons extends StatelessWidget {
  const SocialSignInButtons({
    super.key,
    this.dividerLabel = 'or continue with',
    this.onGoogleTap,
    this.onAppleTap,
  });

  /// e.g. "or continue with" (login) or "or sign up with" (register)
  final String dividerLabel;
  final VoidCallback? onGoogleTap;
  final VoidCallback? onAppleTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Expanded(child: Divider(color: AppTheme.stone400)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                dividerLabel,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.stone500,
                ),
              ),
            ),
            const Expanded(child: Divider(color: AppTheme.stone400)),
          ],
        ),
        const SizedBox(height: 20),
        _SocialButton(
          label: 'Continue with Google',
          icon: _GoogleIcon(),
          onPressed: onGoogleTap ?? () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Google sign-in coming soon')),
            );
          },
        ),
        const SizedBox(height: 12),
        _SocialButton(
          label: 'Continue with Apple',
          icon: const Icon(Icons.apple, size: 24, color: Colors.black87),
          onPressed: onAppleTap ?? () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Apple sign-in coming soon')),
            );
          },
        ),
      ],
    );
  }
}

class _SocialButton extends StatelessWidget {
  const _SocialButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  final String label;
  final Widget icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14),
        side: const BorderSide(color: AppTheme.stone200),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
        ),
        foregroundColor: AppTheme.stone800,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          icon,
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

/// Simple "G" placeholder for Google brand (UI only).
class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 24,
      height: 24,
      alignment: Alignment.center,
      child: const Text(
        'G',
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Color(0xFF4285F4),
        ),
      ),
    );
  }
}
