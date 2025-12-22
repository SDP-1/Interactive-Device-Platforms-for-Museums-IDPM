import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;
import 'package:mobile_ai_guide/pages/landing_page.dart';
import 'package:mobile_ai_guide/ui/font_scale.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<double>(
      valueListenable: AppFontScale.instance.notifier,
      builder: (context, scale, _) {
        final lightTheme = ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: app.kGold,
            brightness: Brightness.light,
          ),
          scaffoldBackgroundColor: app.kCream,
          useMaterial3: true,
        );

        final darkScheme = ColorScheme.fromSeed(
          seedColor: app.kGold,
          brightness: Brightness.dark,
        ).copyWith(background: app.kDarkBg, surface: app.kDarkSurface);

        final darkTheme = ThemeData(
          useMaterial3: true,
          colorScheme: darkScheme,
          scaffoldBackgroundColor: app.kDarkBg,
          canvasColor: app.kDarkBg,
          cardColor: app.kDarkCard,
          dividerColor: app.kDarkDivider,
          appBarTheme: const AppBarTheme(
            backgroundColor: app.kDarkSurface,
            foregroundColor: app.kDarkOnSurface,
            elevation: 0,
          ),
          textTheme: ThemeData.dark().textTheme.apply(
            bodyColor: app.kDarkOnBg,
            displayColor: app.kDarkOnBg,
          ),
        );

        return MaterialApp(
          title: 'AI Museum Guide',
          debugShowCheckedModeBanner: false,
          theme: lightTheme,
          darkTheme: darkTheme,
          builder: (context, child) {
            final media = MediaQuery.of(context);
            return MediaQuery(
              data: media.copyWith(textScaleFactor: scale),
              child: child!,
            );
          },
          home: const LandingPage(),
        );
      },
    );
  }
}

// Pages moved to lib/pages.
