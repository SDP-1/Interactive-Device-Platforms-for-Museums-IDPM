import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;
import 'package:mobile_ai_guide/ui/content_language.dart';
import 'package:mobile_ai_guide/ui/chat_language.dart';
import 'package:mobile_ai_guide/ui/font_scale.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _showFontSlider = false;
  bool _showContentLanguage = false;
  bool _showChatLanguage = false;
  double _fontScale = AppFontScale.instance.value;

  void _toggleContentLanguage() {
    setState(() => _showContentLanguage = !_showContentLanguage);
  }

  void _toggleChatLanguage() {
    setState(() => _showChatLanguage = !_showChatLanguage);
  }

  void _toggleFontSlider() {
    setState(() => _showFontSlider = !_showFontSlider);
  }

  void _onFontScaleChanged(double value) {
    setState(() => _fontScale = value);
    AppFontScale.instance.setScale(value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: app.kCream,
      appBar: AppBar(
        backgroundColor: app.kCream,
        elevation: 0,
        centerTitle: false,
        leadingWidth: 64,
        leading: Padding(
          padding: const EdgeInsets.only(left: 12),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: app.kCardShadow,
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back),
              color: Colors.black87,
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),
        ),
        title: const Text(
          'Settings',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Colors.black87,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          _SectionCard(
            title: 'Preferences',
            subtitle: 'Customize your museum experience',
            tiles: [
              const _SettingsTile(
                icon: Icons.credit_card,
                title: 'App Language',
                subtitle: 'English',
              ),
              _ChatLanguageSettingTile(
                isExpanded: _showChatLanguage,
                onToggle: _toggleChatLanguage,
              ),
              _ContentLanguageSettingTile(
                isExpanded: _showContentLanguage,
                onToggle: _toggleContentLanguage,
              ),
              const _SettingsTile(
                icon: Icons.volume_up_outlined,
                title: 'Audio Settings',
                subtitle: 'Voice & Sound',
              ),
              const _SettingsTile(
                icon: Icons.shield_outlined,
                title: 'GPS Security Info',
                subtitle: 'Privacy & Location',
              ),
              _FontSizeSettingTile(
                isExpanded: _showFontSlider,
                scale: _fontScale,
                onToggle: _toggleFontSlider,
                onChanged: _onFontScaleChanged,
              ),
            ],
          ),
          const SizedBox(height: 16),
          const _AboutCard(),
        ],
      ),
    );
  }
}

class _ContentLanguageSettingTile extends StatelessWidget {
  const _ContentLanguageSettingTile({
    required this.isExpanded,
    required this.onToggle,
  });

  final bool isExpanded;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppContentLanguage.instance.notifier,
      builder: (context, language, _) {
        return Column(
          children: [
            InkWell(
              onTap: onToggle,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 12,
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: app.kGold.withOpacity(0.16),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.menu_book_outlined,
                        color: app.kGold,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Content Language',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            AppContentLanguage.labelFor(language),
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      isExpanded ? Icons.expand_less : Icons.expand_more,
                      color: Colors.black38,
                    ),
                  ],
                ),
              ),
            ),
            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: app.kWarmPanel,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Select Content Language',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _LanguageOptionTile(
                        label: 'English (Default)',
                        language: 'en',
                        groupValue: language,
                        onSelect: (value) {
                          AppContentLanguage.instance.setLanguage(value);
                        },
                      ),
                      _LanguageOptionTile(
                        label: 'Sinhala',
                        language: 'si',
                        groupValue: language,
                        onSelect: (value) {
                          AppContentLanguage.instance.setLanguage(value);
                        },
                      ),
                    ],
                  ),
                ),
              ),
              crossFadeState: isExpanded
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 200),
            ),
          ],
        );
      },
    );
  }
}

class _ChatLanguageSettingTile extends StatelessWidget {
  const _ChatLanguageSettingTile({
    required this.isExpanded,
    required this.onToggle,
  });

