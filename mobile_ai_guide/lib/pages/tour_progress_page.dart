import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/models/tour.dart';
import 'package:mobile_ai_guide/pages/artifact_detail_page.dart';
import 'package:mobile_ai_guide/services/artifact_service.dart';
import 'package:mobile_ai_guide/ui/colors.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';

class TourProgressPage extends StatefulWidget {
  const TourProgressPage({
    required this.tour,
    required this.tourNumber,
    super.key,
  });

  final Tour tour;
  final int tourNumber;

  @override
  State<TourProgressPage> createState() => _TourProgressPageState();
}

class _TourProgressPageState extends State<TourProgressPage> {
  late final Set<String> _visitedArtifactIds;
  String? _loadingArtifactId;

  @override
  void initState() {
    super.initState();
    _visitedArtifactIds = widget.tour.points
        .where((point) => point.visited)
        .map((point) => point.artifactId)
        .toSet();
    // overlay persisted progress from local DB
    () async {
      try {
        final saved = await LocalStorageService.instance.getVisitedIdsForTour(widget.tour.id);
        if (!mounted) return;
        setState(() {
          _visitedArtifactIds.addAll(saved);
        });
      } catch (_) {}
    }();
  }

  int get _visitedCount => _visitedArtifactIds.length;

  bool _isVisited(TourPoint point) =>
      _visitedArtifactIds.contains(point.artifactId);

  void _toggleVisited(TourPoint point) {
    setState(() {
      if (_isVisited(point)) {
        _visitedArtifactIds.remove(point.artifactId);
      } else {
        _visitedArtifactIds.add(point.artifactId);
      }
    });
    // persist change
    LocalStorageService.instance.setTourPointVisited(widget.tour.id, point.artifactId, _isVisited(point));
  }

  Future<void> _openArtifact(TourPoint point) async {
    if (_loadingArtifactId != null) return;

    setState(() {
      _loadingArtifactId = point.artifactId;
    });

    try {
      final artifact = await ArtifactService.getArtifactByArtifactId(
        point.artifactId,
      );
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ArtifactDetailPage(artifact: artifact),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Unable to open artifact')));
    } finally {
      if (mounted) {
        setState(() {
          _loadingArtifactId = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final points = widget.tour.points;
    final completion = points.isEmpty
        ? 0
        : ((_visitedCount / points.length) * 100).round();

    return Scaffold(
      backgroundColor: kCream,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        title: Text(
          'Tour ${widget.tourNumber}',
          style: const TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w800,
          ),
        ),
        centerTitle: true,
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.fromLTRB(12, 12, 12, 8),
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [kMuseumDeep, kDeepBrown.withValues(alpha: 0.95)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.tour.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Follow the route and open each artifact from the linked list.',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.85),
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _SummaryBadge(label: 'Stops', value: '${points.length}'),
                      const SizedBox(width: 8),
                      _SummaryBadge(label: 'Visited', value: '$_visitedCount'),
                      const SizedBox(width: 8),
                      _SummaryBadge(label: 'Done', value: '$completion%'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 20),
            sliver: SliverList.separated(
              itemBuilder: (context, index) {
                final point = points[index];
                final artifactTitle =
                    point.artifact?.displayTitle.isNotEmpty == true
                    ? point.artifact!.displayTitle
                    : 'Artifact';
                final isVisited = _isVisited(point);
                final opening = _loadingArtifactId == point.artifactId;
                final imageUrl = point.artifact?.imageUrl;
                final floor = point.floor?.trim();
                final section = point.section?.trim();
                final guidance = point.guidance?.trim();
                final notes = point.notes?.trim();

                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: kCardShadow,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Stack(
                        children: [
                          ClipRRect(
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(14),
                            ),
                            child: SizedBox(
                              height: 132,
                              width: double.infinity,
                              child: imageUrl != null && imageUrl.isNotEmpty
                                  ? Image.network(imageUrl, fit: BoxFit.cover)
                                  : Container(
                                      color: kStoneSurface,
                                      alignment: Alignment.center,
                                      child: const Icon(
                                        Icons.image_not_supported_outlined,
                                        color: kMuseumSubText,
                                        size: 32,
                                      ),
                                    ),
                            ),
                          ),
                          Positioned(
                            left: 10,
                            top: 10,
                            child: Container(
                              width: 32,
                              height: 32,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: kGold,
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                '${point.order}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: Colors.black,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              artifactTitle,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                            if (floor != null && floor.isNotEmpty)
                              _InfoLine(label: 'Floor', value: floor),
                            if (section != null && section.isNotEmpty)
                              _InfoLine(label: 'Section', value: section),
                            if (guidance != null && guidance.isNotEmpty)
                              _InfoLine(label: 'Guidance', value: guidance),
                            if (notes != null && notes.isNotEmpty)
                              _InfoLine(label: 'Note', value: notes),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: opening
                                        ? null
                                        : () => _openArtifact(point),
                                    icon: opening
                                        ? const SizedBox(
                                            width: 14,
                                            height: 14,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                            ),
                                          )
                                        : const Icon(
                                            Icons.open_in_new_rounded,
                                            size: 16,
                                          ),
                                    label: Text(
                                      opening ? 'Opening...' : 'Open Artifact',
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                InkWell(
                                  borderRadius: BorderRadius.circular(24),
                                  onTap: () => _toggleVisited(point),
                                  child: Padding(
                                    padding: const EdgeInsets.all(6),
                                    child: Icon(
                                      isVisited
                                          ? Icons.check_circle_rounded
                                          : Icons.radio_button_unchecked,
                                      color: isVisited
                                          ? kSuccessText
                                          : Colors.grey.shade500,
                                      size: 24,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemCount: points.length,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoLine extends StatelessWidget {
  const _InfoLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: RichText(
        text: TextSpan(
          style: TextStyle(
            color: Colors.grey.shade700,
            fontSize: 13,
            height: 1.3,
          ),
          children: [
            TextSpan(
              text: '$label: ',
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: Colors.black87,
              ),
            ),
            TextSpan(text: value),
          ],
        ),
      ),
    );
  }
}

class _SummaryBadge extends StatelessWidget {
  const _SummaryBadge({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: const TextStyle(
                color: kGoldLight,
                fontWeight: FontWeight.w800,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.88),
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
