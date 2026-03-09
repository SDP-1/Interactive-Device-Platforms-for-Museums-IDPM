import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/services/artifact_service.dart';
import 'package:mobile_ai_guide/models/artifact.dart';
import 'package:mobile_ai_guide/services/session_access_service.dart';
import 'package:mobile_ai_guide/widgets/browse_artifacts/artifact_grid_card.dart';
import 'package:mobile_ai_guide/widgets/browse_artifacts/filter_row.dart';
import 'package:mobile_ai_guide/ui/colors.dart';
import 'package:mobile_ai_guide/ui/content_language.dart';
import 'package:mobile_ai_guide/widgets/common/session_guard.dart';
import 'package:mobile_ai_guide/widgets/navigation/app_bottom_navigation.dart';
import 'package:mobile_ai_guide/widgets/navigation/bottom_navigation_mixin.dart';

class BrowseArtifactsPage extends StatefulWidget {
  const BrowseArtifactsPage({super.key});

  @override
  State<BrowseArtifactsPage> createState() => _BrowseArtifactsPageState();
}

class _BrowseArtifactsPageState extends State<BrowseArtifactsPage>
    with BottomNavigationMixin {
  late Future<List<Artifact>> _artifactsFuture;
  bool _sessionRedirectTriggered = false;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedFilter = 'All';

  static const String _allFilter = 'All';
  static const String _othersFilter = 'Others';
  static const Set<String> _otherCategoryKeywords = {
    'other',
    'others',
    'misc',
    'miscellaneous',
    'unknown',
    'uncategorized',
    'uncategorised',
  };

  @override
  void initState() {
    super.initState();
    _artifactsFuture = ArtifactService.getAllArtifacts();
    currentNavIndex = 1; // Set to 1 for Explore
  }

  void _refreshArtifacts() {
    setState(() {
      _artifactsFuture = ArtifactService.getAllArtifacts(forceRefresh: true);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  bool _matchesSearch(Artifact artifact) {
    final query = _searchQuery.trim().toLowerCase();
    if (query.isEmpty) return true;

    final searchable = <String>[
      artifact.titleEn,
      artifact.titleSi,
      artifact.categoryEn,
      artifact.categorySi,
      artifact.originEn,
      artifact.originSi,
      artifact.artifactId,
    ].join(' ').toLowerCase();

    return searchable.contains(query);
  }

  bool _isOtherCategory(Artifact artifact) {
    final en = artifact.categoryEn.trim().toLowerCase();
    final si = artifact.categorySi.trim().toLowerCase();

    if (en.isEmpty && si.isEmpty) {
      return true;
    }

    return _otherCategoryKeywords.contains(en) ||
        _otherCategoryKeywords.contains(si);
  }

  List<String> _buildFilters(List<Artifact> artifacts) {
    final categories =
        artifacts
            .map((a) => a.categoryEn.trim())
            .where((c) => c.isNotEmpty)
            .toSet()
            .toList()
          ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));

    return <String>[_allFilter, ...categories, _othersFilter];
  }

  List<Artifact> _applyFilters(
    List<Artifact> artifacts,
    String selectedFilter,
  ) {
    final bySearch = artifacts.where(_matchesSearch);

    if (selectedFilter == _allFilter) {
      return bySearch.toList();
    }

    if (selectedFilter == _othersFilter) {
      return bySearch.where(_isOtherCategory).toList();
    }

    return bySearch
        .where(
          (artifact) =>
              artifact.categoryEn.trim().toLowerCase() ==
              selectedFilter.toLowerCase(),
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kCream,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          color: Colors.black,
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'All Artifacts',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            color: Colors.black,
            onPressed: () {},
          ),
        ],
      ),
      body: ValueListenableBuilder<String>(
        valueListenable: AppContentLanguage.instance.notifier,
        builder: (context, language, _) {
          final contentLanguage = language == 'si' ? 'si' : 'en';
          return Column(
            children: [
              Container(
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: Container(
                  decoration: BoxDecoration(
                    color: kSearchField,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: TextField(
                    controller: _searchController,
                    textInputAction: TextInputAction.search,
                    onChanged: (value) {
                      setState(() {
                        _searchQuery = value;
                      });
                    },
                    decoration: InputDecoration(
                      hintText: 'Search by name or category...',
                      hintStyle: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 14,
                      ),
                      prefixIcon: Icon(
                        Icons.search,
                        color: Colors.grey.shade600,
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: FutureBuilder<List<Artifact>>(
                  future: _artifactsFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    } else if (snapshot.hasError) {
                      if (snapshot.error is SessionAccessException &&
                          !_sessionRedirectTriggered) {
                        _sessionRedirectTriggered = true;
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          if (!mounted) return;
                          final error =
                              snapshot.error! as SessionAccessException;
                          SessionGuard.redirectToSessionIntro(
                            context,
                            message: error.message,
                          );
                        });
                        return const Center(child: CircularProgressIndicator());
                      }

                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.error_outline,
                              size: 64,
                              color: Colors.red.shade300,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Error loading artifacts',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey.shade800,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 32,
                              ),
                              child: Text(
                                snapshot.error.toString(),
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton.icon(
                              onPressed: _refreshArtifacts,
                              icon: const Icon(Icons.refresh),
                              label: const Text('Retry'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: kGold,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 32,
                                  vertical: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.inbox_outlined,
                              size: 64,
                              color: Colors.grey.shade400,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No artifacts found',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey.shade800,
                              ),
                            ),
                          ],
                        ),
                      );
                    }

                    final artifacts = snapshot.data!;
                    final filters = _buildFilters(artifacts);
                    final effectiveSelected = filters.contains(_selectedFilter)
                        ? _selectedFilter
                        : _allFilter;
                    final displayedArtifacts = _applyFilters(
                      artifacts,
                      effectiveSelected,
                    );

                    return RefreshIndicator(
                      onRefresh: () async {
                        setState(() {
                          _artifactsFuture = ArtifactService.getAllArtifacts(
                            forceRefresh: true,
                          );
                        });
                        await _artifactsFuture;
                      },
                      child: CustomScrollView(
                        slivers: [
                          SliverToBoxAdapter(
                            child: Container(
                              color: kFilterBackground,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  FilterRow(
                                    filters: filters,
                                    selected: effectiveSelected,
                                    onSelected: (value) {
                                      setState(() {
                                        _selectedFilter = value;
                                      });
                                    },
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(
                                      16,
                                      0,
                                      16,
                                      12,
                                    ),
                                    child: Row(
                                      children: [
                                        Text(
                                          'Artifacts: ',
                                          style: TextStyle(
                                            fontSize: 13,
                                            color: Colors.grey.shade700,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        Text(
                                          '${displayedArtifacts.length}',
                                          style: TextStyle(
                                            fontSize: 13,
                                            color: Colors.grey.shade900,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          SliverPadding(
                            padding: const EdgeInsets.all(12),
                            sliver: SliverGrid(
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 2,
                                    crossAxisSpacing: 12,
                                    mainAxisSpacing: 12,
                                    childAspectRatio: 0.72,
                                  ),
                              delegate: SliverChildBuilderDelegate((
                                context,
                                index,
                              ) {
                                final artifact = displayedArtifacts[index];
                                return ArtifactGridCard(
                                  artifact: artifact,
                                  language: contentLanguage,
                                );
                              }, childCount: displayedArtifacts.length),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: AppBottomNavigationBar(
        selectedIndex: currentNavIndex,
        onDestinationSelected: handleNavigation,
      ),
    );
  }
}
