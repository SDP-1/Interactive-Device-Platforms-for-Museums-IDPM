import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/models/tour.dart';
import 'package:mobile_ai_guide/pages/tour_progress_page.dart';
import 'package:mobile_ai_guide/services/tour_service.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';
import 'package:mobile_ai_guide/ui/colors.dart';

class ToursPage extends StatefulWidget {
  const ToursPage({super.key});

  @override
  State<ToursPage> createState() => _ToursPageState();
}

class _ToursPageState extends State<ToursPage> {
  late Future<List<Tour>> _toursFuture;
  List<Tour>? _cachedTours;

  @override
  void initState() {
    super.initState();
    _toursFuture = _loadTours();
  }

  Future<List<Tour>> _loadTours() async {
    // Try cached first
    try {
      final cached = await LocalStorageService.instance.getCachedTourList();
      if (cached != null && cached.isNotEmpty) {
        // kick off network refresh in background
        TourService.getTours()
            .then((fresh) {
              // update cache and UI
              try {
                LocalStorageService.instance.cacheTourList(fresh);
              } catch (_) {}
              if (!mounted) return;
              setState(() => _toursFuture = Future.value(fresh));
            })
            .catchError((_) {});
        _cachedTours = cached;
        return cached;
      }
    } catch (_) {}

    // fallback to network
    final fresh = await TourService.getTours();
    try {
      await LocalStorageService.instance.cacheTourList(fresh);
    } catch (_) {}
    return fresh;
  }

  Future<void> _refreshTours() async {
    setState(() {
      _toursFuture = TourService.getTours();
    });
    await _toursFuture;
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
          'Curated Tours',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
      ),
      body: FutureBuilder<List<Tour>>(
        future: _toursFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 56,
                      color: Colors.red.shade300,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Unable to load tours',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Colors.grey.shade800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      snapshot.error.toString(),
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                    const SizedBox(height: 18),
                    ElevatedButton.icon(
                      onPressed: _refreshTours,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }

          final tours = snapshot.data ?? <Tour>[];
          if (tours.isEmpty) {
            return const Center(
              child: Text(
                'No active tours available yet',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            );
          }

          final totalArtifacts = tours.fold<int>(
            0,
            (sum, t) => sum + t.artifactCount,
          );
          final avgDuration =
              tours.fold<int>(0, (sum, t) => sum + t.durationMinutes) ~/
              (tours.isEmpty ? 1 : tours.length);

          return RefreshIndicator(
            onRefresh: _refreshTours,
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: _ToursOverviewCard(
                    activeTours: tours.length,
                    totalArtifacts: totalArtifacts,
                    avgDurationMinutes: avgDuration,
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 20),
                  sliver: SliverList.builder(
                    itemCount: tours.length,
                    itemBuilder: (context, index) {
                      final tour = tours[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: _TourCard(
                          index: index + 1,
                          tour: tour,
                          onTap: () => _showTourStartModal(tour, index + 1),
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

  void _showTourStartModal(Tour tour, int tourNumber) {
    // If tour already started for this session, skip start modal and open progress
    LocalStorageService.instance.isTourStarted(tour.id).then((started) {
      if (started) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) =>
                TourProgressPage(tour: tour, tourNumber: tourNumber),
          ),
        );
        return;
      }

      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (sheetContext) {
          return Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 44,
                        height: 5,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Tour $tourNumber',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      tour.name,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _MetaChip(
                          icon: Icons.route_outlined,
                          label: '${tour.artifactCount} Stops',
                        ),
                        _MetaChip(
                          icon: Icons.schedule_rounded,
                          label: tour.durationLabel,
                        ),
                        if ((tour.section ?? '').isNotEmpty)
                          _MetaChip(
                            icon: Icons.place_outlined,
                            label: tour.section!,
                          ),
                      ],
                    ),
                    if ((tour.guidance ?? '').isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(
                        tour.guidance!,
                        style: TextStyle(
                          color: Colors.grey.shade700,
                          fontSize: 14,
                          height: 1.4,
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          // mark started in local DB so modal won't show again
                          await LocalStorageService.instance.startTour(tour.id);
                          Navigator.of(sheetContext).pop();
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => TourProgressPage(
                                tour: tour,
                                tourNumber: tourNumber,
                              ),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kGold,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        icon: const Icon(Icons.play_arrow_rounded),
                        label: const Text(
                          'Start Tour',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      );
    });
  }
}

class _ToursOverviewCard extends StatelessWidget {
  const _ToursOverviewCard({
    required this.activeTours,
    required this.totalArtifacts,
    required this.avgDurationMinutes,
  });

  final int activeTours;
  final int totalArtifacts;
  final int avgDurationMinutes;

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
            'Curated Tours',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Explore carefully designed routes and discover stories artifact by artifact.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.8),
              height: 1.35,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 14),
          _StatTile(label: 'Active Tours', value: '$activeTours'),
          const SizedBox(height: 8),
          _StatTile(label: 'Artifacts', value: '$totalArtifacts'),
          const SizedBox(height: 8),
          _StatTile(label: 'Avg Duration', value: '${avgDurationMinutes}m'),
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

class _TourCard extends StatelessWidget {
  const _TourCard({
    required this.index,
    required this.tour,
    required this.onTap,
  });

  final int index;
  final Tour tour;
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
                    child: tour.coverImageUrl.isNotEmpty
                        ? Image.network(tour.coverImageUrl, fit: BoxFit.cover)
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
                      '${tour.artifactCount} Artifacts',
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
                    tour.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 17,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    tour.guidance ?? 'Journey through selected highlights.',
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
                        tour.durationLabel,
                        style: TextStyle(
                          color: Colors.grey.shade700,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        'Start Tour',
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

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: kWarmPanel,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Colors.black87),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
