import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart';
import 'package:mobile_ai_guide/ui/html_styles.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:url_launcher/url_launcher.dart';

class ArtifactDetailContent extends StatelessWidget {
  const ArtifactDetailContent({
    required this.description,
    required this.year,
    required this.category,
    required this.origin,
    this.material,
    this.dimensions,
    this.culturalSignificance,
    super.key,
  });

  final String description;
  final String year;
  final String category;
  final String origin;
  final String? material;
  final String? dimensions;
  final String? culturalSignificance;

  @override
  Widget build(BuildContext context) {
    return SelectionArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Description Section
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Icon(Icons.description, color: kAccentOrange),
                SizedBox(width: 8),
                Text(
                  'Description',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Html(
              data: description,
              onLinkTap: (url, _, __) {
                if (url != null) {
                  _launchURL(url);
                }
              },
              style: HtmlStyles.getDefault(context),
            ),
            const SizedBox(height: 16),

            // Info cards row 1: Era, Origin
            Row(
              children: [
                Expanded(
                  child: _InfoCard(
                    icon: Icons.calendar_today_outlined,
                    title: 'Era',
                    value: year,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _InfoCard(
                    icon: Icons.place_outlined,
                    title: 'Origin',
                    value: origin,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Info cards row 2: Material, Dimensions
            Row(
              children: [
                Expanded(
                  child: _InfoCard(
                    icon: Icons.terrain, // material-like icon
                    title: 'Material',
                    value: material ?? '-',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _InfoCard(
                    icon: Icons.straighten,
                    title: 'Dimensions',
                    value: dimensions ?? '-',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Cultural Significance
            if (culturalSignificance != null) ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Icon(Icons.auto_stories, color: kAccentOrange),
                  SizedBox(width: 8),
                  Text(
                    'Cultural Significance',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Html(
                data: culturalSignificance!,
                onLinkTap: (url, _, __) {
                  if (url != null) {
                    _launchURL(url);
                  }
                },
                style: HtmlStyles.getDefault(context),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _launchURL(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint('Could not launch $url: $e');
    }
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.icon,
    required this.title,
    required this.value,
  });

  final IconData icon;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: kCream,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: Colors.grey.shade700),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(fontSize: 13, color: Colors.grey.shade800),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({
    required this.title,
    required this.icon,
    required this.color,
  });

  final String title;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: Colors.black,
          ),
        ),
      ],
    );
  }
}
