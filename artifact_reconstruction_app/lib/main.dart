import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:gal/gal.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:model_viewer_plus/model_viewer_plus.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:image_cropper/image_cropper.dart';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'theme/app_theme.dart';
import 'screens/auth/admin_login_screen.dart';
import 'services/supabase_service.dart';
import 'services/huggingface_reconstruction_service.dart';
import 'services/gemini_reconstruction_service.dart';
import 'models/artifact_model.dart';
import 'config/reconstruction_config.dart';
import 'config/meshy_config.dart';
import 'services/meshy_image_to_3d_service.dart';
import 'utils/mask_utils.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load(fileName: 'assets/.env.example');
  } catch (_) {}

  await Supabase.initialize(
    url: 'https://jxwsajoubxetenzzosgc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4d3Nham91YnhldGVuenpvc2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MDc4NTUsImV4cCI6MjA4ODE4Mzg1NX0.pGG0xwiXQxJEqvh3mn4HIu-e9c5gyZc4casNw87uaGE',
  );

  runApp(const ArtifactReconstructionApp());
}

class ArtifactReconstructionApp extends StatelessWidget {
  const ArtifactReconstructionApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Artifact Reconstruction',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const RoleSelectionScreen(),
    );
  }
}

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppTheme.surfaceDark,
              AppTheme.surfaceDarkMid,
              AppTheme.surfaceDark,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header – Sound Narration style
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
                child: Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [AppTheme.primary, AppTheme.primaryDark],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primary.withValues(alpha: 0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.architecture_outlined,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Artifact Reconstruction',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Interactive Museum Experience',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppTheme.primary.withValues(alpha: 0.7),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // Hero section
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [
                        AppTheme.primaryDark.withValues(alpha: 0.25),
                        AppTheme.surfaceDarkMid,
                      ],
                    ),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: AppTheme.primary.withValues(alpha: 0.2),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Discover 3D',
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [
                            Color(0xFFFBBF24),
                            Color(0xFFF97316),
                          ],
                        ).createShader(bounds),
                        child: Text(
                          'Reconstructed Artifacts',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Capture broken artifacts, restore them with AI, and share 3D models with visitors via QR codes.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.8),
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 28),
              // Role cards grid – gradient cards like Sound Narration dashboard
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _RoleCard(
                        title: 'Admin',
                        subtitle: 'Capture, reconstruct, approve & generate QR',
                        icon: Icons.admin_panel_settings_outlined,
                        gradientColors: const [
                          AppTheme.primary,
                          AppTheme.primaryDark,
                        ],
                        onTap: () {
                          final supabaseAuth = SupabaseService().currentUser;
                          if (supabaseAuth != null) {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => const AdminHomeScreen(),
                              ),
                            );
                          } else {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => const AdminLoginScreen(),
                              ),
                            );
                          }
                        },
                      ),
                      const SizedBox(height: 16),
                      _RoleCard(
                        title: 'Visitor',
                        subtitle: 'Scan QR codes and view 3D models',
                        icon: Icons.qr_code_scanner_outlined,
                        gradientColors: const [
                          Color(0xFF6366F1),
                          Color(0xFF4F46E5),
                        ],
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => const VisitorHomeScreen(),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
              // Footer – Sound Narration style
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 20),
                child: Container(
                  padding: const EdgeInsets.only(top: 20),
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(
                        color: AppTheme.primary.withValues(alpha: 0.15),
                      ),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [AppTheme.primary, AppTheme.primaryDark],
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.architecture_outlined,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Museum 1.0',
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        'Preserving heritage through technology',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.5),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.gradientColors,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final List<Color> gradientColors;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: gradientColors,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: gradientColors.first.withValues(alpha: 0.35),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, size: 28, color: Colors.white),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.85),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          'Explore',
                          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.9),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.chevron_right,
                          color: Colors.white,
                          size: 20,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class AdminHomeScreen extends StatelessWidget {
  const AdminHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceWarm,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.admin_panel_settings_outlined, color: Colors.white, size: 22),
            ),
            const SizedBox(width: 12),
            const Text('Admin'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const UserProfileScreen(),
                ),
              );
            },
            tooltip: 'Profile',
          ),
          IconButton(
            icon: const Icon(Icons.list_alt),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const ArtifactListScreen(),
                ),
              );
            },
            tooltip: 'List of artifacts',
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: const Icon(Icons.camera_alt_outlined, color: Colors.white, size: 40),
              ),
              const SizedBox(height: 24),
              Text(
                'Capture or upload artifact',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: AppTheme.stone800,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Start by capturing or uploading an image of the broken artifact.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppTheme.stone600,
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const AdminCaptureUploadScreen(),
                      ),
                    );
                  },
                  icon: const Icon(Icons.camera_alt_outlined),
                  label: const Text('Capture or upload image'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class UserProfileScreen extends StatelessWidget {
  const UserProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = SupabaseService().currentUser;
    final email = user?.email ?? '—';
    final name = (user?.userMetadata?['name'] as String?) ?? (user?.email ?? 'User');

    return Scaffold(
      backgroundColor: AppTheme.surfaceWarm,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceWarm,
        foregroundColor: AppTheme.stone800,
        title: const Text('Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 24),
            CircleAvatar(
              radius: 48,
              backgroundColor: AppTheme.primary.withValues(alpha: 0.2),
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              name,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppTheme.stone800,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              email,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppTheme.stone600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ListTile(
              leading: const Icon(Icons.email_outlined),
              title: const Text('Email'),
              subtitle: Text(email),
              tileColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: const Icon(Icons.badge_outlined),
              title: const Text('Name'),
              subtitle: Text(name),
              tileColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () async {
                  await SupabaseService().signOut();
                  if (!context.mounted) return;
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute<void>(builder: (_) => const RoleSelectionScreen()),
                    (route) => false,
                  );
                },
                icon: const Icon(Icons.logout),
                label: const Text('Sign out'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.stone800,
                  side: const BorderSide(color: AppTheme.stone200),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class VisitorHomeScreen extends StatelessWidget {
  const VisitorHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceWarm,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.qr_code_scanner_outlined, color: Colors.white, size: 22),
            ),
            const SizedBox(width: 12),
            const Text('Visitor'),
          ],
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: const Icon(Icons.qr_code_scanner_outlined, color: Colors.white, size: 40),
              ),
              const SizedBox(height: 24),
              Text(
                'Scan QR to view 3D model',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: AppTheme.stone800,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Point your camera at an artifact QR code to open the 3D model.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppTheme.stone600,
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const VisitorQrScannerScreen(),
                      ),
                    );
                  },
                  icon: const Icon(Icons.qr_code_scanner_outlined),
                  label: const Text('Scan QR code'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class AdminCaptureUploadScreen extends StatefulWidget {
  const AdminCaptureUploadScreen({super.key});

  @override
  State<AdminCaptureUploadScreen> createState() =>
      _AdminCaptureUploadScreenState();
}

class _AdminCaptureUploadScreenState extends State<AdminCaptureUploadScreen> {
  final ImagePicker _picker = ImagePicker();
  XFile? _selectedImage;

  Future<void> _pickFromCamera() async {
    final image = await _picker.pickImage(source: ImageSource.camera);
    if (image != null) {
      await _cropImage(image.path);
    }
  }

  Future<void> _pickFromGallery() async {
    final image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      await _cropImage(image.path);
    }
  }

  Future<void> _cropImage(String path) async {
    final croppedFile = await ImageCropper().cropImage(
      sourcePath: path,
      uiSettings: [
        AndroidUiSettings(
          toolbarTitle: 'Crop Artifact',
          toolbarColor: Theme.of(context).colorScheme.primary,
          toolbarWidgetColor: Theme.of(context).colorScheme.onPrimary,
          initAspectRatio: CropAspectRatioPreset.original,
          lockAspectRatio: false,
        ),
        IOSUiSettings(
          title: 'Crop Artifact',
        ),
      ],
    );

    if (croppedFile != null) {
      setState(() {
        _selectedImage = XFile(croppedFile.path);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceWarm,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('Capture or upload artifact'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _pickFromCamera,
                      icon: const Icon(Icons.camera_alt_outlined),
                      label: const Text('Camera'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: const BorderSide(color: AppTheme.stone200),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _pickFromGallery,
                      icon: const Icon(Icons.photo_library_outlined),
                      label: const Text('Gallery'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: const BorderSide(color: AppTheme.stone200),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.06),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: _selectedImage == null
                        ? Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.image_outlined,
                                size: 64,
                                color: AppTheme.stone400,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'No image selected.\nUse Camera or Gallery above.',
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppTheme.stone600,
                                ),
                              ),
                            ],
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Expanded(
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(20),
                                  child: Image.file(
                                    // ignore: deprecated_member_use
                                    File(_selectedImage!.path),
                                    fit: BoxFit.contain,
                                  ),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(16),
                                child: Text(
                                  _selectedImage!.name,
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppTheme.stone600,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _selectedImage == null
                      ? null
                      : () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => ReconstructionStatusScreen(
                                imagePath: _selectedImage!.path,
                              ),
                            ),
                          );
                        },
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: AppTheme.stone200,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text('Next: send for reconstruction'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ReconstructionStatusScreen extends StatefulWidget {
  const ReconstructionStatusScreen({super.key, required this.imagePath});

  final String imagePath;

  @override
  State<ReconstructionStatusScreen> createState() =>
      _ReconstructionStatusScreenState();
}

class _ReconstructionStatusScreenState
    extends State<ReconstructionStatusScreen> {
  String _status = 'Uploading image...';
  bool _completed = false;
  Artifact? _artifact;
  int? _seed;

  String? _reconstructedImageUrl;

  @override
  void initState() {
    super.initState();
    _uploadAndReconstruct();
  }

  Future<void> _uploadAndReconstruct({bool newSeed = false}) async {
    if (newSeed) {
      setState(() {
        _completed = false;
        _reconstructedImageUrl = null;
        _status = 'Regenerating with different seed...';
      });
      _seed = DateTime.now().millisecondsSinceEpoch % 1000000;
    }

    final service = SupabaseService();
    final hfService = HuggingFaceReconstructionService(apiKey: hfApiKey);

    try {
      if (_artifact == null) {
        final newArtifact = Artifact(
          id: '',
          name: 'New Artifact ${DateTime.now().millisecondsSinceEpoch}',
          createdAt: DateTime.now(),
          approvedBy: service.currentUser?.id,
        );

        _artifact = await service.createArtifact(newArtifact);
      }

      if (!mounted) return;
      if (!newSeed) setState(() => _status = 'Uploading image...');

      await service.uploadImage(_artifact!.id, File(widget.imagePath));

      final imageBytes = await File(widget.imagePath).readAsBytes();
      final List<int> resultBytes;

      if (geminiApiKey.isNotEmpty) {
        if (!mounted) return;
        setState(() => _status = 'Running 2D reconstruction (Gemini)...');

        final geminiService = GeminiReconstructionService(apiKey: geminiApiKey);
        final mimeType = widget.imagePath.toLowerCase().endsWith('.jpg') ||
                widget.imagePath.toLowerCase().endsWith('.jpeg')
            ? 'image/jpeg'
            : 'image/png';
        resultBytes = await geminiService.reconstructImage(
          imageBytes: imageBytes,
          mimeType: mimeType,
          prompt:
              'Output one image of the COMPLETE, WHOLE object with no missing pieces. Restore ALL missing or broken parts of this ceramic cup or artifact so it looks fully intact. Keep the exact same shape, handle, design, material, color, and lighting. Do NOT leave broken edges, gaps, or empty areas. Do NOT add new objects. Photorealistic, full restoration of the entire object.',
        );
      } else {
        if (!mounted) return;
        setState(() => _status = 'Generating mask...');

        final maskFile = await generateBottomMask(File(widget.imagePath));

        if (!mounted) return;
        setState(() => _status = 'Running 2D reconstruction...');

        final maskBytes = await maskFile.readAsBytes();
        resultBytes = await hfService.reconstructImage(
          imageBytes: imageBytes,
          maskBytes: maskBytes,
          prompt:
            'Restore ONLY the missing parts of the EXACT ceramic cup shown. Do NOT change the cup’s shape, handle, or design. Keep the original material, color, and lighting. Do NOT generate new objects or artistic forms. Photorealistic, realistic restoration.',
          seed: _seed,
        );
      }

      if (!mounted) return;
      setState(() => _status = 'Saving reconstructed image...');

      final tempDir = await Directory.systemTemp.createTemp('reconstructed');
      final reconstructedFile = File('${tempDir.path}/reconstructed.png');
      await reconstructedFile.writeAsBytes(resultBytes);

      final reconstructedUrl =
          await service.uploadImage(_artifact!.id, reconstructedFile);
      await service.updateArtifactImageUrl(_artifact!.id, reconstructedUrl);

      if (!mounted) return;
      setState(() {
        _reconstructedImageUrl = reconstructedUrl;
        _status = '2D reconstruction complete. Review and approve to continue.';
        _completed = true;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _status = 'Error: ${e.toString()}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceWarm,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('Reconstruction status'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Status',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppTheme.stone800,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (!_completed) ...[
                          const SizedBox(width: 12),
                          SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppTheme.primary,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _status,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: _status.startsWith('Error') ? AppTheme.error : AppTheme.stone600,
                        height: 1.3,
                      ),
                    ),
                    if (!_completed) ...[
                      const SizedBox(height: 16),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          backgroundColor: AppTheme.stone200,
                          valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                          minHeight: 4,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.06),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: _reconstructedImageUrl != null
                        ? Image.network(
                            _reconstructedImageUrl!,
                            fit: BoxFit.contain,
                          )
                        : Image.file(
                            File(widget.imagePath),
                            fit: BoxFit.contain,
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: !_completed ? null : () => _uploadAndReconstruct(newSeed: true),
                      icon: const Icon(Icons.refresh),
                      label: const Text('Try Again'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: const BorderSide(color: AppTheme.stone200),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: !_completed || _artifact == null
                          ? null
                          : () async {
                              setState(() => _status = 'Approving...');
                              try {
                                await SupabaseService().updateArtifactStatus(
                                  id: _artifact!.id,
                                  status: 'approved',
                                  adminId: SupabaseService().currentUser?.id,
                                );
                                if (!context.mounted) return;
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder: (_) => ArtifactDetailsScreen(artifact: _artifact!),
                                  ),
                                );
                              } catch (e) {
                                if (!context.mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Error: $e')),
                                );
                                setState(() => _status = 'Failed to approve. Try again.');
                              }
                            },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: AppTheme.stone200,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Approve & 3D'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ArtifactDetailsScreen extends StatefulWidget {
  const ArtifactDetailsScreen({super.key, required this.artifact, this.isEditMode = false});

  final Artifact artifact;
  final bool isEditMode;

  @override
  State<ArtifactDetailsScreen> createState() => _ArtifactDetailsScreenState();
}

class _ArtifactDetailsScreenState extends State<ArtifactDetailsScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _categoryController;
  late final TextEditingController _eraController;
  late final TextEditingController _originController;
  late final TextEditingController _descriptionController;
  bool _saved = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.artifact.name);
    _categoryController = TextEditingController(text: widget.artifact.category ?? '');
    _eraController = TextEditingController(text: widget.artifact.era ?? '');
    _originController = TextEditingController(text: widget.artifact.origin ?? '');
    _descriptionController = TextEditingController(text: widget.artifact.description ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _categoryController.dispose();
    _eraController.dispose();
    _originController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  bool get _hasEnteredData {
    final name = _nameController.text.trim();
    final category = _categoryController.text.trim();
    final era = _eraController.text.trim();
    final origin = _originController.text.trim();
    final description = _descriptionController.text.trim();
    if (widget.isEditMode) return name.isNotEmpty;
    return name.isNotEmpty &&
        (category.isNotEmpty ||
            era.isNotEmpty ||
            origin.isNotEmpty ||
            description.isNotEmpty ||
            name != (widget.artifact.name));
  }

  Future<void> _save() async {
    if (!_hasEnteredData && !widget.isEditMode) return;
    final name = _nameController.text.trim();
    if (name.isEmpty) return;
    setState(() => _saving = true);
    try {
      await SupabaseService().updateArtifactMetadata(
        id: widget.artifact.id,
        name: name,
        category: _categoryController.text.trim().isEmpty ? null : _categoryController.text.trim(),
        era: _eraController.text.trim().isEmpty ? null : _eraController.text.trim(),
        origin: _originController.text.trim().isEmpty ? null : _originController.text.trim(),
        description: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
      );
      if (!mounted) return;
      setState(() {
        _saved = true;
        _saving = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Artifact details saved.')));
      if (widget.isEditMode) {
        Navigator.of(context).pop(true);
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute<void>(builder: (_) => const ArtifactListScreen()),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Save failed: $e')));
    }
  }

  bool _convertingTo3D = false;

  Future<void> _convertTo3D() async {
    final artifact = widget.artifact;
    if (artifact.modelUrl != null && artifact.modelUrl!.isNotEmpty) {
      if (!context.mounted) return;
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => Model3DViewerScreen(
            modelUrl: artifact.modelUrl!,
            artifactName: artifact.name,
            artifactId: artifact.id,
          ),
        ),
      );
      return;
    }
    if (artifact.imageUrl == null || artifact.imageUrl!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reconstructed image is required. Approve the reconstruction first.')),
      );
      return;
    }
    if (meshyApiKey.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Set MESHY_API_KEY in assets/.env.example or use --dart-define=MESHY_API_KEY=your_key')),
      );
      return;
    }
    setState(() => _convertingTo3D = true);
    String? modelUrl;
    try {
      final bytes = await MeshyImageTo3DService().convertImageToGlb(artifact.imageUrl!);
      if (bytes == null || bytes.isEmpty) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('3D conversion failed.')));
        return;
      }
      final dir = await Directory.systemTemp.createTemp('meshy_glb');
      final file = File('${dir.path}/model.glb');
      await file.writeAsBytes(bytes);
      modelUrl = await SupabaseService().uploadModel(artifact.id, file);
      await SupabaseService().updateArtifactModelUrl(artifact.id, modelUrl);
    } on MeshyException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('3D conversion error: ${e.message}')));
      return;
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      return;
    } finally {
      if (mounted) setState(() => _convertingTo3D = false);
    }
    if (!context.mounted) return;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => Model3DViewerScreen(
          modelUrl: modelUrl!,
          artifactName: artifact.name,
          artifactId: artifact.id,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceWarm,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceWarm,
        foregroundColor: AppTheme.stone800,
        title: Text(widget.isEditMode ? 'Edit artifact' : 'Artifact details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (!widget.isEditMode) ...[
              Text(
                'Add a name and any details you know. You can skip optional fields and add them later.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppTheme.stone600,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),
            ],
            if (widget.isEditMode) const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Basic info',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppTheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _nameController,
                    textCapitalization: TextCapitalization.words,
                    decoration: InputDecoration(
                      labelText: 'Name *',
                      hintText: 'e.g. Roman ceramic cup',
                      filled: true,
                      fillColor: AppTheme.surfaceWarm,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      prefixIcon: const Icon(Icons.label_outline, size: 22),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Optional details',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppTheme.stone600,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Era, origin and description help visitors learn more.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.stone500),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _categoryController,
                    textCapitalization: TextCapitalization.words,
                    decoration: InputDecoration(
                      labelText: 'Category',
                      hintText: 'e.g. Ceramic, Pottery, Sculpture',
                      filled: true,
                      fillColor: AppTheme.surfaceWarm,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      prefixIcon: const Icon(Icons.category_outlined, size: 22),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _eraController,
                    textCapitalization: TextCapitalization.words,
                    decoration: InputDecoration(
                      labelText: 'Era or period',
                      hintText: 'e.g. Roman, 1st century AD',
                      filled: true,
                      fillColor: AppTheme.surfaceWarm,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      prefixIcon: const Icon(Icons.schedule_outlined, size: 22),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _originController,
                    textCapitalization: TextCapitalization.words,
                    decoration: InputDecoration(
                      labelText: 'Origin or place',
                      hintText: 'e.g. Italy, Greece, Egypt',
                      filled: true,
                      fillColor: AppTheme.surfaceWarm,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      prefixIcon: const Icon(Icons.place_outlined, size: 22),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _descriptionController,
                    maxLines: 4,
                    minLines: 2,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: InputDecoration(
                      labelText: 'Description',
                      hintText: 'A short description for visitors...',
                      filled: true,
                      fillColor: AppTheme.surfaceWarm,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      alignLabelWithHint: true,
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            if (_saved && widget.isEditMode)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                decoration: BoxDecoration(
                  color: AppTheme.success.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.check_circle_outline, color: AppTheme.success, size: 22),
                    const SizedBox(width: 10),
                    Text('Changes saved', style: TextStyle(color: AppTheme.success, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            if (_saved && widget.isEditMode) const SizedBox(height: 16),
            if (_convertingTo3D)
              Container(
                padding: const EdgeInsets.all(20),
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Status',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppTheme.stone800,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 12),
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Converting to 3D…',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.stone600,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        backgroundColor: AppTheme.stone200,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                        minHeight: 4,
                      ),
                    ),
                  ],
                ),
              ),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: (_hasEnteredData && !_saved && !_saving) ? _save : null,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primary,
                      side: const BorderSide(color: AppTheme.primary),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _saving
                        ? SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary),
                          )
                        : const Text('Save details'),
                  ),
                ),
                if (!widget.isEditMode) ...[
                  const SizedBox(width: 14),
                  Expanded(
                    flex: 2,
                    child: FilledButton.icon(
                      onPressed: _convertingTo3D ? null : _convertTo3D,
                      icon: _convertingTo3D
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Icon(Icons.view_in_ar, size: 20),
                      label: Text(_convertingTo3D ? 'Converting…' : (widget.artifact.modelUrl != null && widget.artifact.modelUrl!.isNotEmpty ? 'View 3D' : 'Convert to 3D')),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class ArtifactListScreen extends StatefulWidget {
  const ArtifactListScreen({super.key});

  @override
  State<ArtifactListScreen> createState() => _ArtifactListScreenState();
}

class _ArtifactListScreenState extends State<ArtifactListScreen> {
  List<Artifact> _artifacts = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadArtifacts();
  }

  Future<void> _loadArtifacts() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await SupabaseService().getArtifacts();
      if (!mounted) return;
      setState(() {
        _artifacts = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceWarm,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceWarm,
        foregroundColor: AppTheme.stone800,
        elevation: 0,
        title: const Text(
          'Artifacts',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            letterSpacing: -0.3,
          ),
        ),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            )
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.error_outline_rounded, size: 48, color: AppTheme.stone500),
                        const SizedBox(height: 16),
                        Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.stone600),
                        ),
                        const SizedBox(height: 20),
                        FilledButton.icon(
                          onPressed: _loadArtifacts,
                          icon: const Icon(Icons.refresh, size: 20),
                          label: const Text('Retry'),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : _artifacts.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.collections_outlined, size: 56, color: AppTheme.stone400),
                            const SizedBox(height: 16),
                            Text(
                              'No artifacts yet',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: AppTheme.stone600,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Capture and reconstruct artifacts to see them here.',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.stone500),
                            ),
                          ],
                        ),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadArtifacts,
                      color: AppTheme.primary,
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                        itemCount: _artifacts.length,
                        itemBuilder: (context, index) {
                          final artifact = _artifacts[index];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppTheme.stone200),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.04),
                                  blurRadius: 12,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () async {
                                  await Navigator.of(context).push(
                                    MaterialPageRoute<void>(
                                      builder: (_) => ArtifactDetailViewScreen(artifact: artifact),
                                    ),
                                  );
                                  if (!mounted) return;
                                  _loadArtifacts();
                                },
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                      if (artifact.imageUrl != null && artifact.imageUrl!.isNotEmpty)
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(14),
                                          child: Container(
                                            width: 72,
                                            height: 72,
                                            color: AppTheme.stone200,
                                            child: Image.network(
                                              artifact.imageUrl!,
                                              width: 72,
                                              height: 72,
                                              fit: BoxFit.contain,
                                              errorBuilder: (_, __, ___) => Icon(
                                                Icons.broken_image_outlined,
                                                size: 28,
                                                color: AppTheme.stone500,
                                              ),
                                            ),
                                          ),
                                        )
                                      else
                                        Container(
                                          width: 72,
                                          height: 72,
                                          decoration: BoxDecoration(
                                            color: AppTheme.stone200,
                                            borderRadius: BorderRadius.circular(14),
                                          ),
                                          child: Icon(Icons.image_outlined, color: AppTheme.stone500),
                                        ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              artifact.name,
                                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                                fontWeight: FontWeight.w600,
                                                color: AppTheme.stone800,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            if (artifact.era != null && artifact.era!.isNotEmpty) ...[
                                              const SizedBox(height: 4),
                                              Text(
                                                artifact.era!,
                                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                                  color: AppTheme.stone500,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                            if (artifact.category != null && artifact.category!.isNotEmpty) ...[
                                              const SizedBox(height: 2),
                                              Text(
                                                artifact.category!,
                                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                                  color: AppTheme.stone400,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                      Icon(Icons.chevron_right_rounded, color: AppTheme.stone400),
                                      PopupMenuButton<String>(
                                        icon: Icon(Icons.more_vert_rounded, color: AppTheme.stone600),
                                        padding: EdgeInsets.zero,
                                        onSelected: (value) async {
                                          if (value == 'edit') {
                                            await Navigator.of(context).push<bool>(
                                              MaterialPageRoute<bool>(
                                                builder: (_) => ArtifactDetailsScreen(artifact: artifact, isEditMode: true),
                                              ),
                                            );
                                            if (!mounted) return;
                                            _loadArtifacts();
                                          } else if (value == 'delete') {
                                            final confirm = await showDialog<bool>(
                                              context: context,
                                              builder: (ctx) => AlertDialog(
                                                title: const Text('Delete artifact?'),
                                                content: const Text('This cannot be undone.'),
                                                actions: [
                                                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                                                  FilledButton(
                                                    style: FilledButton.styleFrom(backgroundColor: Colors.red),
                                                    onPressed: () => Navigator.pop(ctx, true),
                                                    child: const Text('Delete'),
                                                  ),
                                                ],
                                              ),
                                            );
                                            if (confirm != true || !mounted) return;
                                            try {
                                              await SupabaseService().deleteArtifact(artifact.id);
                                              if (!mounted) return;
                                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Artifact deleted.')));
                                              _loadArtifacts();
                                            } catch (e) {
                                              if (!mounted) return;
                                              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $e')));
                                            }
                                          }
                                        },
                                        itemBuilder: (context) => [
                                          const PopupMenuItem(value: 'edit', child: Text('Edit')),
                                          const PopupMenuItem(value: 'delete', child: Text('Delete')),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}

class ArtifactDetailViewScreen extends StatefulWidget {
  const ArtifactDetailViewScreen({super.key, required this.artifact});

  final Artifact artifact;

  @override
  State<ArtifactDetailViewScreen> createState() => _ArtifactDetailViewScreenState();
}

class _ArtifactDetailViewScreenState extends State<ArtifactDetailViewScreen> {
  late Artifact _artifact;
  bool _convertingTo3D = false;

  @override
  void initState() {
    super.initState();
    _artifact = widget.artifact;
  }

  Future<void> _refetchArtifact() async {
    try {
      final a = await SupabaseService().getArtifactById(_artifact.id);
      if (mounted) setState(() => _artifact = a);
    } catch (_) {}
  }

  Future<void> _convertTo3D() async {
    final artifact = _artifact;
    if (artifact.modelUrl != null && artifact.modelUrl!.isNotEmpty) {
      if (!context.mounted) return;
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => Model3DViewerScreen(
            modelUrl: artifact.modelUrl!,
            artifactName: artifact.name,
            artifactId: artifact.id,
          ),
        ),
      );
      return;
    }
    if (artifact.imageUrl == null || artifact.imageUrl!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reconstructed image is required.')),
      );
      return;
    }
    if (meshyApiKey.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Set MESHY_API_KEY in assets/.env.example or use --dart-define=MESHY_API_KEY=your_key')),
      );
      return;
    }
    setState(() => _convertingTo3D = true);
    String? modelUrl;
    try {
      final bytes = await MeshyImageTo3DService().convertImageToGlb(artifact.imageUrl!);
      if (bytes == null || bytes.isEmpty) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('3D conversion failed.')));
        return;
      }
      final dir = await Directory.systemTemp.createTemp('meshy_glb');
      final file = File('${dir.path}/model.glb');
      await file.writeAsBytes(bytes);
      modelUrl = await SupabaseService().uploadModel(artifact.id, file);
      await SupabaseService().updateArtifactModelUrl(artifact.id, modelUrl);
      await _refetchArtifact();
    } on MeshyException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('3D conversion error: ${e.message}')));
      return;
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      return;
    } finally {
      if (mounted) setState(() => _convertingTo3D = false);
    }
    if (!context.mounted) return;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => Model3DViewerScreen(
          modelUrl: modelUrl!,
          artifactName: _artifact.name,
          artifactId: _artifact.id,
        ),
      ),
    );
  }

  Future<void> _editArtifact() async {
    await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => ArtifactDetailsScreen(artifact: _artifact, isEditMode: true),
      ),
    );
    await _refetchArtifact();
  }

  Future<void> _deleteArtifact() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete artifact?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    try {
      await SupabaseService().deleteArtifact(_artifact.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Artifact deleted.')));
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final artifact = _artifact;
    return Scaffold(
      backgroundColor: AppTheme.surfaceWarm,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceWarm,
        foregroundColor: AppTheme.stone800,
        title: const Text('Artifact'),
        actions: [
          IconButton(icon: const Icon(Icons.edit_outlined), onPressed: _editArtifact, tooltip: 'Edit'),
          IconButton(icon: const Icon(Icons.delete_outline), onPressed: _deleteArtifact, tooltip: 'Delete'),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Reconstructed image',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: AppTheme.stone600,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            if (artifact.imageUrl != null && artifact.imageUrl!.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: double.infinity,
                  constraints: const BoxConstraints(maxHeight: 420),
                  color: AppTheme.stone200,
                  child: Image.network(
                    artifact.imageUrl!,
                    fit: BoxFit.contain,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        height: 280,
                        color: AppTheme.stone200,
                        alignment: Alignment.center,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const CircularProgressIndicator(
                              color: AppTheme.primary,
                              strokeWidth: 2,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Loading image…',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.stone600,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                    errorBuilder: (_, __, ___) => Container(
                      color: AppTheme.stone200,
                      padding: const EdgeInsets.all(32),
                      child: const Center(child: Icon(Icons.broken_image, size: 48, color: AppTheme.stone500)),
                    ),
                  ),
                ),
              )
            else
              Container(
                height: 200,
                decoration: BoxDecoration(
                  color: AppTheme.stone200,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Center(child: Icon(Icons.image_outlined, size: 48, color: AppTheme.stone500)),
              ),
            const SizedBox(height: 24),
            Text(
              artifact.name,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppTheme.stone800,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  width: 4,
                  height: 20,
                  decoration: BoxDecoration(
                    color: AppTheme.primary,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  'Details',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppTheme.stone800,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.stone200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 12,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: (artifact.category != null && artifact.category!.isNotEmpty) ||
                      (artifact.era != null && artifact.era!.isNotEmpty) ||
                      (artifact.origin != null && artifact.origin!.isNotEmpty) ||
                      (artifact.description != null && artifact.description!.isNotEmpty)
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (artifact.category != null && artifact.category!.isNotEmpty) ...[
                          _DetailRow(label: 'Category', value: artifact.category!),
                          const SizedBox(height: 16),
                        ],
                        if (artifact.era != null && artifact.era!.isNotEmpty) ...[
                          _DetailRow(label: 'Era', value: artifact.era!),
                          const SizedBox(height: 16),
                        ],
                        if (artifact.origin != null && artifact.origin!.isNotEmpty) ...[
                          _DetailRow(label: 'Origin', value: artifact.origin!),
                          const SizedBox(height: 16),
                        ],
                        if (artifact.description != null && artifact.description!.isNotEmpty)
                          _DetailRow(label: 'Description', value: artifact.description!),
                      ],
                    )
                  : Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.info_outline_rounded, size: 22, color: AppTheme.primary),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'No details added yet',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppTheme.stone800,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Tap Edit above to add category, era, origin, or description.',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppTheme.stone500,
                                    height: 1.35,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
            const SizedBox(height: 28),
            if (_convertingTo3D)
              Container(
                padding: const EdgeInsets.all(20),
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Status',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppTheme.stone800,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 12),
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Converting to 3D…',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.stone600,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        backgroundColor: AppTheme.stone200,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                        minHeight: 4,
                      ),
                    ),
                  ],
                ),
              ),
            FilledButton.icon(
              onPressed: _convertingTo3D ? null : _convertTo3D,
              icon: _convertingTo3D
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.view_in_ar, size: 22),
              label: Text(_convertingTo3D ? 'Converting…' : (_artifact.modelUrl != null && _artifact.modelUrl!.isNotEmpty ? 'View 3D' : 'Convert to 3D')),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppTheme.stone600),
        ),
        const SizedBox(height: 2),
        Text(value, style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}

