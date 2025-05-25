import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/starknet_provider.dart';

class WalletSelector extends StatelessWidget {
  const WalletSelector({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<StarknetProvider>(
      builder: (context, starknet, child) {
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: const Color(0xFF7C5DFA).withOpacity(0.3),
              width: 1,
            ),
          ),
          child: Column(
            children: [
              const Icon(
                Icons.account_balance_wallet_outlined,
                size: 48,
                color: Color(0xFF7C5DFA),
              ),
              const SizedBox(height: 16),
              
              const Text(
                'Connect Your Starknet Wallet',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              
              Text(
                'Connect your wallet to store recordings on Starknet blockchain',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[400],
                ),
                textAlign: TextAlign.center,
              ),
              
              if (starknet.error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red[900]?.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: Colors.red[600]!,
                      width: 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.error_outline,
                        color: Colors.red[400],
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          starknet.error!,
                          style: TextStyle(
                            color: Colors.red[400],
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              
              const SizedBox(height: 20),
              
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: starknet.isConnecting 
                    ? null 
                    : () => _connectWallet(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7C5DFA),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: starknet.isConnecting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'Connect Wallet',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                ),
              ),
              
              const SizedBox(height: 12),
              
              Text(
                'Supported: ArgentX • Braavos • Demo Mode',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _connectWallet(BuildContext context) async {
    final starknet = context.read<StarknetProvider>();
    
    try {
      await starknet.connectWallet();
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Wallet connected successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to connect wallet: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
