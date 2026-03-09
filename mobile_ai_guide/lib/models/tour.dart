class Tour {
  const Tour({
    required this.id,
    required this.name,
    required this.durationMinutes,
    required this.isActive,
    required this.points,
    this.floor,
    this.section,
    this.guidance,
  });

  final String id;
  final String name;
  final int durationMinutes;
  final String? floor;
  final String? section;
  final String? guidance;
  final bool isActive;
  final List<TourPoint> points;

  int get artifactCount => points.length;

  String get durationLabel {
    if (durationMinutes < 60) return '${durationMinutes}m';
    final hours = durationMinutes ~/ 60;
    final mins = durationMinutes % 60;
    return mins == 0 ? '${hours}h' : '${hours}h ${mins}m';
  }

  String get coverImageUrl {
    for (final point in points) {
      final image = point.artifact?.imageUrl;
      if (image != null && image.isNotEmpty) return image;
    }
    return '';
  }

  factory Tour.fromJson(Map<String, dynamic> json) {
    int readInt(List<String> keys, {int fallback = 0}) {
      for (final key in keys) {
        final value = json[key];
        if (value == null) continue;
        if (value is int) return value;
        final parsed = int.tryParse(value.toString());
        if (parsed != null) return parsed;
      }
      return fallback;
    }

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
        final str = value.toString().trim();
        if (str.isEmpty) continue;
        return str;
      }
      return null;
    }

    bool readBool(List<String> keys, {bool fallback = false}) {
      for (final key in keys) {
        final value = json[key];
        if (value == null) continue;
        if (value is bool) return value;
        if (value is num) return value != 0;
        final text = value.toString().toLowerCase();
        if (text == 'true' || text == '1') return true;
        if (text == 'false' || text == '0') return false;
      }
      return fallback;
    }

    final rawPoints = json['points'];
    final points = rawPoints is List
        ? (rawPoints
              .whereType<Map<String, dynamic>>()
              .map(TourPoint.fromJson)
              .toList()
            ..sort((a, b) => a.order.compareTo(b.order)))
        : <TourPoint>[];

    return Tour(
      id: readString(['_id', 'id']),
      name: readString(['name']),
      durationMinutes: readInt(['duration_minutes', 'durationMinutes']),
      floor: readNullableString(['floor']),
      section: readNullableString(['section']),
      guidance: readNullableString(['guidance']),
      isActive: readBool(['is_active', 'isActive'], fallback: true),
      points: points,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'duration_minutes': durationMinutes,
      'floor': floor,
      'section': section,
      'guidance': guidance,
      'is_active': isActive,
      'points': points.map((p) => p.toJson()).toList(),
    };
  }
}

class TourPoint {
  const TourPoint({
    required this.artifactId,
    required this.order,
    required this.visited,
    this.floor,
    this.section,
    this.guidance,
    this.notes,
    this.artifact,
  });

  final String artifactId;
  final int order;
  final String? floor;
  final String? section;
  final String? guidance;
  final String? notes;
  final bool visited;
  final TourArtifactPreview? artifact;

  factory TourPoint.fromJson(Map<String, dynamic> json) {
    int readInt(List<String> keys, {int fallback = 0}) {
      for (final key in keys) {
        final value = json[key];
        if (value == null) continue;
        if (value is int) return value;
        final parsed = int.tryParse(value.toString());
        if (parsed != null) return parsed;
      }
      return fallback;
    }

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
        final str = value.toString().trim();
        if (str.isEmpty) continue;
        return str;
      }
      return null;
    }

    bool readBool(List<String> keys, {bool fallback = false}) {
      for (final key in keys) {
        final value = json[key];
        if (value == null) continue;
        if (value is bool) return value;
        if (value is num) return value != 0;
        final text = value.toString().toLowerCase();
        if (text == 'true' || text == '1') return true;
        if (text == 'false' || text == '0') return false;
      }
      return fallback;
    }

    final rawArtifact = json['artifact'];

    return TourPoint(
      artifactId: readString(['artifact_id', 'artifactId']),
      order: readInt(['order'], fallback: 1),
      floor: readNullableString(['floor']),
      section: readNullableString(['section']),
      guidance: readNullableString(['guidance']),
      notes: readNullableString(['notes']),
      visited: readBool(['visited']),
      artifact: rawArtifact is Map<String, dynamic>
          ? TourArtifactPreview.fromJson(rawArtifact)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'artifact_id': artifactId,
      'order': order,
      'floor': floor,
      'section': section,
      'guidance': guidance,
      'notes': notes,
      'visited': visited,
      'artifact': artifact?.toJson(),
    };
  }
}

class TourArtifactPreview {
  const TourArtifactPreview({
    required this.artifactId,
    this.titleEn,
    this.titleSi,
    this.descriptionEn,
    this.descriptionSi,
    this.imageUrl,
  });

  final String artifactId;
  final String? titleEn;
  final String? titleSi;
  final String? descriptionEn;
  final String? descriptionSi;
  final String? imageUrl;

  String get displayTitle {
    final en = titleEn?.trim();
    if (en != null && en.isNotEmpty) return en;
    final si = titleSi?.trim();
    if (si != null && si.isNotEmpty) return si;
    return artifactId;
  }

  factory TourArtifactPreview.fromJson(Map<String, dynamic> json) {
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
        final str = value.toString().trim();
        if (str.isEmpty) continue;
        return str;
      }
      return null;
    }

    return TourArtifactPreview(
      artifactId: readString(['artifact_id', 'artifactId']),
      titleEn: readNullableString(['title_en', 'titleEn']),
      titleSi: readNullableString(['title_si', 'titleSi']),
      descriptionEn: readNullableString(['description_en', 'descriptionEn']),
      descriptionSi: readNullableString(['description_si', 'descriptionSi']),
      imageUrl: readNullableString(['imageUrl']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'artifact_id': artifactId,
      'title_en': titleEn,
      'title_si': titleSi,
      'description_en': descriptionEn,
      'description_si': descriptionSi,
      'imageUrl': imageUrl,
    };
  }
}
