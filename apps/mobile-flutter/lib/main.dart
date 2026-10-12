import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/home_screen.dart';
import 'screens/butler/butler_screen.dart';
import 'screens/silence/silence_screen.dart';
import 'providers/starknet_provider.dart';
import 'providers/recordings_provider.dart';
import 'providers/butler_provider.dart';
import 'providers/silence_provider.dart';
import 'services/ipfs_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(const VoisssButlerApp());
}

/// Shared app theme — dark, cinematic, Space Grotesk display + Inter body.
ThemeData buildVoisssTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: const Color(0xFF7C5DFA),
    brightness: Brightness.dark,
  );
  final base = ThemeData(brightness: Brightness.dark);
  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    scaffoldBackgroundColor: const Color(0xFF0B0A12),
    textTheme: _withEmojiFallback(
      GoogleFonts.interTextTheme(base.textTheme).copyWith(
      displayMedium: GoogleFonts.spaceGrotesk(
        fontSize: 40,
        fontWeight: FontWeight.w700,
        color: Colors.white,
        letterSpacing: -1,
      ),
      headlineSmall: GoogleFonts.spaceGrotesk(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        color: Colors.white,
        letterSpacing: -0.5,
      ),
      titleLarge: GoogleFonts.spaceGrotesk(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
    ),
    cardTheme: CardThemeData(
      color: const Color(0xFF16131F),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF16131F),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
    ),
  );
}

/// Ensures emoji (😂🔥💀, 🤖) resolve to the bundled Noto Color Emoji when
/// canvaskit can't fetch its own Noto set — e.g. blocked fonts CDN.
TextTheme _withEmojiFallback(TextTheme theme) {
  TextStyle? f(TextStyle? s) =>
      s?.copyWith(fontFamilyFallback: const ['NotoColorEmoji']);
  return theme.copyWith(
    displayLarge: f(theme.displayLarge),
    displayMedium: f(theme.displayMedium),
    displaySmall: f(theme.displaySmall),
    headlineLarge: f(theme.headlineLarge),
    headlineMedium: f(theme.headlineMedium),
    headlineSmall: f(theme.headlineSmall),
    titleLarge: f(theme.titleLarge),
    titleMedium: f(theme.titleMedium),
    titleSmall: f(theme.titleSmall),
    bodyLarge: f(theme.bodyLarge),
    bodyMedium: f(theme.bodyMedium),
    bodySmall: f(theme.bodySmall),
    labelLarge: f(theme.labelLarge),
    labelMedium: f(theme.labelMedium),
    labelSmall: f(theme.labelSmall),
  );
}

/// Root app with splash screen
class VoisssButlerApp extends StatelessWidget {
  const VoisssButlerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VOISSS',
      debugShowCheckedModeBanner: false,
      theme: buildVoisssTheme(),
      home: const SplashScreen(),
    );
  }
}

/// Main app with providers
class VoisssApp extends StatelessWidget {
  const VoisssApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => StarknetProvider()),
        ChangeNotifierProvider(create: (_) => ButlerProvider()),
        ChangeNotifierProvider(create: (_) => SilenceProvider()),
        ChangeNotifierProvider(
          create: (_) {
            final recordingsProvider = RecordingsProvider();

            // Initialize IPFS service with Pinata configuration
            final ipfsConfig = IPFSConfig(
              provider: 'pinata',
              apiKey: '1cceb4d49bc293158533',
              apiSecret: 'b5b9cc59fa5235fb0005b5f513c83dbb552c0a3a195d282b7033bc7484e9e295',
              gatewayUrl: 'https://gateway.pinata.cloud/ipfs/',
            );

            recordingsProvider.initializeIPFS(ipfsConfig);

            return recordingsProvider;
          },
        ),
      ],
      child: MaterialApp(
        title: 'VOISSS — Voice the Silence',
        theme: buildVoisssTheme(),
        home: const MainNavigationScreen(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

/// Main navigation screen with bottom nav bar
class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const SilenceScreen(),
    const HomeScreen(),
    const ButlerScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.videocam_outlined),
            selectedIcon: Icon(Icons.videocam),
            label: 'Silence',
          ),
          NavigationDestination(
            icon: Icon(Icons.mic_none),
            selectedIcon: Icon(Icons.mic),
            label: 'Studio',
          ),
          NavigationDestination(
            icon: Icon(Icons.assistant_outlined),
            selectedIcon: Icon(Icons.assistant),
            label: 'Butler',
          ),
        ],
      ),
    );
  }
}
