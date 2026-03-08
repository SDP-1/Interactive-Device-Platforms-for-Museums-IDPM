class Persona {
  Persona({
    required this.kingId,
    required this.nameEn,
    required this.nameSi,
    this.capitalEn,
    this.capitalSi,
    this.biographyEn,
    this.biographySi,
    this.aiKnowlageBaseEn,
    this.aiKnowlageBaseSi,
    this.imageUrls,
    this.createdAt,
    this.updatedAt,
  });

  factory Persona.fromJson(Map<String, dynamic> json) {
    return Persona(
      kingId: json['king_id'] as String,
      nameEn: json['name_en'] as String? ?? '',
      nameSi: json['name_si'] as String? ?? '',
      capitalEn: json['capital_en'] as String?,
      capitalSi: json['capital_si'] as String?,
      biographyEn: json['biography_en'] as String?,
      biographySi: json['biography_si'] as String?,
      aiKnowlageBaseEn: json['aiKnowlageBase_en'] as String?,
      aiKnowlageBaseSi: json['aiKnowlageBase_si'] as String?,
      imageUrls:
          (json['imageUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          <String>[],
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'].toString())
          : null,
    );
  }

  final String kingId;
  final String nameEn;
  final String nameSi;
  final String? capitalEn;
  final String? capitalSi;
  final String? biographyEn;
  final String? biographySi;
  final String? aiKnowlageBaseEn;
  final String? aiKnowlageBaseSi;
  final List<String>? imageUrls;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  // Convenience getters for existing UI usage
  String get kingName => nameEn.isNotEmpty ? nameEn : nameSi;
  String get reignPeriod => '';
  String get capitalCity => capitalEn ?? capitalSi ?? '';
  String? get description =>
      aiKnowlageBaseEn ?? aiKnowlageBaseSi ?? biographyEn ?? biographySi;

  Map<String, dynamic> toJson() {
    return {
      'king_id': kingId,
      'name_en': nameEn,
      'name_si': nameSi,
      if (capitalEn != null) 'capital_en': capitalEn,
      if (capitalSi != null) 'capital_si': capitalSi,
      if (biographyEn != null) 'biography_en': biographyEn,
      if (biographySi != null) 'biography_si': biographySi,
      if (aiKnowlageBaseEn != null) 'aiKnowlageBase_en': aiKnowlageBaseEn,
      if (aiKnowlageBaseSi != null) 'aiKnowlageBase_si': aiKnowlageBaseSi,
      if (imageUrls != null) 'imageUrls': imageUrls,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt!.toIso8601String(),
    };
  }
}
