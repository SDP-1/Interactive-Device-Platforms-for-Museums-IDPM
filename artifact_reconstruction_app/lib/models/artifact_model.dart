class Artifact {
  final String id;
  final String name;
  final String? category;
  final String? era;
  final String? origin;
  final String? description;
  final String? imageUrl;
  final String? modelUrl;
  final String? qrCodeData;
  final DateTime createdAt;
  final DateTime? approvedAt;
  final String? approvedBy;

  Artifact({
    required this.id,
    required this.name,
    this.category,
    this.era,
    this.origin,
    this.description,
    this.imageUrl,
    this.modelUrl,
    this.qrCodeData,
    required this.createdAt,
    this.approvedAt,
    this.approvedBy,
  });

  factory Artifact.fromMap(Map<String, dynamic> map) {
    return Artifact(
      id: map['id'].toString(),
      name: map['name'] as String,
      category: map['category'] as String?,
      era: map['era'] as String?,
      origin: map['origin'] as String?,
      description: map['description'] as String?,
      imageUrl: map['image_url'] as String?,
      modelUrl: map['model_url'] as String?,
      qrCodeData: map['qr_code_data'] as String?,
      createdAt: DateTime.parse(map['created_at'] as String),
      approvedAt: map['approved_at'] != null 
          ? DateTime.parse(map['approved_at'] as String) 
          : null,
      approvedBy: map['approved_by'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (id.isNotEmpty) 'id': id,
      'name': name,
      if (category != null) 'category': category,
      if (era != null) 'era': era,
      if (origin != null) 'origin': origin,
      if (description != null) 'description': description,
      if (imageUrl != null) 'image_url': imageUrl,
      if (modelUrl != null) 'model_url': modelUrl,
      if (qrCodeData != null) 'qr_code_data': qrCodeData,
      'created_at': createdAt.toIso8601String(),
      if (approvedAt != null) 'approved_at': approvedAt!.toIso8601String(),
      if (approvedBy != null) 'approved_by': approvedBy,
    };
  }
}
