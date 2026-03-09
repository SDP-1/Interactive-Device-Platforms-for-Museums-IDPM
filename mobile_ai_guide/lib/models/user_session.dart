class UserSession {
  const UserSession({
    required this.sessionId,
    required this.durationHours,
    required this.startTime,
    required this.endTime,
    required this.language,
    required this.price,
    required this.isActive,
    required this.feedbacks,
    this.id,
    this.starRating,
    this.extendedTimeHours = 0,
    this.extendedUntil,
    this.createdAt,
    this.updatedAt,
  });

  final String? id;
  final String sessionId;
  final double durationHours;
  final DateTime startTime;
  final DateTime endTime;
  final String language;
  final double price;
  final bool isActive;
  final double? starRating;
  final List<String> feedbacks;
  final double extendedTimeHours;
  final DateTime? extendedUntil;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      id: json['_id'] as String?,
      sessionId: (json['session_id'] ?? '') as String,
      durationHours: (json['duration_hours'] as num?)?.toDouble() ?? 0,
      startTime:
          DateTime.tryParse((json['start_time'] ?? '').toString()) ??
          DateTime.now(),
      endTime:
          DateTime.tryParse((json['end_time'] ?? '').toString()) ??
          DateTime.now(),
      language: (json['language'] ?? 'en') as String,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      isActive: (json['is_active'] as bool?) ?? false,
      starRating: (json['star_rating'] as num?)?.toDouble(),
      feedbacks:
          (json['feedbacks'] as List<dynamic>?)
              ?.map((item) => item.toString())
              .toList() ??
          <String>[],
      extendedTimeHours: (json['extended_time_hours'] as num?)?.toDouble() ?? 0,
      extendedUntil: json['extended_until'] != null
          ? DateTime.tryParse(json['extended_until'].toString())
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) '_id': id,
      'session_id': sessionId,
      'duration_hours': durationHours,
      'start_time': startTime.toIso8601String(),
      'end_time': endTime.toIso8601String(),
      'language': language,
      'price': price,
      'is_active': isActive,
      if (starRating != null) 'star_rating': starRating,
      'feedbacks': feedbacks,
      'extended_time_hours': extendedTimeHours,
      if (extendedUntil != null)
        'extended_until': extendedUntil!.toIso8601String(),
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }
}
