import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/home_screen.dart';
import 'screens/butler/butler_screen.dart';
import 'providers/starknet_provider.dart';
import 'providers/recordings_provider.dart';
import 'providers/butler_provider.dart';
import 'services/ipfs_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(const VoisssButlerApp());
}

/// Root app with splash screen
class VoisssButlerApp extends StatelessWidget {
  const VoisssButlerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VOISSS Butler',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0A0A0A),
        primaryColor: const Color(0xFF7C5DFA),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF7C5DFA),
          secondary: Color(0xFF9B7BFF),
          surface: Color(0xFF1A1A1A),
          background: Color(0xFF0A0A0A),
        ),
      ),
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
        title: 'VOISSS Butler',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF7C5DFA),
            brightness: Brightness.dark,
          ),
          useMaterial3: true,
          scaffoldBackgroundColor: const Color(0xFF0A0A0A),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF1A1A1A),
            foregroundColor: Colors.white,
            elevation: 0,
          ),
          bottomNavigationBarTheme: const BottomNavigationBarThemeData(
            backgroundColor: Color(0xFF1A1A1A),
            selectedItemColor: Color(0xFF7C5DFA),
            unselectedItemColor: Colors.grey,
          ),
          cardTheme: CardTheme(
            color: const Color(0xFF1A1A1A),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
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
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A1A),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) => setState(() => _currentIndex = index),
            backgroundColor: Colors.transparent,
            elevation: 0,
            type: BottomNavigationBarType.fixed,
            items: [
              const BottomNavigationBarItem(
                icon: Icon(Icons.mic_none),
                activeIcon: Icon(Icons.mic),
                label: 'Recordings',
              ),
              BottomNavigationBarItem(
                icon: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: _currentIndex == 1
                        ? const Color(0xFF7C5DFA).withOpacity(0.2)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.assistant),
                ),
                activeIcon: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF7C5DFA).withOpacity(0.3),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.assistant),
                ),
                label: 'Butler',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
