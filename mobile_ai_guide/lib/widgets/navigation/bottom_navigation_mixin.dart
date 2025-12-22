import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/pages/browse_artifacts_page.dart';
import 'package:mobile_ai_guide/pages/persona_list_page.dart';

mixin BottomNavigationMixin<T extends StatefulWidget> on State<T> {
  late int currentNavIndex = 1; // Default to Explore

  void handleNavigation(int index) {
    if (index == currentNavIndex) {
      // Already on this page, do nothing
      return;
    }

    if (index == 0) {
      // Navigate to Home - pop all routes to return to home
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else if (index == 1) {
      // Navigate to Browse Artifacts (Explore)
      // Try to pop back to BrowseArtifactsPage if it exists in the stack
      bool foundBrowsePage = false;
      Navigator.of(context).popUntil((route) {
        if (route.settings.name == '/browse' || route.isFirst) {
          foundBrowsePage = !route.isFirst;
          return true;
        }
        return false;
      });

      // If we didn't find BrowseArtifactsPage, push it
      if (!foundBrowsePage) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => const BrowseArtifactsPage(),
            settings: const RouteSettings(name: '/browse'),
          ),
        );
      }
    } else if (index == 3) {
      // Navigate to Kings Persona List
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => const PersonaListPage(),
          settings: const RouteSettings(name: '/personas'),
        ),
      );
    } else {
      // Handle other navigation items
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${['Home', 'Explore', 'Saved', 'Kings'][index]} - Coming Soon',
          ),
          duration: const Duration(seconds: 1),
        ),
      );
    }
  }
}
