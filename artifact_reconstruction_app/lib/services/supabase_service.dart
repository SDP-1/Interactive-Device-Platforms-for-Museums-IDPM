import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/admin_model.dart';
import '../models/artifact_model.dart';

class SupabaseService {
  final SupabaseClient _client = Supabase.instance.client;

  // --- Auth --- //
  
  Future<AuthResponse> signUpAdmin({
    required String email, 
    required String password,
    required String name,
  }) async {
    final response = await _client.auth.signUp(
      email: email, 
      password: password,
      data: {'name': name},
    );
    return response;
  }

  Future<AuthResponse> signInAdmin({
    required String email, 
    required String password,
  }) async {
    return await _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  User? get currentUser => _client.auth.currentUser;

  // --- Artifacts --- //

  Future<List<Artifact>> getArtifacts() async {
    final List<dynamic> data = await _client
        .from('3D_Artifact_Table')
        .select()
        .order('created_at', ascending: false);
    
    return data.map((json) => Artifact.fromMap(json)).toList();
  }

  Future<Artifact> getArtifactById(String id) async {
    final data = await _client
        .from('3D_Artifact_Table')
        .select()
        .eq('id', id)
        .single();
    return Artifact.fromMap(data);
  }

  Future<Artifact> createArtifact(Artifact artifact) async {
    final data = await _client
        .from('3D_Artifact_Table')
        .insert(artifact.toMap())
        .select()
        .single();
    return Artifact.fromMap(data);
  }

  Future<void> updateArtifactStatus({
    required String id, 
    required String status,
    String? adminId,
  }) async {
    final updates = {
      if (status == 'approved') 'approved_at': DateTime.now().toIso8601String(),
      if (status == 'approved' && adminId != null) 'approved_by': adminId,
    };
    
    // If no real DB updates are needed (e.g., just simulated 'reconstructed'), skip the DB call
    if (updates.isEmpty) return;
    
    await _client.from('3D_Artifact_Table').update(updates).eq('id', id);
  }

  // --- Storage --- //

  Future<String> uploadImage(String artifactId, File imageFile) async {
    final fileExt = imageFile.path.split('.').last;
    final fileName = '${DateTime.now().millisecondsSinceEpoch}.$fileExt';
    final filePath = '$artifactId/images/$fileName';
    
    await _client.storage.from('3d reconstruct').upload(filePath, imageFile);
    return _client.storage.from('3d reconstruct').getPublicUrl(filePath);
  }

  Future<String> uploadModel(String artifactId, File modelFile) async {
    final fileExt = modelFile.path.split('.').last;
    final fileName = '${DateTime.now().millisecondsSinceEpoch}.$fileExt';
    final filePath = '$artifactId/models/$fileName';
    
    await _client.storage.from('3d reconstruct').upload(filePath, modelFile);
    return _client.storage.from('3d reconstruct').getPublicUrl(filePath);
  }
}
