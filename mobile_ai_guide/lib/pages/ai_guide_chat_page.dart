import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/models/artifact.dart';
import 'package:mobile_ai_guide/ui/colors.dart';
import 'package:mobile_ai_guide/services/ai_guide_service.dart';
import 'package:mobile_ai_guide/ui/chat_language.dart';
import 'package:mobile_ai_guide/ui/content_language.dart';
import 'package:mobile_ai_guide/ui/strings.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

enum MessageSender { bot, user, system }

class ChatMessage {
  ChatMessage({
    required this.text,
    required this.sender,
    DateTime? time,
    this.isWarning = false,
  }) : time = time ?? DateTime.now();
  final String text;
  final MessageSender sender;
  final DateTime time;
  final bool isWarning;
}

class AiGuideChatPage extends StatefulWidget {
  const AiGuideChatPage({required this.artifact, super.key});

  final Artifact artifact;

  @override
  State<AiGuideChatPage> createState() => _AiGuideChatPageState();
}

class _AiGuideChatPageState extends State<AiGuideChatPage> {
  final List<ChatMessage> _messages = [];
  final TextEditingController _controller = TextEditingController();
  bool _isLoading = false;
  String? _currentlySpeakingMessageId;
  late FlutterTts flutterTts;
  late stt.SpeechToText _speechToText;
  bool _isListening = false;
  String _recognizedText = '';
  String _selectedLanguage = 'en_US';
  String _chatLanguage = 'en';
  void Function()? _modalStateUpdater;
  late final VoidCallback _chatLanguageListener;

  @override
  void initState() {
    super.initState();
    _chatLanguage = AppChatLanguage.instance.value;
    _selectedLanguage = AppChatLanguage.localeFor(_chatLanguage);
    _chatLanguageListener = () {
      final lang = AppChatLanguage.instance.value;
      final locale = AppChatLanguage.localeFor(lang);
      setState(() {
        _chatLanguage = lang;
        _selectedLanguage = locale;
      });
      flutterTts.setLanguage(locale);
    };
    AppChatLanguage.instance.notifier.addListener(_chatLanguageListener);
    _initializeTts();
    _initializeSpeechToText();
    _messages.addAll([
      ChatMessage(
        text: _buildIntroMessage(
          _chatLanguage,
          AppContentLanguage.instance.value,
        ),
        sender: MessageSender.bot,
        time: DateTime.now().subtract(const Duration(minutes: 4)),
      ),
    ]);
  }

  String _buildIntroMessage(String chatLang, String contentLang) {
    final artifactLang = contentLang == 'si' ? 'si' : 'en';
    final title = widget.artifact.getTitle(artifactLang);
    return AppStrings.introGreeting(chatLang, title);
  }

  void _initializeTts() {
    flutterTts = FlutterTts();
    flutterTts.setLanguage(_selectedLanguage);
    flutterTts.setPitch(1.0);
    flutterTts.setSpeechRate(0.5);
  }

  void _initializeSpeechToText() {
    _speechToText = stt.SpeechToText();
  }

