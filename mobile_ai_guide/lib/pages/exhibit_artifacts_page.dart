import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/models/featured_exhibit.dart';
import 'package:mobile_ai_guide/models/artifact.dart';
import 'package:mobile_ai_guide/widgets/browse_artifacts/artifact_grid_card.dart';
import 'package:mobile_ai_guide/ui/colors.dart';
import 'package:mobile_ai_guide/services/featured_exhibits_service.dart';

class ExhibitArtifactsPage extends StatefulWidget {
  const ExhibitArtifactsPage({required this.exhibit, super.key});

  final FeaturedExhibit exhibit;

  @override
  State<ExhibitArtifactsPage> createState() => _ExhibitArtifactsPageState();
}

class _ExhibitArtifactsPageState extends State<ExhibitArtifactsPage> {
  late FeaturedExhibit _exhibit;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _exhibit = widget.exhibit;
  }

  Future<void> _refresh() async {
    if (_exhibit.id.isEmpty) return;
    setState(() => _loading = true);
    try {
      final fresh = await FeaturedExhibitsService.fetchFeaturedExhibitById(
        _exhibit.id,
      );
      if (!mounted) return;
      setState(() => _exhibit = fresh);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Unable to refresh exhibit. Please try again.'),
            duration: Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final artifacts = _exhibit.artifacts;
    return Scaffold(
      backgroundColor: kCream,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          color: Colors.black,
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          _exhibit.name,
          style: const TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: RefreshIndicator(
          onRefresh: _refresh,
          child: artifacts.isEmpty
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: [
                    SizedBox(
                      height: MediaQuery.of(context).size.height * 0.5,
                      child: Center(
                        child: Text(
                          'No artifacts in this exhibit',
                          style: TextStyle(color: Colors.grey.shade700),
                        ),
                      ),
                    ),
                  ],
                )
              : GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.72,
                  ),
                  itemCount: artifacts.length,
                  itemBuilder: (context, index) {
                    final artifact = artifacts[index];
                    return ArtifactGridCard(artifact: artifact, language: 'en');
                  },
                ),
        ),
      ),
    );
  }
}
