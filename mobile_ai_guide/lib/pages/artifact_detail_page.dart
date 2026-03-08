import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/models/artifact.dart';
import 'package:mobile_ai_guide/pages/ai_guide_chat_page.dart';
import 'package:mobile_ai_guide/widgets/artifact_detail/artifact_detail_header.dart';
import 'package:mobile_ai_guide/pages/ai_guide_intro_page.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';
import 'package:mobile_ai_guide/widgets/artifact_detail/artifact_detail_info.dart';
import 'package:mobile_ai_guide/widgets/artifact_detail/artifact_detail_content.dart';
import 'package:mobile_ai_guide/widgets/navigation/app_bottom_navigation.dart';
import 'package:mobile_ai_guide/widgets/navigation/bottom_navigation_mixin.dart';
import 'package:mobile_ai_guide/ui/content_language.dart';
import 'package:mobile_ai_guide/ui/colors.dart';

class ArtifactDetailPage extends StatefulWidget {
  const ArtifactDetailPage({required this.artifact, super.key});

  final Artifact artifact;

  @override
  State<ArtifactDetailPage> createState() => _ArtifactDetailPageState();
}

class _ArtifactDetailPageState extends State<ArtifactDetailPage>
    with BottomNavigationMixin {
  bool _isSaved = false;
  @override
  void initState() {
    super.initState();
    currentNavIndex = 1; // Explore selected by default
    // check saved state
    () async {
      final saved = await LocalStorageService.instance.isArtifactSaved(
        widget.artifact.artifactId,
      );
      if (!mounted) return;
      setState(() => _isSaved = saved);
    }();
  }

  @override
  Widget build(BuildContext context) {
    final artifact = widget.artifact;
    return ValueListenableBuilder<String>(
      valueListenable: AppContentLanguage.instance.notifier,
      builder: (context, language, _) {
        final contentLanguage = language == 'si' ? 'si' : 'en';
        return Scaffold(
          backgroundColor: Colors.white,
          body: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ArtifactDetailHeader(
                        imageUrls: artifact.imageUrls,
                        isBookmarked: _isSaved,
                        onBookmarkPressed: () async {
                          await LocalStorageService.instance
                              .toggleArtifactBookmark(artifact);
                          if (!mounted) return;
                          final saved = await LocalStorageService.instance
                              .isArtifactSaved(artifact.artifactId);
                          setState(() => _isSaved = saved);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                saved
                                    ? 'Saved to artifacts'
                                    : 'Removed from saved',
                              ),
                            ),
                          );
                        },
                      ),
                      ArtifactDetailInfo(
                        title: artifact.getTitle(contentLanguage),
                        gallery: artifact.getGallery(contentLanguage) ?? '',
                      ),
                      const SizedBox(height: 4),
                      ArtifactDetailContent(
                        description: artifact.getDescription(contentLanguage),
                        year: artifact.year,
                        category: artifact.getCategory(contentLanguage),
                        origin: artifact.getOrigin(contentLanguage),
                        material: artifact.getMaterial(contentLanguage),
                        dimensions: artifact.getDimensions(contentLanguage),
                        culturalSignificance: artifact.getCulturalSignificance(
                          contentLanguage,
                        ),
                      ),

                      // Ask AI Guide button placed inside scrollable content
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () async {
                              final usageSummary = await LocalStorageService
                                  .instance
                                  .getSessionUsageSummary();
                              final hasUserConversations =
                                  usageSummary.conversations > 0;

                              if (!mounted) return;

                              if (hasUserConversations) {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) =>
                                        AiGuideChatPage(artifact: artifact),
                                  ),
                                );
                                return;
                              }

                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) =>
                                      AiGuideIntroPage(artifact: artifact),
                                ),
                              );
                            },
                            child: Container(
                              width: double.infinity,
                              height: 52,
                              decoration: BoxDecoration(
                                color: kGold,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    width: 36,
                                    height: 36,
                                    margin: const EdgeInsets.only(right: 12),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Icon(
                                      Icons.android,
                                      color: kGold,
                                      size: 20,
                                    ),
                                  ),
                                  const Text(
                                    'Ask AI Guide',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ],
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