  Future<void> _speak(String text) async {
    try {
      setState(() {
        _currentlySpeakingMessageId = text;
      });

      await flutterTts.setLanguage(_selectedLanguage);

      await flutterTts.speak(text);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error speaking: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _stopSpeech() async {
    try {
      await flutterTts.stop();
      setState(() {
        _currentlySpeakingMessageId = null;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error stopping speech: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _startListening() async {
    if (!_isListening) {
      bool available = await _speechToText.initialize(
        onError: (error) {
          if (mounted) {
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(SnackBar(content: Text('Error: ${error.errorMsg}')));
          }
          setState(() => _isListening = false);
          _modalStateUpdater?.call();
        },
        onStatus: (status) {
          if (status == 'done' || status == 'notListening') {
            setState(() => _isListening = false);
            _modalStateUpdater?.call();
          }
        },
      );

      if (available) {
        setState(() {
          _isListening = true;
          _recognizedText = '';
        });
        _modalStateUpdater?.call();
        _speechToText.listen(
          onResult: (result) {
            setState(() {
              _recognizedText = result.recognizedWords;
            });
            _modalStateUpdater?.call();
          },
          localeId: _selectedLanguage,
          listenFor: const Duration(seconds: 60),
          pauseFor: const Duration(seconds: 5),
          listenMode: stt.ListenMode.confirmation,
        );
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Speech recognition not available on this device'),
            ),
          );
        }
      }
    }
  }

  Future<void> _stopListening() async {
    if (_isListening) {
      await _speechToText.stop();
      setState(() => _isListening = false);
      _modalStateUpdater?.call();
      if (_recognizedText.isNotEmpty) {
        _controller.text = _recognizedText;
      }
    }
  }

  void _showVoiceInputBottomSheet() {
    _recognizedText = '';
    _isListening = false;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          _modalStateUpdater = () {
            if (context.mounted) {
              setModalState(() {});
            }
          };

          return _VoiceInputWidget(
            isListening: _isListening,
            recognizedText: _recognizedText,
            selectedLanguage: _selectedLanguage,
            onLanguageChanged: (language) {
              final langCode = AppChatLanguage.languageForLocale(language);
              AppChatLanguage.instance.setLanguage(langCode);
              setModalState(() => _selectedLanguage = language);
              setState(() {
                _chatLanguage = langCode;
                _selectedLanguage = language;
              });
              flutterTts.setLanguage(language);
            },
            onStartListening: () async {
              await _startListening();
            },
            onStopListening: () async {
              await _stopListening();
            },
            onTextSubmit: (text) {
              _controller.text = text;
              _recognizedText = '';
              _modalStateUpdater = null;
              Navigator.pop(context);
              setState(() {});
            },
          );
        },
      ),
    ).whenComplete(() {
      _modalStateUpdater = null;
    });
  }

  @override
  void dispose() {
    flutterTts.stop();
    _speechToText.stop();
    _controller.dispose();
    AppChatLanguage.instance.notifier.removeListener(_chatLanguageListener);
    super.dispose();
  }

