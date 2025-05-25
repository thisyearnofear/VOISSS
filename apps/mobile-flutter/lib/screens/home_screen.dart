import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/starknet_provider.dart';
import '../providers/recordings_provider.dart';
import '../widgets/wallet_selector.dart';
import '../widgets/account_address.dart';
import '../widgets/recording_button.dart';
import '../widgets/recordings_list.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Load saved Starknet connection state
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<StarknetProvider>().loadSavedState();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'VOISSS Flutter',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 24,
          ),
        ),
        centerTitle: true,
        elevation: 0,
        actions: [
          Consumer<StarknetProvider>(
            builder: (context, starknet, child) {
              if (starknet.isConnected) {
                return IconButton(
                  icon: const Icon(Icons.account_balance_wallet),
                  onPressed: () => _showWalletInfo(context),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              // Starknet Connection Section
              Consumer<StarknetProvider>(
                builder: (context, starknet, child) {
                  if (!starknet.isConnected) {
                    return const WalletSelector();
                  }
                  return const AccountAddress();
                },
              ),
              
              const SizedBox(height: 24),
              
              // Recording Section
              const RecordingButton(),
              
              const SizedBox(height: 24),
              
              // Recordings List
              const Expanded(
                child: RecordingsList(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showWalletInfo(BuildContext context) {
    final starknet = context.read<StarknetProvider>();
    
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Wallet Information',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            
            Text(
              'Address:',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[400],
              ),
            ),
            const SizedBox(height: 4),
            Text(
              starknet.accountAddress ?? 'Unknown',
              style: const TextStyle(
                fontSize: 12,
                fontFamily: 'monospace',
                color: Colors.white,
              ),
            ),
            
            const SizedBox(height: 24),
            
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  starknet.disconnectWallet();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red[600],
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('Disconnect Wallet'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
