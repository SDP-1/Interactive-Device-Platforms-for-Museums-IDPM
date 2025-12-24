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
import 'package:mobile_ai_guide/widgets/home/featured_exhibitions.dart';
import 'package:mobile_ai_guide/widgets/home/quick_actions.dart';
import 'package:mobile_ai_guide/widgets/navigation/app_bottom_navigation.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _current = 0;
  String? _selectedTile;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: app.kCream,
      appBar: const PreferredSize(
        preferredSize: Size.fromHeight(90),
        child: MuseumHeader(),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const WelcomeSection(),
            const SizedBox(height: 8),
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
              },
              onSaved: () {
                setState(() => _selectedTile = 'Saved');
              },
            ),
            const SizedBox(height: 16),
            const FeaturedExhibitionsSection(),
            const SizedBox(height: 16),
            QuickActionsRow(
              onSettingsTap: () {
                Navigator.of(
                  context,
                ).push(MaterialPageRoute(builder: (_) => const SettingsPage()));
              },
              onHelpTap: () {
                Navigator.of(
                  context,
                ).push(MaterialPageRoute(builder: (_) => const HelpPage()));
              },
            ),
            const SizedBox(height: 24),
          ],
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
    );
  }
}
