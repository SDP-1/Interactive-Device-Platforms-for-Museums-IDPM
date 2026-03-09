import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/models/featured_exhibit.dart';
import 'package:mobile_ai_guide/services/featured_exhibits_service.dart';
import 'package:mobile_ai_guide/pages/exhibit_artifacts_page.dart';
import 'package:mobile_ai_guide/services/session_access_service.dart';
import 'package:mobile_ai_guide/widgets/common/session_guard.dart';
import 'package:mobile_ai_guide/ui/colors.dart';

class FeaturedExhibitionsPage extends StatefulWidget {
  const FeaturedExhibitionsPage({super.key});

  @override
  State<FeaturedExhibitionsPage> createState() =>
      _FeaturedExhibitionsPageState();
}

class _FeaturedExhibitionsPageState extends State<FeaturedExhibitionsPage> {
  late Future<List<FeaturedExhibit>> _future;

  Future<void> _refreshExhibits() async {
    setState(() {
      _future = FeaturedExhibitsService.fetchFeaturedExhibits();
    });
    await _future;
  }

  String _durationLabel(FeaturedExhibit exhibit) {
    final minutes = exhibit.estimatedVisitMinutes;
    if (minutes == null) return '30 min';
    if (minutes <= 0) return 'Self-paced';
    return '${minutes}m';
  }

  bool _sessionRedirectTriggered = false;

  @override
  void initState() {
    super.initState();
    _future = FeaturedExhibitsService.fetchFeaturedExhibits();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kCream,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Featured Exhibitions',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
      ),
      body: FutureBuilder<List<FeaturedExhibit>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            if (snap.error is SessionAccessException &&
                !_sessionRedirectTriggered) {
              _sessionRedirectTriggered = true;
              WidgetsBinding.instance.addPostFrameCallback((_) {
                SessionGuard.redirectToSessionIntro(
                  context,
                  message: (snap.error as SessionAccessException).message,
                );
              });
              return const Center(child: CircularProgressIndicator());
            }

            return Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 56,
                      color: Colors.red.shade300,
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Unable to load exhibitions',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Please check your connection and try again.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey.shade700),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: kGold,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: _refreshExhibits,
                      child: const Text(
                        'Retry',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }
          final items = snap.data ?? [];
          if (items.isEmpty) {
            return const Center(
              child: Text(
                'No featured exhibitions available',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            );
          }

          final maxItems = items.length > 10 ? 10 : items.length;
          final visibleItems = items.take(maxItems).toList();
          final totalArtifacts = visibleItems.fold<int>(
            0,
            (sum, ex) => sum + ex.artifacts.length,
          );

          return RefreshIndicator(
            onRefresh: _refreshExhibits,
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: _ExhibitionsOverviewCard(
                    exhibitionCount: visibleItems.length,
                    totalArtifacts: totalArtifacts,
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 20),
                  sliver: SliverList.builder(
                    itemCount: visibleItems.length,
                    itemBuilder: (context, index) {
                      final ex = visibleItems[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: _ExhibitionCard(
                          index: index + 1,
                          exhibit: ex,
                          durationLabel: _durationLabel(ex),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) =>
                                    ExhibitArtifactsPage(exhibit: ex),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ExhibitionsOverviewCard extends StatelessWidget {
  const _ExhibitionsOverviewCard({
    required this.exhibitionCount,
    required this.totalArtifacts,
  });

  final int exhibitionCount;
  final int totalArtifacts;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 8),
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [kMuseumDeep, kDeepBrown.withValues(alpha: 0.95)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Featured Exhibitions',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Discover highlighted collections and explore stories across key museum themes.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.8),
              height: 1.35,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 14),
          _StatTile(label: 'Exhibitions', value: '$exhibitionCount'),
          const SizedBox(height: 8),
          _StatTile(label: 'Artifacts', value: '$totalArtifacts'),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.82),
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: kGoldLight,
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _ExhibitionCard extends StatelessWidget {
  const _ExhibitionCard({
    required this.index,
    required this.exhibit,
    required this.durationLabel,
    required this.onTap,
  });

  final int index;
  final FeaturedExhibit exhibit;
  final String durationLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      elevation: 1.5,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
                  child: SizedBox(
                    height: 150,
                    width: double.infinity,
                    child: (exhibit.imageUrl ?? '').isNotEmpty
                        ? Image.network(
                            exhibit.imageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                color: kStoneSurface,
                                alignment: Alignment.center,
                                child: const Icon(
                                  Icons.museum_outlined,
                                  size: 42,
                                  color: kMuseumSubText,
                                ),
                              );
                            },
                          )
                        : Container(
                            color: kStoneSurface,
                            alignment: Alignment.center,
                            child: const Icon(
                              Icons.museum_outlined,
                              size: 42,
                              color: kMuseumSubText,
                            ),
                          ),
                  ),
                ),
                Positioned(
                  left: 10,
                  top: 10,
                  child: Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: kGold,
                      shape: BoxShape.circle,
                      boxShadow: kCardShadow,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '$index',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        color: Colors.black,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  right: 10,
                  top: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Text(
                      '${exhibit.artifacts.length} Artifacts',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    exhibit.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 17,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    (exhibit.description ?? '').isNotEmpty
                        ? exhibit.description!
                        : 'Explore this highlighted exhibition collection.',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Colors.grey.shade700, height: 1.3),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(
                        Icons.schedule_rounded,
                        size: 15,
                        color: Colors.grey.shade700,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        durationLabel,
                        style: TextStyle(
                          color: Colors.grey.shade700,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      const Text(
                        'Explore',
                        style: TextStyle(
                          color: kStoneAccent,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 2),
                      const Icon(
                        Icons.arrow_forward,
                        size: 16,
                        color: kStoneAccent,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
