class Admin {
  final String id;
  final String name;
  final String email;
  final String? passwordHash;
  final DateTime createdAt;

  Admin({
    required this.id,
    required this.name,
    required this.email,
    this.passwordHash,
    required this.createdAt,
  });

  factory Admin.fromMap(Map<String, dynamic> map) {
    return Admin(
      id: map['id'] as String,
      name: map['name'] as String,
      email: map['email'] as String,
      passwordHash: map['password_hash'] as String?,
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'email': email,
      // 'password_hash': passwordHash, // usually not updated directly here
      'created_at': createdAt.toIso8601String(),
    };
  }
}
