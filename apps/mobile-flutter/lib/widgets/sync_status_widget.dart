import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/starknet_provider.dart';
import '../providers/recordings_provider.dart';

class SyncStatusWidget extends StatefulWidget {
  const SyncStatusWidget({super.key});

  @override
  State<SyncStatusWidget> createState() => _SyncStatusWidgetState();
}

class _SyncStatusWidgetState extends State<SyncStatusWidget> {
  bool _isSyncing = false;
  DateTime? _lastSync;

  @override
  Widget build(BuildContext context) {
    return Consumer2<StarknetProvider, RecordingsProvider>(
      builder: (context, starknet, recordings, child) {
        if (!starknet.isConnected) {
          return _buildOfflineCard();
        }

        return _buildSyncCard(starknet, recordings);
      },
    );
  }

  Widget _buildOfflineCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.1),
        border: Border.all(color: Colors.orange.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: Colors.orange,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Offline Mode',
                  style: TextStyle(
                    color: Colors.orange,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                Text(
                  'Connect wallet to sync across devices',
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSyncCard(StarknetProvider starknet, RecordingsProvider recordings) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Cross-Platform Sync',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Online',
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Sync Stats
          Column(
            children: [
              _buildStatRow('Last sync:', _formatLastSync(_lastSync)),
              const SizedBox(height: 8),
              _buildStatRow('Total recordings:', '${recordings.recordings.length}'),
              const SizedBox(height: 8),
              _buildStatRow('Wallet:', _formatAddress(starknet.accountAddress)),
            ],
          ),

          const SizedBox(height: 16),

          // Sync Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSyncing ? null : () => _syncWithBlockchain(starknet),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C5DFA),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: _isSyncing
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text('Syncing...'),
                      ],
                    )
                  : Text('Sync Now'),
            ),
          ),

          const SizedBox(height: 16),

          // How it works
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'How it works:',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                ...[
                  '• Recordings stored on Starknet blockchain',
                  '• Audio files stored on IPFS for decentralization',
                  '• Access from any device with your wallet',
                  '• Automatic sync when online',
                ].map((text) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(
                    text,
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 12,
                    ),
                  ),
                )),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Device Indicators
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildDeviceIndicator('🌐', 'Web', Colors.blue),
              _buildConnector(),
              _buildDeviceIndicator('📱', 'Flutter', Colors.purple),
              _buildConnector(),
              _buildDeviceIndicator('⛓️', 'Starknet', Colors.green),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[400],
            fontSize: 14,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: Colors.white,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildDeviceIndicator(String emoji, String label, Color color) {
    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              emoji,
              style: TextStyle(fontSize: 16),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[400],
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  Widget _buildConnector() {
    return Container(
      width: 24,
      height: 2,
      color: Colors.grey[600],
      margin: const EdgeInsets.only(bottom: 16),
    );
  }

  String _formatLastSync(DateTime? date) {
    if (date == null) return 'Never';
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inMinutes < 1) return 'Just now';
    if (difference.inMinutes < 60) return '${difference.inMinutes}m ago';
    if (difference.inHours < 24) return '${difference.inHours}h ago';
    return '${date.day}/${date.month}';
  }

  String _formatAddress(String? address) {
    if (address == null) return 'Not connected';
    if (address.length <= 10) return address;
    return '${address.substring(0, 6)}...${address.substring(address.length - 4)}';
  }

  Future<void> _syncWithBlockchain(StarknetProvider starknet) async {
    setState(() {
      _isSyncing = true;
    });

    try {
      // Simulate blockchain sync
      // In real implementation, this would:
      // 1. Query VoiceStorage contract for user's recordings
      // 2. Compare with local storage
      // 3. Download missing recordings from IPFS
      // 4. Upload pending local recordings

      await Future.delayed(const Duration(seconds: 2));

      setState(() {
        _lastSync = DateTime.now();
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Sync completed successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Sync failed: ${error.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSyncing = false;
        });
      }
    }
  }
}
