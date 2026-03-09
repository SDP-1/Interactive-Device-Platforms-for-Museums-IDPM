import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile_ai_guide/models/user_session.dart';
import 'package:mobile_ai_guide/pages/session_intro_page.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;

class SessionInformationPage extends StatefulWidget {
  const SessionInformationPage({super.key});

  @override
  State<SessionInformationPage> createState() => _SessionInformationPageState();
}

class _SessionInformationPageState extends State<SessionInformationPage> {
  UserSession? _session;
  bool _isLoading = true;
  Timer? _timer;
  Duration _remaining = Duration.zero;
  SessionUsageSummary _usageSummary = const SessionUsageSummary(
    exhibitsVisited: 0,
    conversations: 0,
  );

  @override
  void initState() {
    super.initState();
    _loadSession();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _remaining = _calculateRemaining();
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadSession() async {
    final activeSessionId = await LocalStorageService.instance
        .getActiveSessionId();
    if (activeSessionId == null || activeSessionId.isEmpty) {
      if (!mounted) return;
      setState(() {
        _session = null;
        _isLoading = false;
        _remaining = Duration.zero;
      });
      return;
    }

    final session = await LocalStorageService.instance.getSessionById(
      activeSessionId,
    );
    final usage = await LocalStorageService.instance.getSessionUsageSummary();

    if (!mounted) return;

    setState(() {
      _session = session;
      _isLoading = false;
      _remaining = _calculateRemaining();
      _usageSummary = usage;
    });
  }

  Future<void> _confirmAndEndSession() async {
    final shouldEnd =
        await showDialog<bool>(
          context: context,
          builder: (context) {
            return AlertDialog(
              title: const Text('End Session'),
              content: const Text(
                'Are you sure you want to end this session? This will clear all session data from this device.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () => Navigator.of(context).pop(true),
                  child: const Text('End Session'),
                ),
              ],
            );
          },
        ) ??
        false;

    if (!shouldEnd) return;

    await LocalStorageService.instance.endActiveSession();
    if (!mounted) return;

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const SessionIntroPage()),
      (route) => false,
    );
  }

  Duration _calculateRemaining() {
    final session = _session;
    if (session == null) return Duration.zero;
    // consider extension only via extendedTimeHours
    DateTime effectiveEnd = session.endTime;
    if (session.extendedTimeHours > 0) {
      effectiveEnd = session.endTime.add(
        Duration(milliseconds: (session.extendedTimeHours * 3600000).toInt()),
      );
    }
    final diff = effectiveEnd.difference(DateTime.now());
    if (diff.isNegative) return Duration.zero;
    return diff;
  }

  bool get _isSessionActive {
    final session = _session;
    if (session == null) return false;
    DateTime effectiveEnd = session.endTime;
    if (session.extendedTimeHours > 0) {
      effectiveEnd = session.endTime.add(
        Duration(milliseconds: (session.extendedTimeHours * 3600000).toInt()),
      );
    }
    return session.isActive && effectiveEnd.isAfter(DateTime.now());
  }

  String _formatDurationHours(double hours) {
    if (hours == hours.roundToDouble()) {
      return '${hours.toInt()} hours';
    }
    return '${hours.toStringAsFixed(1)} hours';
  }

  String _formatPrice(double price) {
    final numeric = price == price.roundToDouble()
        ? price.toInt().toString()
        : price.toStringAsFixed(2);
    return 'LKR $numeric';
  }

  int get _hours => _remaining.inHours;
  int get _minutes => _remaining.inMinutes.remainder(60);
  int get _seconds => _remaining.inSeconds.remainder(60);

  String get _remainingClock {
    final hourText = _hours.toString().padLeft(2, '0');
    final minuteText = _minutes.toString().padLeft(2, '0');
    final secondText = _seconds.toString().padLeft(2, '0');
    return '$hourText:$minuteText:$secondText';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: app.kCream,
      appBar: AppBar(
        backgroundColor: app.kCream,
        elevation: 0,
        title: const Text(
          'Session Information',
          style: TextStyle(
            color: app.kMuseumText,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _session == null
          ? const Center(
              child: Text(
                'No active session found',
                style: TextStyle(
                  color: app.kMuseumSubText,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: app.kCardShadow,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Session Status',
                        style: TextStyle(
                          color: app.kMuseumText,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          const Spacer(),
                          Container(
                            width: 9,
                            height: 9,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _isSessionActive
                                  ? app.kSuccessText
                                  : app.kWarningIcon,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            _isSessionActive ? 'Active' : 'Expired',
                            style: TextStyle(
                              color: _isSessionActive
                                  ? app.kSuccessText
                                  : app.kWarningIcon,
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      const Divider(height: 1, color: app.kDivider),
                      _DetailRow(
                        label: 'Started',
                        value: DateFormat(
                          'hh:mm a',
                        ).format(_session!.startTime),
                      ),
                      const Divider(height: 1, color: app.kDivider),
                      _DetailRow(
                        label: 'Duration',
                        value: _formatDurationHours(_session!.durationHours),
                      ),
                      if (_session!.extendedTimeHours > 0) ...[
                        const Divider(height: 1, color: app.kDivider),
                        _DetailRow(
                          label: 'Extended Duration',
                          value:
                              '+${_formatDurationHours(_session!.extendedTimeHours)}',
                        ),
                      ],
                      const Divider(height: 1, color: app.kDivider),
                      _DetailRow(
                        label: 'End Time',
                        value: DateFormat('hh:mm a').format(_session!.endTime),
                      ),
                      const Divider(height: 1, color: app.kDivider),
                      _DetailRow(
                        label: 'Price',
                        value: _formatPrice(_session!.price),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 18,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: app.kCardShadow,
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'Remaining Time',
                        style: TextStyle(
                          color: app.kMuseumText,
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Container(
                        width: 180,
                        height: 180,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: app.kGold, width: 8),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _remainingClock,
                              style: const TextStyle(
                                color: app.kMuseumText,
                                fontSize: 38,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'hours remaining',
                              style: TextStyle(
                                color: app.kMuseumSubText,
                                fontSize: 14,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _TimeUnit(value: _hours, unit: 'Hours'),
                          _TimeUnit(value: _minutes, unit: 'Minutes'),
                          _TimeUnit(value: _seconds, unit: 'Seconds'),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _UsageCard(
                        icon: Icons.museum,
                        label: 'Exhibits Visited',
                        value: _usageSummary.exhibitsVisited,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _UsageCard(
                        icon: Icons.chat,
                        label: 'Conversations',
                        value: _usageSummary.conversations,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onPressed: _confirmAndEndSession,
                    icon: const Icon(Icons.power_settings_new, size: 18),
                    label: const Text(
                      'End Session',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: app.kMuseumSubText,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: app.kMuseumText,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _TimeUnit extends StatelessWidget {
  const _TimeUnit({required this.value, required this.unit});

  final int value;
  final String unit;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value.toString().padLeft(2, '0'),
          style: const TextStyle(
            color: app.kGold,
            fontSize: 34,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          unit,
          style: const TextStyle(
            color: app.kMuseumSubText,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class _UsageCard extends StatelessWidget {
  const _UsageCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: app.kCardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 15, color: app.kGold),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: app.kMuseumSubText,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '$value',
            style: const TextStyle(
              color: app.kMuseumText,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
