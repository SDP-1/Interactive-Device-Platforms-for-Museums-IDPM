import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/models/artifact.dart';
import 'package:mobile_ai_guide/ui/colors.dart';
import 'ai_guide_chat_page.dart';

class AiGuideIntroPage extends StatelessWidget {
  const AiGuideIntroPage({required this.artifact, super.key});

  final Artifact artifact;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kCream,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Column(
                  children: [
                    const SizedBox(height: 10),
                    // Back button row
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      child: Row(
                        children: [
                          Material(
                            color: Colors.white,
                            shape: const CircleBorder(),
                            elevation: 2,
                            child: InkWell(
                              customBorder: const CircleBorder(),
                              onTap: () => Navigator.of(context).pop(),
                              child: const Padding(
                                padding: EdgeInsets.all(6),
                                child: Icon(
                                  Icons.arrow_back,
                                  color: Colors.black87,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Title and status
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            artifact.getTitle(),
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'AI Guide Ready',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 18),

                    // Robot circle
                    Center(
                      child: Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          color: kGold,
                          shape: BoxShape.circle,
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.black12,
                              blurRadius: 12,
                              offset: Offset(0, 6),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.android,
                            color: Colors.white,
                            size: 40,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),

                    // Card
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: kCardShadow,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(18),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: const [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundColor: kInfoBadge,
                                    child: Icon(
                                      Icons.info_outline,
                                      color: kGold,
                                      size: 18,
                                    ),
                                  ),
                                  SizedBox(width: 12),
                                  Text(
                                    'Welcome to AI Guide',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 12),
                              const Text(
                                'Ask me any question related to this artifact. I can help you understand its history, cultural context, symbolism, and much more.',
                                style: TextStyle(
                                  color: Colors.black87,
                                  height: 1.3,
                                ),
                              ),

                              const SizedBox(height: 16),

                              // Light blue suggestion container
                              Container(
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  color: kInfoBackground,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: const [
                                    Text(
                                      'Try asking:',
                                      style: TextStyle(color: Colors.black54),
                                    ),
                                    SizedBox(height: 8),
                                    _SuggestionTile(
                                      label: 'What materials were used?',
                                      color: kInfoDotBlue,
                                    ),
                                    SizedBox(height: 8),
                                    _SuggestionTile(
                                      label: 'Why was it placed in the tomb?',
                                      color: kInfoDotPurple,
                                    ),
                                    SizedBox(height: 8),
                                    _SuggestionTile(
                                      label: 'Tell me about the symbols',
                                      color: kInfoDotRed,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),
                  ],
                ),
              ),
            ),

            // Bottom fixed button + caption
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 10),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => AiGuideChatPage(artifact: artifact),
                        ),
                      );
                    },
                    child: Container(
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [kGoldLight, kGold],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: const [
                          BoxShadow(
                            color: Colors.black12,
                            blurRadius: 8,
                            offset: Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.chat_bubble_outline, color: Colors.white),
                          SizedBox(width: 12),
                          Text(
                            'Start Asking',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Center(
                    child: Text(
                      'Powered by AI • Museum-verified information',
                      style: TextStyle(color: Colors.black45, fontSize: 12),
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

class _SuggestionTile extends StatelessWidget {
  const _SuggestionTile({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(label, style: const TextStyle(color: Colors.black87)),
          ),
        ],
      ),
    );
  }
}
