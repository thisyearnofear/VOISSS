import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/home_screen.dart';
import 'providers/starknet_provider.dart';
import 'providers/recordings_provider.dart';
import 'services/ipfs_service.dart';

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
        ChangeNotifierProvider(
          create: (_) {
            final recordingsProvider = RecordingsProvider();

            // Initialize IPFS service with Pinata configuration
            // Using the same credentials as the web app for cross-platform compatibility
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
