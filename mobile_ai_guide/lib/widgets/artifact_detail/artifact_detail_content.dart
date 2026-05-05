import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart';
import 'package:mobile_ai_guide/ui/html_styles.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:mobile_ai_guide/ui/content_language.dart';

class ArtifactDetailContent extends StatefulWidget {
  const ArtifactDetailContent({
    required this.description,
    required this.year,
    required this.category,
    required this.origin,
    this.material,
    this.dimensions,
    this.culturalSignificance,
    this.story,
    super.key,
  });

  final String description;
  final String year;
  final String category;
  final String origin;
  final String? material;
  final String? dimensions;
  final String? culturalSignificance;
  final String? story;

  @override
  State<ArtifactDetailContent> createState() => _ArtifactDetailContentState();
}

class _ArtifactDetailContentState extends State<ArtifactDetailContent> {
  final FlutterTts _tts = FlutterTts();
  bool _isSpeaking = false;
  String _speakingSection = ''; // Tracks which section is speaking
  int _highlightStart = 0;
  int _highlightEnd = 0;
  String _currentSpeakingText = ''; // Store the text being spoken

  @override
  void initState() {
    super.initState();
    _initializeTts();
    _setupProgressHandler();
  }

  void _setupProgressHandler() {
    _tts.setProgressHandler((text, startOffset, endOffset, word) {
      if (mounted) {
        setState(() {
          _highlightStart = startOffset ?? 0;
          _highlightEnd = endOffset ?? 0;
        });
      }
    });
  }

  Future<void> _initializeTts() async {
    await _tts.setLanguage(
      AppContentLanguage.instance.value == 'si' ? 'si_LK' : 'en_US',
    );
  }

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  Future<void> _speak(String text, {String section = ''}) async {
    if (text.isEmpty) return;
    // Strip HTML tags for TTS
    final plainText = text
        .replaceAll(RegExp(r'<[^>]*>'), '')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&amp;', '&');

    try {
      setState(() {
        _isSpeaking = true;
        _speakingSection = section;
        _currentSpeakingText = plainText;
        _highlightStart = 0;
        _highlightEnd = 0;
      });
      await _tts.speak(plainText);
      // Wait for speech to complete
      await Future.delayed(Duration(milliseconds: 500));
      await _tts.awaitSpeakCompletion(true);
    } finally {
      setState(() {
        _isSpeaking = false;
        _speakingSection = '';
        _highlightStart = 0;
        _highlightEnd = 0;
      });
    }
  }

  void _stopSpeaking() {
    _tts.stop();
    setState(() {
      _isSpeaking = false;
      _speakingSection = '';
      _highlightStart = 0;
      _highlightEnd = 0;
    });
  }

  Widget _buildHighlightedText(String text) {
    if (_highlightStart == 0 && _highlightEnd == 0) {
      return Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          height: 1.6,
          color: Colors.black87,
        ),
      );
    }

    final before = text.substring(0, _highlightStart);
    final highlighted = text.substring(_highlightStart, _highlightEnd);
    final after = text.substring(_highlightEnd);

    return RichText(
      text: TextSpan(
        style: const TextStyle(
          fontSize: 14,
          height: 1.6,
          color: Colors.black87,
        ),
        children: [
          TextSpan(text: before),
          TextSpan(
            text: highlighted,
            style: const TextStyle(
              backgroundColor: Color(0xFFFFEB3B),
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          TextSpan(text: after),
        ],
      ),
    );
  }

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
              children: [
                const Icon(Icons.description, color: kAccentOrange),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Description',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                ),
                IconButton(
                  icon: Icon(
                    _isSpeaking ? Icons.stop_circle : Icons.volume_up,
                    color: kAccentOrange,
                  ),
                  onPressed: () {
                    if (_isSpeaking) {
                      _stopSpeaking();
                    } else {
                      _speak(widget.description, section: 'description');
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (_speakingSection == 'description')
              _buildHighlightedText(_currentSpeakingText)
            else
              Html(
                data: widget.description,
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
                    value: widget.year,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _InfoCard(
                    icon: Icons.place_outlined,
                    title: 'Origin',
                    value: widget.origin,
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
                    value: widget.material ?? '-',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _InfoCard(
                    icon: Icons.straighten,
                    title: 'Dimensions',
                    value: widget.dimensions ?? '-',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Cultural Significance
            if (widget.culturalSignificance != null) ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.auto_stories, color: kAccentOrange),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Cultural Significance',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      _isSpeaking ? Icons.stop_circle : Icons.volume_up,
                      color: kAccentOrange,
                    ),
                    onPressed: () {
                      if (_isSpeaking) {
                        _stopSpeaking();
                      } else {
                        _speak(
                          widget.culturalSignificance!,
                          section: 'cultural',
                        );
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (_speakingSection == 'cultural')
                _buildHighlightedText(_currentSpeakingText)
              else
                Html(
                  data: widget.culturalSignificance!,
                  onLinkTap: (url, _, __) {
                    if (url != null) {
                      _launchURL(url);
                    }
                  },
                  style: HtmlStyles.getDefault(context),
                ),
            ],

            // Story Section
            if (widget.story != null) ...[
              if (widget.culturalSignificance != null)
                const SizedBox(height: 20),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.book, color: kAccentOrange),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Story Behind',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      _isSpeaking ? Icons.stop_circle : Icons.volume_up,
                      color: kAccentOrange,
                    ),
                    onPressed: () {
                      if (_isSpeaking) {
                        _stopSpeaking();
                      } else {
                        _speak(widget.story!, section: 'story');
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (_speakingSection == 'story')
                _buildHighlightedText(_currentSpeakingText)
              else
                Html(
                  data: widget.story!,
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
