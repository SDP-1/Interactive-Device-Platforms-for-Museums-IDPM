import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/models/user_session.dart';
import 'package:mobile_ai_guide/pages/home_page.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;

class MobileGuideAccessPage extends StatelessWidget {
  const MobileGuideAccessPage({required this.session, super.key});

  final UserSession session;

  bool get _isSessionActive =>
      session.isActive && session.endTime.isAfter(DateTime.now());

  String get _statusText => _isSessionActive ? 'Active' : 'Expired';

  String get _durationText {
    final hours = session.durationHours;
    if (hours == hours.roundToDouble()) {
      return '${hours.toInt()}h';
    }
    return '${hours.toStringAsFixed(1)}h';
  }

  String get _priceText {
    final price = session.price;
    final numeric = price == price.roundToDouble()
        ? price.toInt().toString()
        : price.toStringAsFixed(2);
    return 'LKR $numeric';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: app.kCream,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 380),
              child: Container(
                padding: const EdgeInsets.fromLTRB(4, 10, 4, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 72,
                        height: 72,
                        decoration: const BoxDecoration(
                          color: app.kSuccessSurface,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          _isSessionActive
                              ? Icons.verified
                              : Icons.error_outline,
                          color: _isSessionActive
                              ? app.kSuccessText
                              : app.kWarningIcon,
                          size: 32,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Center(
                      child: Text(
                        'Mobile Guide Access',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: app.kMuseumText,
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          height: 1.2,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Center(
                      child: Text(
                        'Your AI-powered museum experience',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: app.kMuseumSubText,
                          fontSize: 13,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: app.kCardShadow,
                      ),
                      child: Column(
                        children: [
                          _StatusTopRow(
                            statusText: _statusText,
                            isActive: _isSessionActive,
                          ),
                          const SizedBox(height: 16),
                          _StatusBottomRow(
                            label: 'Duration',
                            value: _durationText,
                          ),
                          const SizedBox(height: 8),
                          _StatusBottomRow(label: 'Price', value: _priceText),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: app.kCardShadow,
                      ),
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "What's Included:",
                            style: TextStyle(
                              color: app.kMuseumText,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          SizedBox(height: 14),
                          _FeatureItem(
                            icon: Icons.qr_code_2_outlined,
                            title: 'QR Code Scanning',
                            subtitle: 'Instant artifact information',
                          ),
                          _FeatureItem(
                            icon: Icons.forum,
                            title: 'AI Conversations',
                            subtitle: 'Ask questions anytime',
                          ),
                          _FeatureItem(
                            icon: Icons.translate,
                            title: 'Multi-language Support',
                            subtitle: 'Sinhala, English, Tamil',
                          ),
                          _FeatureItem(
                            icon: Icons.book_outlined,
                            title: 'Rich Content',
                            subtitle: 'Stories, history & context',
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: FilledButton(
                        style: FilledButton.styleFrom(
                          backgroundColor: app.kGold,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () {
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(builder: (_) => const HomePage()),
                          );
                        },
                        child: const Text(
                          'Start Exploring →',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusTopRow extends StatelessWidget {
  const _StatusTopRow({required this.statusText, required this.isActive});

  final String statusText;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
          child: Text(
            'Status',
            style: TextStyle(
              color: app.kMuseumText,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: isActive ? app.kSuccessSurface : app.kWarningSurface,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Text(
            statusText,
            style: TextStyle(
              color: isActive ? app.kSuccessText : app.kWarningIcon,
              fontWeight: FontWeight.w700,
              fontSize: 11,
            ),
          ),
        ),
      ],
    );
  }
}

class _StatusBottomRow extends StatelessWidget {
  const _StatusBottomRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: app.kMuseumSubText,
              fontSize: 13,
              fontWeight: FontWeight.w400,
            ),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: app.kMuseumText,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _FeatureItem extends StatelessWidget {
  const _FeatureItem({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Icon(icon, color: app.kStoneAccent, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: app.kMuseumText,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: app.kMuseumSubText,
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
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
