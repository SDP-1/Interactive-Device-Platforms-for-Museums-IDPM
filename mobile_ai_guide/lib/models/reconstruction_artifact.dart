/// Artifact from the Artifact Reconstruction system (Supabase 3D_Artifact_Table).
/// Used to display visitor 3D model + details when user scans a reconstruction QR.
class ReconstructionArtifact {
  final String id;
  final String name;
  final String? category;
  final String? era;
  final String? origin;
  final String? description;
  final String? imageUrl;
  final String? modelUrl;
  final DateTime createdAt;

  ReconstructionArtifact({
    required this.id,
    required this.name,
    this.category,
    this.era,
    this.origin,
    this.description,
    this.imageUrl,
    this.modelUrl,
    required this.createdAt,
  });

  factory ReconstructionArtifact.fromMap(Map<String, dynamic> map) {
    return ReconstructionArtifact(
      id: map['id'].toString(),
      name: (map['name'] as String?) ?? 'Artifact',
      category: map['category'] as String?,
      era: map['era'] as String?,
      origin: map['origin'] as String?,
      description: map['description'] as String?,
      imageUrl: map['image_url'] as String?,
      modelUrl: map['model_url'] as String?,
      createdAt: map['created_at'] != null
          ? DateTime.parse(map['created_at'] as String)
          : DateTime.now(),
    );
  }
}
