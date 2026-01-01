class Persona {
  Persona({
    required this.kingId,
    required this.kingName,
    required this.reignPeriod,
    required this.capitalCity,
    this.description,
  });

  factory Persona.fromJson(Map<String, dynamic> json) {
    return Persona(
      kingId: json['king_id'] as String,
      kingName: json['king_name'] as String,
      reignPeriod: json['reign_period'] as String,
      capitalCity: json['capital_city'] as String,
      description: json['description'] as String?,
    );
  }

  final String kingId;
  final String kingName;
  final String reignPeriod;
  final String capitalCity;
  final String? description;

  Map<String, dynamic> toJson() {
    return {
      'king_id': kingId,
      'king_name': kingName,
      'reign_period': reignPeriod,
      'capital_city': capitalCity,
      if (description != null) 'description': description,
    };
  }
}
