import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/recordings_provider.dart';
import '../providers/starknet_provider.dart';
import '../models/recording.dart';

class RecordingsList extends StatelessWidget {
  const RecordingsList({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<RecordingsProvider>(
      builder: (context, recordings, child) {
        if (recordings.recordings.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.mic_none,
                  size: 64,
                  color: Colors.grey[600],
                ),
                const SizedBox(height: 16),
                Text(
                  'No recordings yet',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey[400],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Tap the microphone to start recording',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Recordings (${recordings.recordings.length})',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            
            Expanded(
              child: ListView.builder(
                itemCount: recordings.recordings.length,
                itemBuilder: (context, index) {
                  final recording = recordings.recordings[index];
                  return RecordingTile(
                    recording: recording,
                    isPlaying: recordings.currentlyPlaying == recording.id,
                    onPlay: () => recordings.playRecording(recording.id),
                    onDelete: () => _showDeleteDialog(context, recording),
                    onStoreOnChain: () => _storeOnStarknet(context, recording),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }

  void _showDeleteDialog(BuildContext context, Recording recording) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Delete Recording',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          'Are you sure you want to delete "${recording.title}"?',
          style: TextStyle(color: Colors.grey[400]),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<RecordingsProvider>().deleteRecording(recording.id);
            },
            child: const Text(
              'Delete',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _storeOnStarknet(BuildContext context, Recording recording) async {
    final starknet = context.read<StarknetProvider>();
    
    if (!starknet.isConnected) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please connect your wallet first'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    try {
      // Show loading dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const AlertDialog(
          backgroundColor: Color(0xFF1A1A1A),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text(
                'Storing on Starknet...',
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
        ),
      );

      await starknet.storeRecordingMetadata(
        title: recording.title,
        duration: recording.duration.inSeconds,
        tags: recording.tags,
        ipfsHash: 'QmExample...', // In real app, upload to IPFS first
      );

      if (context.mounted) {
        Navigator.pop(context); // Close loading dialog
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Recording metadata stored on Starknet!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context); // Close loading dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to store on Starknet: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

class RecordingTile extends StatelessWidget {
  final Recording recording;
  final bool isPlaying;
  final VoidCallback onPlay;
  final VoidCallback onDelete;
  final VoidCallback onStoreOnChain;

  const RecordingTile({
    super.key,
    required this.recording,
    required this.isPlaying,
    required this.onPlay,
    required this.onDelete,
    required this.onStoreOnChain,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.grey.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  recording.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
              IconButton(
                onPressed: onPlay,
                icon: Icon(
                  isPlaying ? Icons.pause : Icons.play_arrow,
                  color: const Color(0xFF7C5DFA),
                ),
              ),
              PopupMenuButton(
                icon: const Icon(Icons.more_vert, color: Colors.grey),
                color: const Color(0xFF2A2A2A),
                itemBuilder: (context) => [
                  PopupMenuItem(
                    onTap: onStoreOnChain,
                    child: const Row(
                      children: [
                        Icon(Icons.cloud_upload, color: Colors.white),
                        SizedBox(width: 8),
                        Text('Store on Starknet', style: TextStyle(color: Colors.white)),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    onTap: onDelete,
                    child: const Row(
                      children: [
                        Icon(Icons.delete, color: Colors.red),
                        SizedBox(width: 8),
                        Text('Delete', style: TextStyle(color: Colors.red)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          
          const SizedBox(height: 8),
          
          Row(
            children: [
              Text(
                recording.formattedDuration,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[400],
                ),
              ),
              const SizedBox(width: 16),
              Text(
                recording.formattedFileSize,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[400],
                ),
              ),
              const Spacer(),
              Text(
                recording.formattedDate,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
          
          if (recording.starknetTxHash != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.2),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'Stored on Starknet',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.green,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