  String _formatTime(BuildContext context, DateTime t) {
    final timeOfDay = TimeOfDay.fromDateTime(t);
    return timeOfDay.format(context);
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;
    setState(() {
      _messages.add(ChatMessage(text: text.trim(), sender: MessageSender.user));
      _isLoading = true;
    });
    _controller.clear();

    try {
      final response = await AiGuideService.askQuestion(
        artifactId: widget.artifact.artifactId,
        question: text.trim(),
        language: _chatLanguage,
      );

      if (mounted) {
        setState(() {
          if (response.contains('not related')) {
            _messages.add(
              ChatMessage(
                text: response,
                sender: MessageSender.system,
                isWarning: true,
              ),
            );
          } else {
            _messages.add(
              ChatMessage(text: response, sender: MessageSender.bot),
            );
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _messages.add(
            ChatMessage(
              text: 'Error: ${e.toString()}',
              sender: MessageSender.system,
              isWarning: true,
            ),
          );
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppContentLanguage.instance.notifier,
      builder: (context, contentLang, _) {
        final artifactLang = contentLang == 'si' ? 'si' : 'en';
        return Scaffold(
          backgroundColor: kCream,
          appBar: AppBar(
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.artifact.getTitle(artifactLang),
                  style: const TextStyle(color: Colors.black87, fontSize: 16),
                ),
                const SizedBox(height: 2),
                Text(
                  widget.artifact.year,
                  style: const TextStyle(color: Colors.black54, fontSize: 12),
                ),
              ],
            ),
            backgroundColor: Colors.white,
            foregroundColor: Colors.black87,
            elevation: 1,
            actions: [
              IconButton(
                onPressed: () {},
                icon: const Icon(Icons.info_outline, color: Colors.black54),
              ),
            ],
          ),
          body: Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                  itemCount: _messages.length,
                  itemBuilder: (context, i) {
                    final m = _messages[i];
                    if (m.isWarning && m.sender == MessageSender.system) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        child: _WarningBanner(text: m.text),
                      );
                    }
                    if (m.sender == MessageSender.user)
                      return _UserBubble(
                        text: m.text,
                        time: _formatTime(context, m.time),
                        onSpeak: _speak,
                        onStop: _stopSpeech,
                        isSpeaking: _currentlySpeakingMessageId == '$i-user',
                      );
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                margin: const EdgeInsets.only(right: 12),
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: kGold,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.android,
                                  color: Colors.white,
                                  size: 18,
                                ),
                              ),
                              Expanded(
                                child: _BotBubble(
                                  text: m.text,
                                  time: _formatTime(context, m.time),
                                  onSpeak: _speak,
                                  onStop: _stopSpeech,
                                  isSpeaking:
                                      _currentlySpeakingMessageId == '$i-bot',
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              // Input area
              SafeArea(
                top: false,
                child: Container(
                  color: Colors.transparent,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Row(
                            children: [
                              GestureDetector(
                                onTap: _showVoiceInputBottomSheet,
                                child: const Icon(
                                  Icons.mic,
                                  color: Colors.black45,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextField(
                                  controller: _controller,
                                  enabled: !_isLoading,
                                  decoration: const InputDecoration(
                                    border: InputBorder.none,
                                    hintText: 'Ask a question...',
                                  ),
                                  textInputAction: TextInputAction.send,
                                  onSubmitted: _isLoading ? null : _sendMessage,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        decoration: BoxDecoration(
                          color: _isLoading ? Colors.grey : kGold,
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          onPressed: _isLoading
                              ? null
                              : () => _sendMessage(_controller.text),
                          icon: _isLoading
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.white,
                                    ),
                                  ),
                                )
                              : const Icon(Icons.send, color: Colors.white),
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
}

class _BotBubble extends StatefulWidget {
  const _BotBubble({
    required this.text,
    required this.time,
    required this.onSpeak,
    required this.onStop,
    required this.isSpeaking,
  });

  final String text;
  final String time;
  final Function(String) onSpeak;
  final VoidCallback onStop;
  final bool isSpeaking;

  @override
  State<_BotBubble> createState() => _BotBubbleState();
}

class _BotBubbleState extends State<_BotBubble> {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kGoldBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.text, style: const TextStyle(color: Colors.black87)),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.time,
                style: const TextStyle(color: Colors.black45, fontSize: 11),
              ),
              Row(
                children: [
                  widget.isSpeaking
                      ? GestureDetector(
                          onTap: widget.onStop,
                          child: Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.stop,
                              color: Colors.white,
                              size: 14,
                            ),
                          ),
                        )
                      : GestureDetector(
                          onTap: () => widget.onSpeak(widget.text),
                          child: Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              color: kGold,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.volume_up,
                              color: Colors.white,
                              size: 14,
                            ),
                          ),
                        ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _UserBubble extends StatefulWidget {
  const _UserBubble({
    required this.text,
    required this.time,
    required this.onSpeak,
    required this.onStop,
    required this.isSpeaking,
  });

  final String text;
  final String time;
  final Function(String) onSpeak;
  final VoidCallback onStop;
  final bool isSpeaking;

  @override
  State<_UserBubble> createState() => _UserBubbleState();
}

class _UserBubbleState extends State<_UserBubble> {
  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: kGold,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(widget.text, style: const TextStyle(color: Colors.white)),
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                widget.isSpeaking
                    ? GestureDetector(
                        onTap: widget.onStop,
                        child: Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.stop,
                            color: Colors.black54,
                            size: 12,
                          ),
                        ),
                      )
                    : GestureDetector(
                        onTap: () => widget.onSpeak(widget.text),
                        child: Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.volume_up,
                            color: Colors.black54,
                            size: 12,
                          ),
                        ),
                      ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _WarningBanner extends StatelessWidget {
  const _WarningBanner({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: kWarningSurface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kWarningBorder),
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: kWarningIcon),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: const TextStyle(color: Colors.black87)),
          ),
        ],
      ),
    );
  }
}

class _AudioControls extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const SizedBox.shrink();
  }
}

