import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/models/persona.dart';
import 'package:mobile_ai_guide/services/persona_service.dart';
import 'package:mobile_ai_guide/services/session_access_service.dart';
import 'package:mobile_ai_guide/ui/colors.dart';
import 'package:mobile_ai_guide/ui/chat_language.dart';
import 'package:mobile_ai_guide/pages/ai_persona_chat_page.dart';
import 'package:mobile_ai_guide/widgets/common/session_guard.dart';
import 'package:mobile_ai_guide/widgets/navigation/app_bottom_navigation.dart';
import 'package:mobile_ai_guide/widgets/navigation/bottom_navigation_mixin.dart';

class PersonaListPage extends StatefulWidget {
  const PersonaListPage({super.key});

  @override
  State<PersonaListPage> createState() => _PersonaListPageState();
}

class _PersonaListPageState extends State<PersonaListPage>
    with BottomNavigationMixin {
  late Future<List<Persona>> _personasFuture;
  String _chatLanguage = 'en';
  bool _sessionRedirectTriggered = false;

  @override
  void initState() {
    super.initState();
    _chatLanguage = AppChatLanguage.instance.value;
    _personasFuture = PersonaService.getPersonas(language: _chatLanguage);
    currentNavIndex = 3;
  }

  Future<void> _refreshPersonas() async {
    setState(() {
      _personasFuture = PersonaService.getPersonas(language: _chatLanguage);
    });
    await _personasFuture;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kCream,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Ancient King Personas',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
      ),
      body: FutureBuilder<List<Persona>>(
        future: _personasFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            if (snapshot.error is SessionAccessException &&
                !_sessionRedirectTriggered) {
              _sessionRedirectTriggered = true;
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (!mounted) return;
                final error = snapshot.error! as SessionAccessException;
                SessionGuard.redirectToSessionIntro(
                  context,
                  message: error.message,
                );
              });
              return const Center(child: CircularProgressIndicator());
            }

            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.red.shade300,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading personas',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Text(
                      'Please check your connection and try again.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: _refreshPersonas,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kGold,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 12,
                      ),
                    ),
                  ),
                ],
              ),
            );
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.person_off_outlined,
                    size: 64,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No personas found',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade800,
                    ),
                  ),
                ],
              ),
            );
          }

          final personas = snapshot.data!;
          return RefreshIndicator(
            onRefresh: _refreshPersonas,
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: _PersonasOverviewCard(totalPersonas: personas.length),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 20),
                  sliver: SliverList.builder(
                    itemCount: personas.length,
                    itemBuilder: (context, index) {
                      final persona = personas[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: _PersonaCard(
                          index: index + 1,
                          persona: persona,
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) =>
                                    AiPersonaChatPage(persona: persona),
                              ),
                            );
                          },
                          chatLanguage: _chatLanguage,
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: AppBottomNavigationBar(
        selectedIndex: currentNavIndex,
        onDestinationSelected: handleNavigation,
      ),
    );
  }
}

class _PersonasOverviewCard extends StatelessWidget {
  const _PersonasOverviewCard({required this.totalPersonas});

  final int totalPersonas;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 8),
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [kMuseumDeep, kDeepBrown.withValues(alpha: 0.95)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ancient King Personas',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Talk with legendary rulers and explore their stories, decisions, and cultural legacy.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.8),
              height: 1.35,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Available Personas',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.82),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '$totalPersonas',
                  style: const TextStyle(
                    color: kGoldLight,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PersonaCard extends StatelessWidget {
  const _PersonaCard({
    required this.index,
    required this.persona,
    required this.onTap,
    required this.chatLanguage,
  });

  final int index;
  final Persona persona;
  final VoidCallback onTap;
  final String chatLanguage;

  @override
  Widget build(BuildContext context) {
    final title = (chatLanguage == 'si') ? persona.nameSi : persona.nameEn;
    final capital = (chatLanguage == 'si')
        ? (persona.capitalSi ?? persona.capitalEn ?? '')
        : (persona.capitalEn ?? persona.capitalSi ?? '');
    final summary = (chatLanguage == 'si')
        ? (persona.biographySi ?? persona.description ?? '')
        : (persona.biographyEn ?? persona.description ?? '');

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      elevation: 1.5,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
                  child: SizedBox(
                    height: 150,
                    width: double.infinity,
                    child:
                        (persona.imageUrls != null &&
                            persona.imageUrls!.isNotEmpty)
                        ? Image.network(
                            persona.imageUrls!.first,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                color: kStoneSurface,
                                alignment: Alignment.center,
                                child: const Icon(
                                  Icons.account_circle_outlined,
                                  size: 46,
                                  color: kMuseumSubText,
                                ),
                              );
                            },
                          )
                        : Container(
                            color: kStoneSurface,
                            alignment: Alignment.center,
                            child: const Icon(
                              Icons.account_circle_outlined,
                              size: 46,
                              color: kMuseumSubText,
                            ),
                          ),
                  ),
                ),
                Positioned(
                  left: 10,
                  top: 10,
                  child: Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: kGold,
                      shape: BoxShape.circle,
                      boxShadow: kCardShadow,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '$index',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        color: Colors.black,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  right: 10,
                  top: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: const Text(
                      'AI Persona',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 17,
                      color: Colors.black,
                    ),
                  ),
                  if (capital.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(
                          Icons.location_city,
                          size: 14,
                          color: Colors.grey.shade700,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            capital,
                            style: TextStyle(
                              color: Colors.grey.shade700,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 6),
                  Text(
                    summary.isNotEmpty
                        ? summary
                        : 'Start a guided conversation with this historical persona.',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Colors.grey.shade700, height: 1.3),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(
                        Icons.chat_bubble_outline,
                        size: 15,
                        color: Colors.grey.shade700,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Interactive chat',
                        style: TextStyle(
                          color: Colors.grey.shade700,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      const Text(
                        'Start Chat',
                        style: TextStyle(
                          color: kStoneAccent,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 2),
                      const Icon(
                        Icons.arrow_forward,
                        size: 16,
                        color: kStoneAccent,
                      ),
                    ],
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
