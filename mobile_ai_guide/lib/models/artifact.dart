class Artifact {
  const Artifact({
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
    String readString(List<String> keys, {String fallback = ''}) {
      for (final key in keys) {
        final value = json[key];
        if (value == null) continue;
        return value.toString();
      }
      return fallback;
    }

    String? readNullableString(List<String> keys) {
      for (final key in keys) {
        final value = json[key];
        if (value == null) continue;
        return value.toString();
      }
      return null;
    }

    DateTime? readDate(String key) {
      final value = json[key];
      if (value == null) return null;
      return DateTime.tryParse(value.toString());
    }

    List<String> readImageUrls() {
      final value = json['imageUrls'] ?? json['image_urls'] ?? json['images'];
      if (value is List) {
        return value.where((item) => item != null).map((item) => item.toString()).toList();
      }
      return <String>[];
    }

    return Artifact(
      artifactId: readString(['artifact_id', 'artifactId', '_id']),
      titleEn: readString(['title_en', 'titleEn', 'title']),
      titleSi: readString(['title_si', 'titleSi', 'title']),
      originEn: readString(['origin_en', 'originEn', 'origin']),
      originSi: readString(['origin_si', 'originSi', 'origin']),
      year: readString(['year']),
      categoryEn: readString(['category_en', 'categoryEn', 'category']),
      categorySi: readString(['category_si', 'categorySi', 'category']),
      descriptionEn: readString(['description_en', 'descriptionEn', 'description']),
      descriptionSi: readString(['description_si', 'descriptionSi', 'description']),
      imageUrls: readImageUrls(),
      materialEn: readNullableString(['material_en', 'materialEn', 'material']),
      materialSi: readNullableString(['material_si', 'materialSi', 'material']),
      dimensionsEn: readNullableString(['dimensions_en', 'dimensionsEn', 'dimensions']),
      dimensionsSi: readNullableString(['dimensions_si', 'dimensionsSi', 'dimensions']),
      culturalSignificanceEn: readNullableString([
        'culturalSignificance_en',
        'culturalSignificanceEn',
        'culturalSignificance',
      ]),
      culturalSignificanceSi: readNullableString([
        'culturalSignificance_si',
        'culturalSignificanceSi',
        'culturalSignificance',
      ]),
      galleryEn: readNullableString(['gallery_en', 'galleryEn', 'gallery']),
      gallerySi: readNullableString(['gallery_si', 'gallerySi', 'gallery']),
      createdAt: readDate('created_at'),
      updatedAt: readDate('updated_at'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
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
