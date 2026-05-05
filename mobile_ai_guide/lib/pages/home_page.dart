import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;
import 'package:mobile_ai_guide/widgets/home/museum_header.dart';
import 'package:mobile_ai_guide/widgets/home/welcome_section.dart';
import 'package:mobile_ai_guide/widgets/home/action_grid.dart';
import 'package:mobile_ai_guide/pages/browse_artifacts_page.dart';
import 'package:mobile_ai_guide/pages/qr_scanner_page.dart';
import 'package:mobile_ai_guide/pages/settings_page.dart';
import 'package:mobile_ai_guide/pages/help_page.dart';
import 'package:mobile_ai_guide/pages/persona_list_page.dart';
import 'package:mobile_ai_guide/pages/tours_page.dart';
import 'package:mobile_ai_guide/services/session_access_service.dart';
import 'package:mobile_ai_guide/widgets/home/featured_exhibitions.dart';
import 'package:mobile_ai_guide/services/featured_exhibits_service.dart';
import 'package:mobile_ai_guide/widgets/home/quick_actions.dart';
import 'package:mobile_ai_guide/widgets/home/feedback_section.dart';
import 'package:mobile_ai_guide/widgets/common/session_guard.dart';
import 'package:mobile_ai_guide/widgets/navigation/app_bottom_navigation.dart';
import 'package:mobile_ai_guide/services/proximity_service.dart';
import 'dart:async';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _current = 0;
  String? _selectedTile;
  Key _featuredKey = UniqueKey();

  @override
  void initState() {
    super.initState();
    _validateSession();
    _initializeProximityService();
    _listenToProximityStatus();
  }

  Future<void> _initializeProximityService() async {
    try {
      final initialized = await ProximityService.instance.initialize();
      if (initialized) {
        await ProximityService.instance.checkOnce();
      }
    } catch (e) {
      debugPrint('Proximity service initialization error: $e');
    }
  }

  Future<void> _validateSession() async {
    try {
      await SessionAccessService.requireActiveSession();
    } on SessionAccessException catch (e) {
      if (!mounted) return;
      await SessionGuard.redirectToSessionIntro(context, message: e.message);
    }
  }

  void _listenToProximityStatus() {
    ProximityService.instance.statusNotifier.addListener(
      _onProximityStatusChanged,
    );
  }

  void _onProximityStatusChanged() {
    final status = ProximityService.instance.statusNotifier.value;
    if (status == ProximityStatus.outOfRange && mounted) {
      _showOutOfRangeAlert();
    }
  }

  void _showOutOfRangeAlert() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.warning_rounded, color: Colors.red, size: 28),
              SizedBox(width: 12),
              Text(
                'Out of Range',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'You are outside the allowed museum area.',
                style: TextStyle(fontSize: 16, height: 1.5),
              ),
              const SizedBox(height: 16),
              ValueListenableBuilder<int>(
                valueListenable: ProximityService.instance.countdownNotifier,
                builder: (context, countdown, _) {
                  final minutes = countdown ~/ 60;
                  final seconds = countdown % 60;
                  final timeStr =
                      '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
                  return Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1),
                      border: Border.all(color: Colors.red, width: 2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'Your data will be cleared in:',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.red,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          timeStr,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.red,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),
              const Text(
                'Please return to the museum area to continue.',
                style: TextStyle(
                  fontSize: 14,
                  fontStyle: FontStyle.italic,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildProximityStatusCard() {
    return ValueListenableBuilder<ProximityStatus>(
      valueListenable: ProximityService.instance.statusNotifier,
      builder: (context, status, _) {
        // Hide card when in safe range
        if (status == ProximityStatus.safe) {
          return const SizedBox.shrink();
        }

        late Color statusColor;
        late IconData statusIcon;
        late String statusText;
        late Color backgroundColor;

        switch (status) {
          case ProximityStatus.safe:
            statusColor = const Color(0xFF4CAF50);
            statusIcon = Icons.check_circle_rounded;
            statusText = 'In Range - Safe';
            backgroundColor = const Color(0xFF4CAF50).withOpacity(0.1);
            break;
          case ProximityStatus.warning:
            statusColor = const Color(0xFFFFA726);
            statusIcon = Icons.info_rounded;
            statusText = 'Approaching Boundary';
            backgroundColor = const Color(0xFFFFA726).withOpacity(0.1);
            break;
          case ProximityStatus.outOfRange:
            statusColor = const Color(0xFFEF5350);
            statusIcon = Icons.location_off_rounded;
            statusText = 'Out of Range';
            backgroundColor = const Color(0xFFEF5350).withOpacity(0.1);
            break;
        }

        return Container(
          margin: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: statusColor.withOpacity(0.3), width: 1.5),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Icon(statusIcon, color: statusColor, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        statusText,
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      ValueListenableBuilder<double>(
                        valueListenable:
                            ProximityService.instance.distanceNotifier,
                        builder: (context, distance, _) {
                          return Text(
                            'Distance: ${distance.toStringAsFixed(0)}m',
                            style: TextStyle(
                              color: statusColor.withOpacity(0.7),
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    ProximityService.instance.statusNotifier.removeListener(
      _onProximityStatusChanged,
    );
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async => false,
      child: Scaffold(
        backgroundColor: app.kCream,
        appBar: const PreferredSize(
          preferredSize: Size.fromHeight(90),
          child: MuseumHeader(),
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            // refresh featured exhibits and rebuild the section
            try {
              await FeaturedExhibitsService.fetchFeaturedExhibits();
            } catch (_) {
              // ignore - UI will show friendly error
            }
            if (!mounted) return;
            setState(() => _featuredKey = UniqueKey());
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const WelcomeSection(),
                const SizedBox(height: 4),
                _buildProximityStatusCard(),
                const SizedBox(height: 12),
                ActionGrid(
                  selectedTile: _selectedTile,
                  onBrowse: () {
                    setState(() => _selectedTile = 'Browse');
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const BrowseArtifactsPage(),
                        settings: const RouteSettings(name: '/browse'),
                      ),
                    );
                  },
                  onScanQR: () {
                    setState(() => _selectedTile = 'Scan QR');
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const QRScannerPage()),
                    );
                  },
                  onTours: () {
                    setState(() => _selectedTile = 'Tours');
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ToursPage()),
                    );
                  },
                  onSaved: () {
                    setState(() => _selectedTile = 'Saved');
                    Navigator.of(context).pushNamed('/saved').then((_) {
                      if (!mounted) return;
                      setState(() => _selectedTile = null);
                    });
                  },
                ),
                const SizedBox(height: 16),
                FeaturedExhibitionsSection(key: _featuredKey),
                const SizedBox(height: 16),
                QuickActionsRow(
                  onSettingsTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const SettingsPage()),
                    );
                  },
                  onHelpTap: () {
                    Navigator.of(
                      context,
                    ).push(MaterialPageRoute(builder: (_) => const HelpPage()));
                  },
                ),
                const SizedBox(height: 18),
                FeedbackSection(),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
        bottomNavigationBar: AppBottomNavigationBar(
          selectedIndex: _current,
          onDestinationSelected: (i) {
            if (i == 0) {
              // Already on home page, do nothing
              setState(() => _current = 0);
            } else if (i == 1) {
              // Navigate to Browse Artifacts (Explore)
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const BrowseArtifactsPage(),
                  settings: const RouteSettings(name: '/browse'),
                ),
              );
            } else if (i == 2) {
              // Navigate to Saved artifacts
              setState(() => _current = 2);
              Navigator.of(context).pushNamed('/saved').then((_) {
                if (!mounted) return;
                // restore selection to Home after returning
                setState(() => _current = 0);
              });
            } else if (i == 3) {
              // Navigate to Kings Persona List
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const PersonaListPage(),
                  settings: const RouteSettings(name: '/personas'),
                ),
              );
            } else {
              // Handle other navigation items
              setState(() => _current = i);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    '${['Home', 'Explore', 'Saved', 'Kings'][i]} - Coming Soon',
                  ),
                  duration: const Duration(seconds: 1),
                ),
              );
            }
          },
        ),
      ),
    );
  }
}
