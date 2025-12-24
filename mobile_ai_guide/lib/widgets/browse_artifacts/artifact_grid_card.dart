import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart';
import 'package:mobile_ai_guide/ui/html_styles.dart';
import 'package:mobile_ai_guide/models/artifact.dart';
import 'package:mobile_ai_guide/pages/artifact_detail_page.dart';
import 'package:flutter_html/flutter_html.dart';

class ArtifactGridCard extends StatelessWidget {
  const ArtifactGridCard({
    required this.artifact,
    required this.language,
    super.key,
  });

  final Artifact artifact;
  final String language;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isLargeCard = constraints.maxHeight > 300;
        final isSmallCard = constraints.maxHeight < 220;
        final imageHeight = isSmallCard
            ? constraints.maxHeight * 0.45
            : constraints.maxHeight * 0.5; // Increase image height

        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: kCardShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(12),
                ),
                child: SizedBox(
                  height: imageHeight,
                  child: Image.network(
                    artifact.imageUrl,
                    fit: BoxFit.cover,
                    loadingBuilder: (context, child, progress) {
                      if (progress == null) return child;
                      return Container(
                        color: Colors.grey.shade200,
                        alignment: Alignment.center,
                        child: SizedBox(
                          width: imageHeight * 0.2,
                          height: imageHeight * 0.2,
                          child: const CircularProgressIndicator(
                            strokeWidth: 2.5,
                          ),
                        ),
                      );
                    },
                    errorBuilder: (_, __, ___) => Container(
                      color: Colors.grey.shade200,
                      alignment: Alignment.center,
                      child: Icon(
                        Icons.broken_image,
                        color: Colors.grey,
                        size: imageHeight * 0.3,
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: EdgeInsets.all(isSmallCard ? 6 : 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        artifact.getTitle(language),
                        style: TextStyle(
                          fontSize: isSmallCard ? 11 : 14,
                          fontWeight: FontWeight.w700,
                          color: Colors.black,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: isSmallCard ? 2 : 6),
                      Flexible(
                        child: SingleChildScrollView(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _buildCompactInfoRow(
                                'Origin:',
                                artifact.getOrigin(language),
                                isSmallCard,
                              ),
                              SizedBox(height: isSmallCard ? 1 : 2),
                              _buildCompactInfoRow(
                                'Year:',
                                artifact.year,
                                isSmallCard,
                              ),
                              SizedBox(height: isSmallCard ? 1 : 2),
                              _buildCompactInfoRow(
                                'Category:',
                                artifact.getCategory(language),
                                isSmallCard,
                              ),
                            ],
                          ),
                        ),
                      ),
                      if (isLargeCard) ...[
                        SizedBox(height: isSmallCard ? 3 : 4),
                        Flexible(
                          child: Html(
                            data: artifact.getDescription(language),
                            style: {
                              "body": Style(
                                fontSize: FontSize(11),
                                color: Colors.grey.shade600,
                                lineHeight: const LineHeight(1.2),
                                margin: Margins.zero,
                                padding: HtmlPaddings.zero,
                                maxLines: 3,
                                textOverflow: TextOverflow.ellipsis,
                              ),
                              "p": Style(
                                margin: Margins.zero,
                                padding: HtmlPaddings.zero,
                              ),
                            },
                          ),
                        ),
                      ],
                      const Spacer(),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kGold,
                            foregroundColor: Colors.black,
                            padding: EdgeInsets.symmetric(
                              vertical: isSmallCard ? 5 : 7,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(6),
                            ),
                            elevation: 0,
                          ),
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) =>
                                    ArtifactDetailPage(artifact: artifact),
                              ),
                            );
                          },
                          child: Text(
                            'View Details',
                            style: TextStyle(
                              fontSize: isSmallCard ? 10 : 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCompactInfoRow(String label, String value, bool isSmallCard) {
    return Padding(
      padding: EdgeInsets.zero,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isSmallCard ? 8.5 : 11,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(width: 2),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: isSmallCard ? 8.5 : 11,
                color: Colors.grey.shade600,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, bool isSmallCard) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isSmallCard ? 9 : 10,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade700,
          ),
        ),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              fontSize: isSmallCard ? 9 : 10,
              color: Colors.grey.shade600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
