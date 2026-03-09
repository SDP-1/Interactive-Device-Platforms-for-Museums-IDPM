import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/models/artifact.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';
import 'package:mobile_ai_guide/pages/artifact_detail_page.dart';
import 'package:mobile_ai_guide/pages/browse_artifacts_page.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;
import 'package:mobile_ai_guide/widgets/navigation/app_bottom_navigation.dart';
import 'package:mobile_ai_guide/widgets/navigation/bottom_navigation_mixin.dart';
import 'package:mobile_ai_guide/ui/content_language.dart';

class SavedArtifactsPage extends StatefulWidget {
  const SavedArtifactsPage({super.key});

  @override
  State<SavedArtifactsPage> createState() => _SavedArtifactsPageState();
}

class _SavedArtifactsPageState extends State<SavedArtifactsPage>
    with BottomNavigationMixin {
  List<Artifact> _items = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    currentNavIndex = 2; // Saved tab
    _load();
  }

  Future<void> _load() async {
    final items = await LocalStorageService.instance.getSavedArtifacts();
    if (!mounted) return;
    setState(() {
      _items = items;
      _isLoading = false;
    });
  }

  Future<void> _toggle(Artifact a) async {
    await LocalStorageService.instance.toggleArtifactBookmark(a);
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppContentLanguage.instance.notifier,
      builder: (context, language, _) {
        final contentLanguage = language == 'si' ? 'si' : 'en';
        return Scaffold(
          backgroundColor: app.kCream,
          appBar: AppBar(
            backgroundColor: app.kCream,
            elevation: 0,
            title: const Text(
              'Saved Artifacts',
              style: TextStyle(
                color: app.kMuseumText,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          body: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _items.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 36),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.bookmark_border,
                          size: 64,
                          color: app.kMuseumSubText,
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No saved artifacts yet',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Tap the bookmark icon on an artifact detail to save it here for later.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: app.kMuseumSubText),
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: 220,
                          child: FilledButton(
                            style: FilledButton.styleFrom(
                              backgroundColor: app.kGold,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => const BrowseArtifactsPage(),
                                  settings: const RouteSettings(
                                    name: '/browse',
                                  ),
                                ),
                              );
                            },
                            child: const Text(
                              'Browse artifacts',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: _items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final artifact = _items[index];
                    return Material(
                      borderRadius: BorderRadius.circular(12),
                      color: Colors.white,
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        leading: SizedBox(
                          width: 64,
                          height: 64,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: artifact.imageUrl.isNotEmpty
                                ? Image.network(
                                    artifact.imageUrl,
                                    fit: BoxFit.cover,
                                  )
                                : Container(color: Colors.grey.shade200),
                          ),
                        ),
                        title: Text(
                          artifact.getTitle(contentLanguage),
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              artifact.getOrigin(contentLanguage),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if ((artifact.getGallery(contentLanguage) ?? '')
                                .isNotEmpty)
                              Text(
                                artifact.getGallery(contentLanguage) ?? '',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                          ],
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.bookmark),
                          color: app.kAccentOrange,
                          onPressed: () => _toggle(artifact),
                        ),
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) =>
                                ArtifactDetailPage(artifact: artifact),
                          ),
                        ),
                      ),
                    );
                  },
                ),
          bottomNavigationBar: AppBottomNavigationBar(
            selectedIndex: currentNavIndex,
            onDestinationSelected: handleNavigation,
          ),
        );
      },
    );
  }
}
