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
    String? imageUrl,
  }) async {
    final updates = <String, dynamic>{
      if (status == 'approved') 'approved_at': DateTime.now().toIso8601String(),
      if (status == 'approved' && adminId != null) 'approved_by': adminId,
      if (imageUrl != null) 'image_url': imageUrl,
    };

    if (updates.isEmpty) return;

    await _client.from('3D_Artifact_Table').update(updates).eq('id', id);
  }

  Future<void> updateArtifactImageUrl(String id, String imageUrl) async {
    await _client
        .from('3D_Artifact_Table')
        .update({'image_url': imageUrl})
        .eq('id', id);
  }

  Future<void> updateArtifactModelUrl(String id, String modelUrl) async {
    await _client
        .from('3D_Artifact_Table')
        .update({'model_url': modelUrl})
        .eq('id', id);
  }

  /// Updates artifact metadata (name, category, era, origin, description).
  /// Only non-null fields are updated.
  Future<void> updateArtifactMetadata({
    required String id,
    String? name,
    String? category,
    String? era,
    String? origin,
    String? description,
  }) async {
    final updates = <String, dynamic>{
      if (name != null) 'name': name,
      if (category != null) 'category': category,
      if (era != null) 'era': era,
      if (origin != null) 'origin': origin,
      if (description != null) 'description': description,
    };
    if (updates.isEmpty) return;
    await _client.from('3D_Artifact_Table').update(updates).eq('id', id);
  }

  Future<void> deleteArtifact(String id) async {
    await _client.from('3D_Artifact_Table').delete().eq('id', id);
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
