import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;
import 'package:mobile_ai_guide/pages/home_page.dart';

class LandingPage extends StatefulWidget {
  const LandingPage({super.key});

  @override
  State<LandingPage> createState() => _LandingPageState();
}

class _LandingPageState extends State<LandingPage> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => const HomePage()));
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final headerHeight = size.height * 0.42;

    return Scaffold(
      body: Column(
        children: [
          SizedBox(
            height: headerHeight,
            width: double.infinity,
            child: Stack(
              fit: StackFit.expand,
              children: [
                DecoratedBox(
                  decoration: BoxDecoration(
                    image: DecorationImage(
                      image: const NetworkImage(
                        'https://th.bing.com/th/id/R.b87a2d5fac63b62cf18c8b44e2eadbb7?rik=uqaTodmu3VutIg&pid=ImgRaw&r=0',
                      ),
                      fit: BoxFit.cover,
                      alignment: Alignment.topCenter,
                    ),
                  ),
                ),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        app.kOverlayStrong,
                        app.kOverlayMedium,
                        app.kOverlayLight,
                      ],
                    ),
                  ),
                ),
                Align(
                  alignment: Alignment.topCenter,
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 16.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          _LandingEmblem(),
                          SizedBox(height: 16),
                          Text(
                            'AI Museum Guide',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              height: 1.2,
                            ),
                          ),
                          SizedBox(height: 8),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _Tag(text: 'Scan'),
                              _Bullet(),
                              _Tag(text: 'Learn'),
                              _Bullet(),
                              _Tag(text: 'Ask'),
                            ],
                          ),
                          SizedBox(height: 24),
                          _DotsIndicator(activeIndex: 1, count: 3),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Container(width: double.infinity, color: app.kDeepBrown),
          ),
        ],
      ),
    );
  }
}

class _LandingEmblem extends StatelessWidget {
  const _LandingEmblem();
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: app.kGold, width: 2),
        color: Colors.black.withValues(alpha: 0.35),
      ),
      child: const Center(
        child: Icon(Icons.account_balance, color: app.kGold, size: 28),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag({required this.text});
  final String text;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6.0),
      child: Text(
        text,
        style: const TextStyle(
          color: app.kGold,
          fontWeight: FontWeight.w600,
          fontSize: 13,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}

class _Bullet extends StatelessWidget {
  const _Bullet();
  @override
  Widget build(BuildContext context) {
    return const Text(
      ' • ',
      style: TextStyle(color: app.kGold, fontWeight: FontWeight.w600),
    );
  }
}

class _DotsIndicator extends StatelessWidget {
  const _DotsIndicator({required this.activeIndex, required this.count});
  final int activeIndex;
  final int count;
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(count, (i) {
        final isActive = i == activeIndex;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          margin: const EdgeInsets.symmetric(horizontal: 4),
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: isActive ? app.kGold : Colors.white30,
            shape: BoxShape.circle,
          ),
        );
      }),
    );
  }
}
