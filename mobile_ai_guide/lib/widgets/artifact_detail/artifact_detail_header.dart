import 'package:flutter/material.dart';

class ArtifactDetailHeader extends StatefulWidget {
  const ArtifactDetailHeader({required this.imageUrls, super.key});

  final List<String> imageUrls;

  @override
  State<ArtifactDetailHeader> createState() => _ArtifactDetailHeaderState();
}

class _ArtifactDetailHeaderState extends State<ArtifactDetailHeader> {
  late final PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _openFullScreenViewer(int initialPage) {
    final images = widget.imageUrls.isNotEmpty
        ? widget.imageUrls
        : <String>[''];

    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Close',
      barrierColor: Colors.black.withOpacity(0.9),
      pageBuilder: (context, anim1, anim2) {
        final controller = PageController(initialPage: initialPage);
        int current = initialPage;
        final transformControllers = List.generate(
          images.length,
          (_) => TransformationController(),
        );
        return SafeArea(
          child: StatefulBuilder(
            builder: (context, setStateDialog) {
              void zoomIn() {
                final transformController = transformControllers[current];
                final currentScale = transformController.value
                    .getMaxScaleOnAxis();
                if (currentScale < 4) {
                  final newScale = (currentScale + 0.5).clamp(1.0, 4.0);
                  transformController.value = Matrix4.identity()
                    ..scale(newScale);
                  setStateDialog(() {});
                }
              }

              void zoomOut() {
                final transformController = transformControllers[current];
                final currentScale = transformController.value
                    .getMaxScaleOnAxis();
                if (currentScale > 1) {
                  final newScale = (currentScale - 0.5).clamp(1.0, 4.0);
                  transformController.value = Matrix4.identity()
                    ..scale(newScale);
                  setStateDialog(() {});
                }
              }

              return Stack(
                children: [
                  PageView.builder(
                    controller: controller,
                    onPageChanged: (i) => setStateDialog(() => current = i),
                    itemCount: images.length,
                    itemBuilder: (_, index) {
                      final url = images[index];
                      return InteractiveViewer(
                        transformationController: transformControllers[index],
                        clipBehavior: Clip.none,
                        minScale: 1,
                        maxScale: 4,
                        child: Container(
                          color: Colors.black,
                          alignment: Alignment.center,
                          child: url.isNotEmpty
                              ? Image.network(
                                  url,
                                  fit: BoxFit.contain,
                                  loadingBuilder: (context, child, progress) {
                                    if (progress == null) return child;
                                    return const Center(
                                      child: CircularProgressIndicator(),
                                    );
                                  },
                                  errorBuilder: (_, __, ___) => const Icon(
                                    Icons.broken_image,
                                    color: Colors.white54,
                                    size: 80,
                                  ),
                                )
                              : const Icon(
                                  Icons.broken_image,
                                  color: Colors.white54,
                                  size: 80,
                                ),
                        ),
                      );
                    },
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    child: _CircleIconButton(
                      icon: Icons.close,
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Column(
                      children: [
                        _CircleIconButton(
                          icon: Icons.zoom_in,
                          onPressed: zoomIn,
                        ),
                        const SizedBox(height: 8),
                        _CircleIconButton(
                          icon: Icons.zoom_out,
                          onPressed: zoomOut,
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(images.length, (index) {
                        final isActive = index == current;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: isActive ? 10 : 8,
                          height: isActive ? 10 : 8,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(
                              isActive ? 0.95 : 0.5,
                            ),
                            shape: BoxShape.circle,
                          ),
                        );
                      }),
                    ),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final images = widget.imageUrls.isNotEmpty
        ? widget.imageUrls
        : <String>[''];

    return Stack(
      children: [
        GestureDetector(
          onTap: () => _openFullScreenViewer(_currentPage),
          child: SizedBox(
            height: 320,
            width: double.infinity,
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: (i) => setState(() => _currentPage = i),
              itemCount: images.length,
              itemBuilder: (_, index) {
                final url = images[index];
                return Image.network(
                  url,
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, progress) {
                    if (progress == null) return child;
                    return Container(
                      color: Colors.grey.shade200,
                      alignment: Alignment.center,
                      child: const CircularProgressIndicator(),
                    );
                  },
                  errorBuilder: (_, __, ___) => Container(
                    color: Colors.grey.shade200,
                    alignment: Alignment.center,
                    child: const Icon(Icons.broken_image, size: 60),
                  ),
                );
              },
            ),
          ),
        ),
        Positioned(
          bottom: 14,
          left: 0,
          right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(images.length, (index) {
              final isActive = index == _currentPage;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: isActive ? 10 : 8,
                height: isActive ? 10 : 8,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(isActive ? 0.95 : 0.6),
                  shape: BoxShape.circle,
                ),
              );
            }),
          ),
        ),
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _CircleIconButton(
                    icon: Icons.arrow_back,
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  Row(
                    children: [
                      _CircleIconButton(
                        icon: Icons.share_outlined,
                        onPressed: () {},
                      ),
                      const SizedBox(width: 12),
                      _CircleIconButton(
                        icon: Icons.bookmark_outline,
                        onPressed: () {},
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _CircleIconButton extends StatelessWidget {
  const _CircleIconButton({required this.icon, required this.onPressed});

  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: IconButton(
        icon: Icon(icon),
        color: Colors.black,
        onPressed: onPressed,
      ),
    );
  }
}
