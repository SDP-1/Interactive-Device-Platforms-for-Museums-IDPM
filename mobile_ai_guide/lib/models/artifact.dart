class Artifact {
  const Artifact({
    required this.id,
    required this.artifactId,
    required this.titleEn,
    required this.titleSi,
    required this.originEn,
    required this.originSi,
    required this.year,
    required this.categoryEn,
    required this.categorySi,
    required this.descriptionEn,
    required this.descriptionSi,
    required this.imageUrls,
    this.materialEn,
    this.materialSi,
    this.dimensionsEn,
    this.dimensionsSi,
    this.culturalSignificanceEn,
    this.culturalSignificanceSi,
    this.galleryEn,
    this.gallerySi,
    this.createdAt,
    this.updatedAt,
  });

  final String id; // MongoDB _id
  final String artifactId; // ART001, ART002, etc.
  final String titleEn;
  final String titleSi;
  final String originEn;
  final String originSi;
  final String year;
  final String categoryEn;
  final String categorySi;
  final String descriptionEn;
  final String descriptionSi;
  final List<String> imageUrls;
  final String? materialEn;
  final String? materialSi;
  final String? dimensionsEn;
  final String? dimensionsSi;
  final String? culturalSignificanceEn;
  final String? culturalSignificanceSi;
  final String? galleryEn;
  final String? gallerySi;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  String get imageUrl => imageUrls.isNotEmpty ? imageUrls[0] : '';

  // Helper methods to get localized content (defaults to English)
  String getTitle([String language = 'en']) =>
      language == 'si' ? titleSi : titleEn;
  String getOrigin([String language = 'en']) =>
      language == 'si' ? originSi : originEn;
  String getCategory([String language = 'en']) =>
      language == 'si' ? categorySi : categoryEn;
  String getDescription([String language = 'en']) =>
      language == 'si' ? descriptionSi : descriptionEn;
  String? getMaterial([String language = 'en']) =>
      language == 'si' ? materialSi : materialEn;
  String? getDimensions([String language = 'en']) =>
      language == 'si' ? dimensionsSi : dimensionsEn;
  String? getCulturalSignificance([String language = 'en']) =>
      language == 'si' ? culturalSignificanceSi : culturalSignificanceEn;
  String? getGallery([String language = 'en']) =>
      language == 'si' ? gallerySi : galleryEn;

  factory Artifact.fromJson(Map<String, dynamic> json) {
    return Artifact(
      id: json['_id'] as String,
      artifactId: json['artifact_id'] as String,
      titleEn: json['title_en'] as String,
      titleSi: json['title_si'] as String,
      originEn: json['origin_en'] as String,
      originSi: json['origin_si'] as String,
      year: json['year'] as String,
      categoryEn: json['category_en'] as String,
      categorySi: json['category_si'] as String,
      descriptionEn: json['description_en'] as String,
      descriptionSi: json['description_si'] as String,
      imageUrls: List<String>.from(json['imageUrls'] as List),
      materialEn: json['material_en'] as String?,
      materialSi: json['material_si'] as String?,
      dimensionsEn: json['dimensions_en'] as String?,
      dimensionsSi: json['dimensions_si'] as String?,
      culturalSignificanceEn: json['culturalSignificance_en'] as String?,
      culturalSignificanceSi: json['culturalSignificance_si'] as String?,
      galleryEn: json['gallery_en'] as String?,
      gallerySi: json['gallery_si'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'artifact_id': artifactId,
      'title_en': titleEn,
      'title_si': titleSi,
      'origin_en': originEn,
      'origin_si': originSi,
      'year': year,
      'category_en': categoryEn,
      'category_si': categorySi,
      'description_en': descriptionEn,
      'description_si': descriptionSi,
      'imageUrls': imageUrls,
      'material_en': materialEn,
      'material_si': materialSi,
      'dimensions_en': dimensionsEn,
      'dimensions_si': dimensionsSi,
      'culturalSignificance_en': culturalSignificanceEn,
      'culturalSignificance_si': culturalSignificanceSi,
      'gallery_en': galleryEn,
      'gallery_si': gallerySi,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}
