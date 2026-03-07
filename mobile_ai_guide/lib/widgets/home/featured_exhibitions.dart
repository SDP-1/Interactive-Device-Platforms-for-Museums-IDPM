import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;
import 'package:mobile_ai_guide/models/featured_exhibit.dart';
import 'package:mobile_ai_guide/services/featured_exhibits_service.dart';
import 'package:mobile_ai_guide/pages/featured_exhibitions_page.dart';
import 'package:mobile_ai_guide/pages/exhibit_artifacts_page.dart';
import 'package:mobile_ai_guide/services/session_access_service.dart';
import 'package:mobile_ai_guide/widgets/common/session_guard.dart';

class FeaturedExhibitionsSection extends StatefulWidget {
  const FeaturedExhibitionsSection({super.key});

  @override
  State<FeaturedExhibitionsSection> createState() =>
      _FeaturedExhibitionsSectionState();
}

class _FeaturedExhibitionsSectionState
    extends State<FeaturedExhibitionsSection> {
  late Future<List<FeaturedExhibit>> _future;
  bool _sessionRedirectTriggered = false;

  @override
  void initState() {
    super.initState();
    _future = FeaturedExhibitsService.fetchFeaturedExhibits();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: app.kCardShadow,
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _HeaderRow(
            onViewAll: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const FeaturedExhibitionsPage(),
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          FutureBuilder<List<FeaturedExhibit>>(
            future: _future,
            builder: (context, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return const SizedBox(
                  height: 120,
                  child: Center(child: CircularProgressIndicator()),
                );
              }
              if (snap.hasError) {
                // handle session redirect specially
                if (snap.error is SessionAccessException &&
                    !_sessionRedirectTriggered) {
                  _sessionRedirectTriggered = true;
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    SessionGuard.redirectToSessionIntro(
                      context,
                      message: (snap.error as SessionAccessException).message,
                    );
                  });
                  return const SizedBox(
                    height: 120,
                    child: Center(child: CircularProgressIndicator()),
                  );
                }

                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 28.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.error_outline,
                            size: 56,
                            color: Colors.red.shade300,
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Unable to load featured exhibitions',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Please check your connection and try again.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.grey.shade700),
                          ),
                          const SizedBox(height: 12),
                          FilledButton(
                            style: FilledButton.styleFrom(
                              backgroundColor: app.kGold,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 10,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                            onPressed: () {
                              setState(() {
                                _future =
                                    FeaturedExhibitsService.fetchFeaturedExhibits();
                                _sessionRedirectTriggered = false;
                              });
                            },
                            child: const Text(
                              'Retry',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              final items = snap.data ?? [];
              final showCount = items.length >= 3 ? 3 : items.length;
              if (showCount == 0) {
                return const Text('No featured exhibitions available');
              }
              return Column(
                children: List.generate(showCount, (i) {
                  final ex = items[i];
                  return Column(
                    children: [
                      ExhibitionItem(
                        imageUrl: ex.imageUrl ?? '',
                        title: ex.name,
                        artifacts: '${ex.artifacts.length} artifacts',
                        duration: '${ex.estimatedVisitMinutes ?? 30} min tour',
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ExhibitArtifactsPage(exhibit: ex),
                            ),
                          );
                        },
                      ),
                      if (i < showCount - 1) const SizedBox(height: 12),
                    ],
                  );
                }),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _HeaderRow extends StatelessWidget {
  const _HeaderRow({this.onViewAll});

  final VoidCallback? onViewAll;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
          child: Text(
            'Featured Exhibitions',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
          ),
        ),
        GestureDetector(
          onTap: onViewAll,
          child: const Text(
            'View All',
            style: TextStyle(color: app.kGold, fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}

class ExhibitionItem extends StatelessWidget {
  const ExhibitionItem({
    super.key,
    required this.imageUrl,
    required this.title,
    required this.artifacts,
    required this.duration,
    this.onTap,
  });

  final String imageUrl;
  final String title;
  final String artifacts;
  final String duration;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          _ExhibitionThumb(imageUrl: imageUrl),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Text(
                  artifacts,
                  style: const TextStyle(
                    color: app.kStoneText,
                    fontSize: 14,
                    height: 1.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: app.kStoneAccent,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      duration,
                      style: const TextStyle(
                        color: app.kStoneText,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: app.kGold),
        ],
      ),
    );
  }
}

class _ExhibitionThumb extends StatelessWidget {
  const _ExhibitionThumb({required this.imageUrl});

  final String imageUrl;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Image.network(
        imageUrl,
        width: 86,
        height: 86,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stack) => const _FallbackThumb(),
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return const _FallbackThumb(isLoading: true);
        },
      ),
    );
  }
}

class _FallbackThumb extends StatelessWidget {
  const _FallbackThumb({this.isLoading = false});

  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 86,
      height: 86,
      color: app.kStoneSurface,
      child: Center(
        child: isLoading
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: app.kGold,
                ),
              )
            : const Icon(
                Icons.image_not_supported_outlined,
                color: Colors.black26,
              ),
      ),
    );
  }
}
