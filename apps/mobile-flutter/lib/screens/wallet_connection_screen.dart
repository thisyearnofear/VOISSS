import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/starknet_provider.dart';

class WalletConnectionScreen extends StatelessWidget {
  const WalletConnectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Connect Wallet'),
        backgroundColor: const Color(0xFF1A1A1A),
      ),
      backgroundColor: const Color(0xFF0A0A0A),
      body: Consumer<StarknetProvider>(
        builder: (context, starknet, child) {
          if (starknet.isConnected) {
            return _buildConnectedView(context, starknet);
          } else {
            return _buildConnectionView(context, starknet);
          }
        },
      ),
    );
  }

  Widget _buildConnectionView(BuildContext context, StarknetProvider starknet) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // VOISSS Logo/Icon
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF7C5DFA),
                  const Color(0xFF3B82F6),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: const Icon(
              Icons.account_balance_wallet,
              size: 60,
              color: Colors.white,
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Title
          const Text(
            'Connect to Starknet',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 16),
          
          // Description
          Text(
            'Connect your Starknet wallet to store recordings on-chain and access decentralized features',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[400],
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 48),
          
          // Network Selector
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF2A2A2A)),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.language,
                  color: Color(0xFF7C5DFA),
                ),
                const SizedBox(width: 12),
                Text(
                  'Network: ${starknet.network?.toUpperCase() ?? 'SEPOLIA'}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                if (starknet.network == 'sepolia')
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'TESTNET',
                      style: TextStyle(
                        color: Colors.orange,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Connection Options
          Column(
            children: [
              // Development Account (for demo)
              _buildConnectionButton(
                context: context,
                title: 'Development Account',
                subtitle: 'For hackathon demo purposes',
                icon: Icons.code,
                onTap: starknet.isConnecting ? null : () => starknet.connectWallet(),
                isPrimary: true,
              ),
              
              const SizedBox(height: 16),
              
              // ArgentX Wallet
              _buildConnectionButton(
                context: context,
                title: 'ArgentX Wallet',
                subtitle: 'Connect with ArgentX mobile app',
                icon: Icons.account_balance_wallet,
                onTap: () => starknet.connectArgentXWallet(),
                isPrimary: false,
              ),
              
              const SizedBox(height: 16),
              
              // Braavos Wallet
              _buildConnectionButton(
                context: context,
                title: 'Braavos Wallet',
                subtitle: 'Connect with Braavos mobile app',
                icon: Icons.security,
                onTap: () => starknet.connectBraavosWallet(),
                isPrimary: false,
              ),
            ],
          ),
          
          if (starknet.isConnecting) ...[
            const SizedBox(height: 32),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF7C5DFA)),
            ),
            const SizedBox(height: 16),
            const Text(
              'Connecting to Starknet...',
              style: TextStyle(color: Colors.white),
            ),
          ],
          
          if (starknet.error != null) ...[
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error, color: Colors.red),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      starknet.error!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildConnectedView(BuildContext context, StarknetProvider starknet) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Success Icon
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.green.withOpacity(0.2),
              border: Border.all(color: Colors.green, width: 2),
            ),
            child: const Icon(
              Icons.check_circle,
              size: 60,
              color: Colors.green,
            ),
          ),
          
          const SizedBox(height: 32),
          
          const Text(
            'Wallet Connected!',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          
          const SizedBox(height: 16),
          
          Text(
            'You can now store recordings on Starknet',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[400],
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Account Info
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF2A2A2A)),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.account_circle,
                      color: Color(0xFF7C5DFA),
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Account Address',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2A2A2A),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    starknet.accountAddress ?? 'Unknown',
                    style: const TextStyle(
                      color: Colors.white,
                      fontFamily: 'monospace',
                      fontSize: 12,
                    ),
                  ),
                ),
                
                const SizedBox(height: 20),
                
                Row(
                  children: [
                    const Icon(
                      Icons.language,
                      color: Color(0xFF7C5DFA),
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Network: ${starknet.network?.toUpperCase() ?? 'SEPOLIA'}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Action Buttons
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF22C55E),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Start Recording',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => starknet.disconnectWallet(),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Disconnect',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildConnectionButton({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback? onTap,
    required bool isPrimary,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isPrimary ? const Color(0xFF7C5DFA) : const Color(0xFF1A1A1A),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isPrimary ? const Color(0xFF7C5DFA) : const Color(0xFF2A2A2A),
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isPrimary ? Colors.white : const Color(0xFF7C5DFA),
              size: 32,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: isPrimary ? Colors.white : Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 14,
                      color: isPrimary ? Colors.white.withOpacity(0.8) : Colors.grey[400],
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              color: isPrimary ? Colors.white : Colors.grey[400],
              size: 16,
            ),
          ],
        ),
      ),
    );
  }
}
