import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/home_screen.dart';
import 'providers/starknet_provider.dart';
import 'providers/recordings_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(const VoisssApp());
}

class VoisssApp extends StatelessWidget {
  const VoisssApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => StarknetProvider()),
        ChangeNotifierProvider(create: (_) => RecordingsProvider()),
      ],
      child: MaterialApp(
        title: 'VOISSS Flutter',
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
          ),
        ),
        home: const HomeScreen(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