  final bool isExpanded;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppChatLanguage.instance.notifier,
      builder: (context, language, _) {
        return Column(
          children: [
            InkWell(
              onTap: onToggle,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 12,
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: app.kGold.withOpacity(0.16),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.chat_bubble_outline,
                        color: app.kGold,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Chat Language',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            AppChatLanguage.labelFor(language),
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      isExpanded ? Icons.expand_less : Icons.expand_more,
                      color: Colors.black38,
                    ),
                  ],
                ),
              ),
            ),
            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: app.kWarmPanel,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Select Chat Language',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _LanguageOptionTile(
                        label: 'English (Default)',
                        language: 'en',
                        groupValue: language,
                        onSelect: (value) {
                          AppChatLanguage.instance.setLanguage(value);
                        },
                      ),
                      _LanguageOptionTile(
                        label: 'Sinhala',
                        language: 'si',
                        groupValue: language,
                        onSelect: (value) {
                          AppChatLanguage.instance.setLanguage(value);
                        },
                      ),
                    ],
                  ),
                ),
              ),
              crossFadeState: isExpanded
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 200),
            ),
          ],
        );
      },
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.subtitle,
    required this.tiles,
  });

  final String title;
  final String subtitle;
  final List<Widget> tiles;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: app.kCardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.black54,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, thickness: 1, color: app.kDivider),
          ..._buildTiles(),
        ],
      ),
    );
  }

  List<Widget> _buildTiles() {
    final List<Widget> widgets = [];
    for (var i = 0; i < tiles.length; i++) {
      widgets.add(tiles[i]);
      if (i != tiles.length - 1) {
        widgets.add(
          const Divider(height: 1, thickness: 1, color: app.kDivider),
        );
      }
    }
    return widgets;
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: app.kGold.withOpacity(0.16),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: app.kGold, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 12, color: Colors.black54),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.black38),
          ],
        ),
      ),
    );
  }
}

class _LanguageOptionTile extends StatelessWidget {
  const _LanguageOptionTile({
    required this.label,
    required this.language,
    required this.groupValue,
    required this.onSelect,
  });

  final String label;
  final String language;
  final String groupValue;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: () => onSelect(language),
      leading: Radio<String>(
        value: language,
        groupValue: groupValue,
        activeColor: app.kGold,
        onChanged: (value) {
          if (value != null) {
            onSelect(value);
          }
        },
      ),
      title: Text(
        label,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Colors.black87,
        ),
      ),
    );
  }
}

class _FontSizeSettingTile extends StatelessWidget {
  const _FontSizeSettingTile({
    required this.isExpanded,
    required this.scale,
    required this.onToggle,
    required this.onChanged,
  });

  final bool isExpanded;
  final double scale;
  final VoidCallback onToggle;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        InkWell(
          onTap: onToggle,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: app.kGold.withOpacity(0.16),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.text_fields,
                    color: app.kGold,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Font Size',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${(scale * 100).round()}%',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.black54,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  isExpanded ? Icons.expand_less : Icons.expand_more,
                  color: Colors.black38,
                ),
              ],
            ),
          ),
        ),
        AnimatedCrossFade(
          firstChild: const SizedBox.shrink(),
          secondChild: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: app.kWarmPanel,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Smaller',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.black54,
                            ),
                          ),
                          Text(
                            '${(scale * 100).round()}%',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Colors.black87,
                            ),
                          ),
                          const Text(
                            'Larger',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.black54,
                            ),
                          ),
                        ],
                      ),
                      Slider(
                        value: scale,
                        onChanged: onChanged,
                        min: 0.85,
                        max: 1.3,
                        divisions: 9,
                        activeColor: app.kGold,
                        inactiveColor: app.kGold.withOpacity(0.3),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          crossFadeState: isExpanded
              ? CrossFadeState.showSecond
              : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 200),
        ),
      ],
    );
  }
}

class _AboutCard extends StatelessWidget {
  const _AboutCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: app.kCardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text(
            'About',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Colors.black87,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Museum Guide v2.1.0',
            style: TextStyle(fontSize: 12, color: Colors.black54),
          ),
          SizedBox(height: 6),
          Text(
            '© 2024 Museum Foundation',
            style: TextStyle(fontSize: 12, color: Colors.black54),
          ),
        ],
      ),
    );
  }
}
