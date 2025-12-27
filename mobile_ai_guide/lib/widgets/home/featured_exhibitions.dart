import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;

class FeaturedExhibitionsSection extends StatelessWidget {
  const FeaturedExhibitionsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: app.kCardShadow,
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          _HeaderRow(),
          SizedBox(height: 12),
          ExhibitionItem(
            imageUrl:
                'https://curiosmos.com/wp-content/uploads/2020/09/Sigiriya-4.jpg',
            title: 'Ancient Kingdoms',
            artifacts: '12 artifacts',
            duration: '45 min tour',
          ),
          SizedBox(height: 12),
          ExhibitionItem(
            imageUrl:
                'https://live.staticflickr.com/8107/8538025666_ab2728dcbb_b.jpg',
            title: 'Traditional Arts',
            artifacts: '18 artifacts',
            duration: '30 min tour',
          ),
        ],
      ),
    );
  }
}

class _HeaderRow extends StatelessWidget {
  const _HeaderRow();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: const [
        Expanded(
          child: Text(
            'Featured Exhibitions',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
          ),
        ),
        Text(
          'View All',
          style: TextStyle(color: app.kGold, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}

class ExhibitionItem extends StatelessWidget {
  const ExhibitionItem({
    super.key,
    required this.imageUrl,
    required this.title,
    required this.artifacts,
    required this.duration,
  });

  final String imageUrl;
  final String title;
  final String artifacts;
  final String duration;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () {},
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          _ExhibitionThumb(imageUrl: imageUrl),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Text(
                  artifacts,
                  style: const TextStyle(
                    color: app.kStoneText,
                    fontSize: 14,
                    height: 1.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: app.kStoneAccent,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      duration,
                      style: const TextStyle(
                        color: app.kStoneText,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: app.kGold),
        ],
      ),
    );
  }
}

class _ExhibitionThumb extends StatelessWidget {
  const _ExhibitionThumb({required this.imageUrl});

  final String imageUrl;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Image.network(
        imageUrl,
        width: 86,
        height: 86,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stack) => const _FallbackThumb(),
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return const _FallbackThumb(isLoading: true);
        },
      ),
    );
  }
}

class _FallbackThumb extends StatelessWidget {
  const _FallbackThumb({this.isLoading = false});

  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 86,
      height: 86,
      color: app.kStoneSurface,
      child: Center(
        child: isLoading
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: app.kGold,
                ),
              )
            : const Icon(
                Icons.image_not_supported_outlined,
                color: Colors.black26,
              ),
      ),
    );
  }
}
