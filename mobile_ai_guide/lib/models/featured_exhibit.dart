import 'package:mobile_ai_guide/models/artifact.dart';

class FeaturedExhibit {
  FeaturedExhibit({
    required this.id,
    required this.name,
    this.description,
    this.imageUrl,
    this.estimatedVisitMinutes,
    required this.artifacts,
  });

  final String id;
  final String name;
  final String? description;
  final String? imageUrl;
  final int? estimatedVisitMinutes;
  final List<Artifact> artifacts;

  factory FeaturedExhibit.fromJson(Map<String, dynamic> json) {
    final List<dynamic>? rawArtifacts = json['artifacts'] as List<dynamic>?;
    List<Artifact> parsedArtifacts() {
      if (rawArtifacts == null) return <Artifact>[];
      final List<Artifact> out = [];
      for (final e in rawArtifacts) {
        if (e == null) continue;
        if (e is String) {
          // backend may return artifact_id strings in some places
          out.add(Artifact.fromJson({'artifact_id': e}));
        } else if (e is Map) {
          out.add(Artifact.fromJson(Map<String, dynamic>.from(e)));
        } else {
          try {
            out.add(Artifact.fromJson(Map<String, dynamic>.from(e)));
          } catch (_) {
            // ignore unparseable entries
          }
        }
      }
      return out;
    }

    return FeaturedExhibit(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: json['description']?.toString(),
      imageUrl: json['imageUrl']?.toString(),
      estimatedVisitMinutes: json['estimated_visit_minutes'] is int
          ? json['estimated_visit_minutes'] as int
          : int.tryParse((json['estimated_visit_minutes'] ?? '').toString()),
      artifacts: parsedArtifacts(),
    );
  }
}