class Model3DViewerScreen extends StatefulWidget {
  const Model3DViewerScreen({
    super.key,
    required this.modelUrl,
    this.artifactName,
    this.artifactId,
    this.visitorMode = false,
  });

  final String modelUrl;
  final String? artifactName;
  final String? artifactId;
  final bool visitorMode;

  @override
  State<Model3DViewerScreen> createState() => _Model3DViewerScreenState();
}

class _Model3DViewerScreenState extends State<Model3DViewerScreen> {
  bool _modelLoading = true;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _modelLoading = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceDark,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceDarkMid,
        foregroundColor: Colors.white,
        title: const Text('3D model viewer'),
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Expanded(
                child: ModelViewer(
                  src: widget.modelUrl,
                  alt: 'Reconstructed artifact 3D model',
                  ar: false,
                  autoRotate: true,
                  cameraControls: true,
                  backgroundColor: AppTheme.surfaceDark,
                ),
              ),
              if (!widget.visitorMode)
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => AdminArtifactQrScreen(
                              artifactData: widget.modelUrl,
                              artifactName: widget.artifactName,
                              artifactId: widget.artifactId,
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.qr_code_2_outlined),
                      label: const Text('Generate QR for this model'),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          if (_modelLoading)
            Container(
              color: AppTheme.surfaceDark,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(
                      color: AppTheme.primary,
                      strokeWidth: 2,
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Loading 3D model…',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class AdminArtifactQrScreen extends StatefulWidget {
  const AdminArtifactQrScreen({
    super.key,
    required this.artifactData,
    this.artifactName,
    this.artifactId,
  });

  /// Encoded in QR: artifactId if set (so visitor gets details + model), else artifactData (model URL).
  final String artifactData;
  final String? artifactName;
  final String? artifactId;

  @override
  State<AdminArtifactQrScreen> createState() => _AdminArtifactQrScreenState();
}

class _AdminArtifactQrScreenState extends State<AdminArtifactQrScreen> {
  bool _saving = false;

  Future<void> _downloadQrImage() async {
    if (_saving) return;
    setState(() => _saving = true);
    try {
      const double width = 400, height = 500;
      const Color bgColor = Color(0xFFF2EDE5);
      const Color textColor = Color(0xFF1A1A1A);
      const double qrSize = 240.0;
      const double whiteBoxSize = 280.0;
      const double gapBetweenTitleAndQr = 28.0;

      final qrData = widget.artifactId ?? widget.artifactData;
      final qrPainter = QrPainter(
        data: qrData,
        version: QrVersions.auto,
        gapless: true,
      );
      final qrByteData = await qrPainter.toImageData(qrSize, format: ui.ImageByteFormat.png);
      if (qrByteData == null || qrByteData.buffer.asUint8List().isEmpty) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to generate QR image.')),
        );
        return;
      }
      final qrImage = await _decodeImageFromList(qrByteData.buffer.asUint8List());

      final title = widget.artifactName?.isNotEmpty == true ? widget.artifactName! : 'Artifact';
      final textPainter = TextPainter(
        text: TextSpan(
          text: title,
          style: const TextStyle(
            color: textColor,
            fontSize: 22,
            fontWeight: FontWeight.w600,
          ),
        ),
        textDirection: TextDirection.ltr,
        maxLines: 2,
        ellipsis: '…',
      );
      textPainter.layout(maxWidth: width - 48);
      final titleHeight = textPainter.height;
      final totalContentHeight = titleHeight + gapBetweenTitleAndQr + whiteBoxSize;
      final contentTop = (height - totalContentHeight) / 2;
      final whiteBoxTop = contentTop + titleHeight + gapBetweenTitleAndQr;
      final double whiteBoxLeft = (width - whiteBoxSize) / 2;
      final double qrLeft = (width - qrSize) / 2;
      final double qrTop = whiteBoxTop + (whiteBoxSize - qrSize) / 2;

      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder);
      final fullRect = Rect.fromLTWH(0, 0, width, height);
      canvas.drawRect(fullRect, Paint()..color = bgColor);

      textPainter.paint(
        canvas,
        Offset((width - textPainter.width) / 2, contentTop),
      );

      final whiteBoxRRect = RRect.fromRectAndRadius(
        Rect.fromLTWH(whiteBoxLeft, whiteBoxTop, whiteBoxSize, whiteBoxSize),
        const Radius.circular(20),
      );
      canvas.drawShadow(
        Path()..addRRect(whiteBoxRRect),
        const Color(0x1A000000),
        8,
        true,
      );
      canvas.drawRRect(whiteBoxRRect, Paint()..color = Colors.white);
      canvas.drawImageRect(
        qrImage,
        Rect.fromLTWH(0, 0, qrImage.width.toDouble(), qrImage.height.toDouble()),
        Rect.fromLTWH(qrLeft, qrTop, qrSize, qrSize),
        Paint(),
      );

      final picture = recorder.endRecording();
      final image = await picture.toImage(width.toInt(), height.toInt());
      final pngBytes = await image.toByteData(format: ui.ImageByteFormat.png);
      image.dispose();
      if (pngBytes == null || pngBytes.buffer.asUint8List().isEmpty) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to generate image.')),
        );
        return;
      }
      final timestamp = DateTime.now().toIso8601String().replaceAll(RegExp(r'[:\-.]'), '').substring(0, 15);
      await Gal.putImageBytes(pngBytes.buffer.asUint8List(), name: 'artifact_qr_$timestamp');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('QR code saved to gallery')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save QR code: $e')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<ui.Image> _decodeImageFromList(Uint8List list) async {
    final codec = await ui.instantiateImageCodec(list);
    final frame = await codec.getNextFrame();
    codec.dispose();
    return frame.image;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceWarm,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('Artifact QR code'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Share this artifact',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppTheme.stone800,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Visitors can scan this QR code in the app to view the 3D model.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.stone600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.06),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: QrImageView(
                    data: widget.artifactId ?? widget.artifactData,
                    version: QrVersions.auto,
                    size: 240,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _saving ? null : _downloadQrImage,
                icon: _saving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.download, size: 20),
                label: Text(_saving ? 'Saving…' : 'Download QR as image'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              widget.artifactId ?? widget.artifactData,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.stone500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Visitor-facing screen: 3D model on top, artifact details below (no admin actions).
class VisitorArtifactScreen extends StatefulWidget {
  const VisitorArtifactScreen({super.key, required this.artifact});

  final Artifact artifact;

  @override
  State<VisitorArtifactScreen> createState() => _VisitorArtifactScreenState();
}

class _VisitorArtifactScreenState extends State<VisitorArtifactScreen> {
  bool _modelLoading = true;

  @override
  void initState() {
    super.initState();
    final hasModel = widget.artifact.modelUrl != null && widget.artifact.modelUrl!.isNotEmpty;
    if (hasModel) {
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _modelLoading = false);
      });
    } else {
      _modelLoading = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final artifact = widget.artifact;
    final hasModel = artifact.modelUrl != null && artifact.modelUrl!.isNotEmpty;
    final hasAnyDetail = (artifact.category?.isNotEmpty ?? false) ||
        (artifact.era?.isNotEmpty ?? false) ||
        (artifact.origin?.isNotEmpty ?? false) ||
        (artifact.description?.isNotEmpty ?? false);

    return Scaffold(
      backgroundColor: AppTheme.surfaceDark,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceDarkMid,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          artifact.name,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.2,
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
              child: hasModel
                  ? Stack(
                      children: [
                        SizedBox(
                          height: 320,
                          child: ModelViewer(
                            src: artifact.modelUrl!,
                            alt: '${artifact.name} 3D model',
                            ar: false,
                            autoRotate: true,
                            cameraControls: true,
                            backgroundColor: AppTheme.surfaceDark,
                          ),
                        ),
                        if (_modelLoading)
                          Container(
                            height: 320,
                            color: AppTheme.surfaceDark,
                            alignment: Alignment.center,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const CircularProgressIndicator(
                                  color: AppTheme.primary,
                                  strokeWidth: 2,
                                ),
                                const SizedBox(height: 20),
                                Text(
                                  'Loading 3D model…',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: Colors.white70,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    )
                  : Container(
                      height: 200,
                      alignment: Alignment.center,
                      color: AppTheme.surfaceDarkMid,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.view_in_ar_outlined,
                            size: 48,
                            color: Colors.white.withValues(alpha: 0.4),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            '3D model not available',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white54,
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (hasAnyDetail) ...[
                    Row(
                      children: [
                        Container(
                          width: 4,
                          height: 22,
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Details',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            letterSpacing: -0.3,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceDarkMid,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.06),
                          width: 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (artifact.category != null && artifact.category!.isNotEmpty) ...[
                            _VisitorDetailRow(
                              label: 'Category',
                              value: artifact.category!,
                              icon: Icons.category_outlined,
                            ),
                            const SizedBox(height: 16),
                          ],
                          if (artifact.era != null && artifact.era!.isNotEmpty) ...[
                            _VisitorDetailRow(
                              label: 'Era',
                              value: artifact.era!,
                              icon: Icons.schedule_outlined,
                            ),
                            const SizedBox(height: 16),
                          ],
                          if (artifact.origin != null && artifact.origin!.isNotEmpty) ...[
                            _VisitorDetailRow(
                              label: 'Origin',
                              value: artifact.origin!,
                              icon: Icons.place_outlined,
                            ),
                            const SizedBox(height: 16),
                          ],
                          if (artifact.description != null && artifact.description!.isNotEmpty)
                            _VisitorDetailRow(
                              label: 'Description',
                              value: artifact.description!,
                              icon: Icons.description_outlined,
                            ),
                        ],
                      ),
                    ),
                  ] else
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        child: Text(
                          'No additional details for this artifact.',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.white54,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VisitorDetailRow extends StatelessWidget {
  const _VisitorDetailRow({
    required this.label,
    required this.value,
    this.icon,
  });

  final String label;
  final String value;
  final IconData? icon;

  static const IconData _defaultIcon = Icons.info_outline;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon ?? _defaultIcon, size: 18, color: AppTheme.primary),
            const SizedBox(width: 8),
            Text(
              label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: AppTheme.stone400,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Colors.white,
            height: 1.4,
          ),
        ),
      ],
    );
  }
}

class VisitorQrScannerScreen extends StatefulWidget {
  const VisitorQrScannerScreen({super.key});

  @override
  State<VisitorQrScannerScreen> createState() => _VisitorQrScannerScreenState();
}

class _VisitorQrScannerScreenState extends State<VisitorQrScannerScreen> {
  bool _handlingCode = false;

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_handlingCode) return;
    final barcode = capture.barcodes.firstOrNull;
    final raw = barcode?.rawValue?.trim();
    if (raw == null || raw.isEmpty) return;
    setState(() => _handlingCode = true);

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => Model3DViewerScreen(modelUrl: raw, visitorMode: true),
        ),
      );
      return;
    }

    try {
      final artifact = await SupabaseService().getArtifactById(raw);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => VisitorArtifactScreen(artifact: artifact),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() => _handlingCode = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Artifact not found. Please scan a valid QR code.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceDarkMid,
        foregroundColor: Colors.white,
        title: const Text('Scan artifact QR'),
      ),
      body: Stack(
        children: [
          MobileScanner(
            onDetect: _onDetect,
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppTheme.primary.withValues(alpha: 0.3),
                ),
              ),
              child: Text(
                'Point the camera at a QR code generated by the admin app.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
