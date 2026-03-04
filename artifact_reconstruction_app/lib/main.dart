import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:model_viewer_plus/model_viewer_plus.dart';
import 'package:qr_flutter/qr_flutter.dart';

import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/auth/admin_login_screen.dart';
import 'services/supabase_service.dart';
import 'models/artifact_model.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
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
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
      ),
      home: const RoleSelectionScreen(),
    );
  }
}

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select role'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 12),
              Text(
                'Artifact 3D reconstruction',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Choose how you want to use the app.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 24),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _RoleCard(
                      title: 'Admin',
                      subtitle:
                          'Capture/upload images, approve reconstruction, convert to 3D, generate QR.',
                      icon: Icons.admin_panel_settings_outlined,
                      onTap: () {
                        final supabaseAuth = SupabaseService().currentUser;
                        if (supabaseAuth != null) {
                          // Already logged in
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => const AdminHomeScreen(),
                            ),
                          );
                        } else {
                          // Needs to log in
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
                      subtitle: 'Scan QR codes and view 3D models.',
                      icon: Icons.qr_code_scanner_outlined,
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
              const SizedBox(height: 12),
              Text(
                'Android first • .glb models',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
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
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(icon, size: 32),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              const Icon(Icons.chevron_right),
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
      appBar: AppBar(
        title: const Text('Admin'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await SupabaseService().signOut();
              if (!context.mounted) return;
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute<void>(
                  builder: (_) => const RoleSelectionScreen(),
                ),
                (route) => false,
              );
            },
            tooltip: 'Logout',
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Admin',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 12),
              const Text(
                'Start by capturing or uploading an image of the broken artifact.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const AdminCaptureUploadScreen(),
                    ),
                  );
                },
                icon: const Icon(Icons.camera_alt_outlined),
                label: const Text('Capture or upload image'),
              ),
            ],
          ),
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
      appBar: AppBar(title: const Text('Visitor')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Scan QR to view 3D model',
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const VisitorQrScannerScreen(),
                    ),
                  );
                },
                icon: const Icon(Icons.qr_code_scanner_outlined),
                label: const Text('Scan QR code'),
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
      setState(() {
        _selectedImage = image;
      });
    }
  }

  Future<void> _pickFromGallery() async {
    final image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _selectedImage = image;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Capture or upload artifact')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _pickFromCamera,
                      icon: const Icon(Icons.camera_alt_outlined),
                      label: const Text('Camera'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _pickFromGallery,
                      icon: const Icon(Icons.photo_library_outlined),
                      label: const Text('Gallery'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Expanded(
                child: Center(
                  child: _selectedImage == null
                      ? Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.image_outlined,
                              size: 64,
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant,
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'No image selected.\nUse Camera or Gallery above.',
                              textAlign: TextAlign.center,
                            ),
                          ],
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.file(
                                  // ignore: deprecated_member_use
                                  File(_selectedImage!.path),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _selectedImage!.name,
                              style: Theme.of(context).textTheme.bodySmall,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton(
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
                child: const Text('Next: send for reconstruction'),
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

  @override
  void initState() {
    super.initState();
    _uploadAndSimulateReconstruction();
  }

  Future<void> _uploadAndSimulateReconstruction() async {
    final service = SupabaseService();
    try {
      final newArtifact = Artifact(
        id: '',
        name: 'New Artifact ${DateTime.now().millisecondsSinceEpoch}',
        createdAt: DateTime.now(),
        approvedBy: service.currentUser?.id,
      );
      
      _artifact = await service.createArtifact(newArtifact);

      if (!mounted) return;
      setState(() => _status = 'Uploading image to storage...');

      await service.uploadImage(_artifact!.id, File(widget.imagePath));
      
      if (!mounted) return;
      setState(() => _status = 'Running reconstruction (simulated)...');

      await Future<void>.delayed(const Duration(seconds: 3));
      
      if (!mounted) return;
      await service.updateArtifactStatus(id: _artifact!.id, status: 'reconstructed');
      
      setState(() {
        _status = 'Reconstruction complete. Review and approve to continue.';
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
      appBar: AppBar(title: const Text('Reconstruction status')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Status',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(_status),
              const SizedBox(height: 24),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.file(
                    File(widget.imagePath),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton(
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
                              builder: (_) => const Model3DViewerScreen(
                                // Sample public .glb; replace with backend URL later.
                                modelUrl:
                                    'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
                              ),
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
                child: const Text('Approve & convert to 3D'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class Model3DViewerScreen extends StatelessWidget {
  const Model3DViewerScreen({super.key, required this.modelUrl});

  final String modelUrl;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('3D model viewer')),
      body: Column(
        children: [
          Expanded(
            child: ModelViewer(
              src: modelUrl,
              alt: 'Reconstructed artifact 3D model',
              ar: false,
              autoRotate: true,
              cameraControls: true,
              backgroundColor: Theme.of(context).colorScheme.surface,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: FilledButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => AdminArtifactQrScreen(
                      artifactData: modelUrl,
                    ),
                  ),
                );
              },
              icon: const Icon(Icons.qr_code_2_outlined),
              label: const Text('Generate QR for this model'),
            ),
          ),
        ],
      ),
    );
  }
}

class AdminArtifactQrScreen extends StatelessWidget {
  const AdminArtifactQrScreen({super.key, required this.artifactData});

  /// For now we encode the model URL directly.
  /// Later this can be an artifactId or deep link.
  final String artifactData;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Artifact QR code')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Share this artifact',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Visitors can scan this QR code in the app to view the 3D model.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            Expanded(
              child: Center(
                child: QrImageView(
                  data: artifactData,
                  version: QrVersions.auto,
                  size: 240,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              artifactData,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
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

  void _onDetect(BarcodeCapture capture) {
    if (_handlingCode) return;
    final barcode = capture.barcodes.firstOrNull;
    final raw = barcode?.rawValue;
    if (raw == null || raw.isEmpty) {
      return;
    }
    setState(() {
      _handlingCode = true;
    });
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => Model3DViewerScreen(modelUrl: raw),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan artifact QR')),
      body: Stack(
        children: [
          MobileScanner(
            onDetect: _onDetect,
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              padding: const EdgeInsets.all(16),
              color: Colors.black54,
              child: const Text(
                'Point the camera at a QR code generated by the admin app.',
                style: TextStyle(color: Colors.white),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
