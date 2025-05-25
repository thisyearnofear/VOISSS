import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/starknet_provider.dart';

class AccountAddress extends StatelessWidget {
  const AccountAddress({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<StarknetProvider>(
      builder: (context, starknet, child) {
        if (!starknet.isConnected || starknet.accountAddress == null) {
          return const SizedBox.shrink();
        }

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Colors.green.withOpacity(0.3),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.check_circle,
                      color: Colors.green,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Wallet Connected',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => _copyAddress(context, starknet.accountAddress!),
                    icon: const Icon(
                      Icons.copy,
                      color: Colors.grey,
                      size: 20,
                    ),
                    tooltip: 'Copy Address',
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              Text(
                'Address:',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[400],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              
              Text(
                _formatAddress(starknet.accountAddress!),
                style: const TextStyle(
                  fontSize: 14,
                  fontFamily: 'monospace',
                  color: Colors.white,
                ),
              ),
              
              const SizedBox(height: 12),
              
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF7C5DFA).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'Starknet Sepolia',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF7C5DFA),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const Spacer(),
                  
                  FutureBuilder<String?>(
                    future: starknet.getBalance(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.grey),
                          ),
                        );
                      }
                      
                      if (snapshot.hasData && snapshot.data != null) {
                        return Text(
                          '${_formatBalance(snapshot.data!)} ETH',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[400],
                          ),
                        );
                      }
                      
                      return Text(
                        'Balance: --',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[400],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatAddress(String address) {
    if (address.length <= 12) return address;
    return '${address.substring(0, 6)}...${address.substring(address.length - 6)}';
  }

  String _formatBalance(String balance) {
    try {
      final balanceInt = BigInt.parse(balance);
      final balanceEth = balanceInt / BigInt.from(10).pow(18);
      return balanceEth.toStringAsFixed(4);
    } catch (e) {
      return '0.0000';
    }
  }

  void _copyAddress(BuildContext context, String address) {
    Clipboard.setData(ClipboardData(text: address));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Address copied to clipboard'),
        duration: Duration(seconds: 2),
      ),
    );
  }
}