class _VoiceInputWidget extends StatelessWidget {
  final bool isListening;
  final String recognizedText;
  final String selectedLanguage;
  final Function(String) onLanguageChanged;
  final Future Function() onStartListening;
  final Future Function() onStopListening;
  final Function(String) onTextSubmit;

  const _VoiceInputWidget({
    required this.isListening,
    required this.recognizedText,
    required this.selectedLanguage,
    required this.onLanguageChanged,
    required this.onStartListening,
    required this.onStopListening,
    required this.onTextSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          top: 16,
          left: 16,
          right: 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Voice Input', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),

            // Language selection
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Select Language:',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _LanguageButton(
                          label: '🇬🇧 English',
                          isSelected: selectedLanguage == 'en_US',
                          onTap: () => onLanguageChanged('en_US'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _LanguageButton(
                          label: '🇱🇰 Sinhala',
                          isSelected: selectedLanguage == 'si_LK',
                          onTap: () => onLanguageChanged('si_LK'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Listening visualization
            if (isListening)
              Column(
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: kGold.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Center(child: _AnimatedThreeDots()),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Listening...',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Speak clearly about the artifact',
                    style: TextStyle(fontSize: 14, color: Colors.black54),
                  ),
                ],
              )
            else
              Column(
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: kGold.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.mic, size: 40, color: kGold),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Ready to listen',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Press start and begin speaking',
                    style: TextStyle(fontSize: 13, color: Colors.black54),
                  ),
                ],
              ),

            const SizedBox(height: 24),

            // Recognized text display
            if (recognizedText.isNotEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Recognized Text:',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.black54,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      recognizedText,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 24),

            // Control buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      if (isListening) {
                        await onStopListening();
                      } else {
                        await onStartListening();
                      }
                    },
                    icon: Icon(isListening ? Icons.stop : Icons.mic),
                    label: Text(isListening ? 'Stop' : 'Start Listening'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isListening ? Colors.red : kGold,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Submit button - only show when NOT listening and text exists
            if (recognizedText.isNotEmpty && !isListening)
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => onTextSubmit(recognizedText),
                      icon: const Icon(Icons.check),
                      label: const Text('Use This Text'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),

            const SizedBox(height: 12),

            // Close button
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Close'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _LanguageButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _LanguageButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? kGold : Colors.white,
          border: Border.all(color: isSelected ? kGold : Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: isSelected ? Colors.white : Colors.black87,
            ),
          ),
        ),
      ),
    );
  }
}

class _AnimatedThreeDots extends StatefulWidget {
  const _AnimatedThreeDots();

  @override
  State<_AnimatedThreeDots> createState() => _AnimatedThreeDotsState();
}

class _AnimatedThreeDotsState extends State<_AnimatedThreeDots>
    with TickerProviderStateMixin {
  late List<AnimationController> _controllers;
  late List<Animation<double>> _animations;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(
      3,
      (index) => AnimationController(
        duration: const Duration(milliseconds: 600),
        vsync: this,
      ),
    );

    _animations = _controllers.asMap().entries.map((entry) {
      int index = entry.key;
      AnimationController controller = entry.value;

      return Tween<double>(
        begin: 0,
        end: 1,
      ).animate(CurvedAnimation(parent: controller, curve: Curves.easeInOut));
    }).toList();

    // Stagger the animations
    for (int i = 0; i < _controllers.length; i++) {
      Future.delayed(Duration(milliseconds: i * 150), () {
        if (mounted) {
          _controllers[i].repeat(reverse: true);
        }
      });
    }
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(3, (index) {
        return ScaleTransition(
          scale: _animations[index],
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6.0),
            child: Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(color: kGold, shape: BoxShape.circle),
            ),
          ),
        );
      }),
    );
  }
}

class _AnimatedMicIcon extends StatefulWidget {
  @override
  State<_AnimatedMicIcon> createState() => _AnimatedMicIconState();
}

class _AnimatedMicIconState extends State<_AnimatedMicIcon>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: Tween(
        begin: 0.8,
        end: 1.0,
      ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut)),
      child: const Icon(Icons.mic, size: 50, color: kGold),
    );
  }
}
