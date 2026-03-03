import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:model_viewer_plus/model_viewer_plus.dart';
import 'dart:io';

void main() {
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
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const AdminHomeScreen(),
                          ),
                        );
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
      appBar: AppBar(title: const Text('Admin')),
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
      body: const Center(
        child: Text('Visitor home (next: scan QR to view 3D model).'),
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

  @override
  void initState() {
    super.initState();
    _simulateReconstructionFlow();
  }

  Future<void> _simulateReconstructionFlow() async {
    await Future<void>.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    setState(() {
      _status = 'Running reconstruction...';
    });

    await Future<void>.delayed(const Duration(seconds: 3));
    if (!mounted) return;
    setState(() {
      _status = 'Reconstruction complete. Review and approve to continue.';
      _completed = true;
    });
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
                onPressed: !_completed
                    ? null
                    : () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const Model3DViewerScreen(
                              // Sample public .glb; replace with backend URL later.
                              modelUrl:
                                  'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
                            ),
                          ),
                        );
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
      body: ModelViewer(
        src: modelUrl,
        alt: 'Reconstructed artifact 3D model',
        ar: false,
        autoRotate: true,
        cameraControls: true,
        backgroundColor: Theme.of(context).colorScheme.surface,
      ),
    );
  }
}
