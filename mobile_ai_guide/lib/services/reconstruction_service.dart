import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile_ai_guide/models/reconstruction_artifact.dart';

/// Fetches artifact data from the Artifact Reconstruction Supabase project
/// (3D_Artifact_Table) so the mobile guide can show visitor 3D display when
/// user scans a reconstruction QR. Uses Supabase REST API; no Supabase SDK init.
class ReconstructionService {
  ReconstructionService._();
  static final ReconstructionService instance = ReconstructionService._();

  static const String _baseUrl =
      'https://jxwsajoubxetenzzosgc.supabase.co/rest/v1';
  static const String _anonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4d3Nham91YnhldGVuenpvc2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MDc4NTUsImV4cCI6MjA4ODE4Mzg1NX0.pGG0xwiXQxJEqvh3mn4HIu-e9c5gyZc4casNw87uaGE';

  static const String _table = '3D_Artifact_Table';

  /// Fetches a single artifact by id (UUID). Throws if not found or on error.
  Future<ReconstructionArtifact> getArtifactById(String id) async {
    final uri = Uri.parse('$_baseUrl/$_table')
        .replace(queryParameters: {'id': 'eq.$id', 'select': '*'});
    final response = await http.get(
      uri,
      headers: {
        'apikey': _anonKey,
        'Authorization': 'Bearer $_anonKey',
        'Accept': 'application/json',
      },
    );

    if (response.statusCode != 200) {
      throw Exception(
        'Reconstruction artifact fetch failed: ${response.statusCode}',
      );
    }

    final list = json.decode(response.body) as List<dynamic>;
    if (list.isEmpty) {
      throw Exception('Reconstruction artifact not found');
    }
    return ReconstructionArtifact.fromMap(
      list.first as Map<String, dynamic>,
    );
  }
}
