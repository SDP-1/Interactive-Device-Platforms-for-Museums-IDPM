import 'package:flutter/material.dart';

class ArtifactDetailInfo extends StatelessWidget {
  const ArtifactDetailInfo({
    required this.title,
    required this.gallery,
    super.key,
  });

  final String title;
  final String gallery;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: Colors.black,
              height: 1.25,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            gallery,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
