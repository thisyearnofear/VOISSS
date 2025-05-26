import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/starknet_provider.dart';
import '../providers/recordings_provider.dart';
import '../services/sync_service.dart';

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
          // Compact Header with Sync Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Left side - Status info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
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
                        const SizedBox(width: 8),
                        Text(
                          'Cross-Platform Sync',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Last sync: ${_formatLastSync(_lastSync)}',
                      style: TextStyle(
                        color: Colors.grey[400],
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),

              // Right side - Sync button
              ElevatedButton(
                onPressed: _isSyncing ? null : () => _syncWithBlockchain(starknet),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7C5DFA),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6),
                  ),
                  minimumSize: Size(80, 32),
                ),
                child: _isSyncing
                    ? SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        'Sync',
                        style: TextStyle(fontSize: 12),
                      ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Device Indicators (compact)
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
      // Get recordings provider from context
      final recordings = context.read<RecordingsProvider>();

      // Initialize sync service if not already done
      recordings.initializeSync(starknet);

      // Perform real sync with blockchain and IPFS
      final syncResult = await recordings.performSync();

      if (syncResult != null) {
        setState(() {
          _lastSync = syncResult.lastSync ?? DateTime.now();
        });

        if (mounted) {
          final message = syncResult.status == SyncStatus.success
              ? '✅ Sync completed: ${syncResult.recordingsDownloaded ?? 0} downloaded, ${syncResult.recordingsUploaded ?? 0} uploaded'
              : '❌ ${syncResult.message ?? 'Sync failed'}';

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: syncResult.status == SyncStatus.success ? Colors.green : Colors.red,
            ),
          );
        }
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
