import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/recordings_provider.dart';

class RecordingButton extends StatelessWidget {
  const RecordingButton({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<RecordingsProvider>(
      builder: (context, recordings, child) {
        return Column(
          children: [
            // Recording Duration Display
            if (recordings.isRecording) ...[
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.red.withOpacity(0.5),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatDuration(recordings.recordingDuration),
                      style: const TextStyle(
                        color: Colors.red,
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Recording Button with Enhanced Animation
            GestureDetector(
              onTap: recordings.isRecording
                ? () => _stopRecording(context)
                : () => _startRecording(context),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: recordings.isRecording ? 140 : 120,
                height: recordings.isRecording ? 140 : 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: recordings.isRecording
                    ? Colors.red
                    : const Color(0xFF7C5DFA),
                  boxShadow: [
                    BoxShadow(
                      color: (recordings.isRecording
                        ? Colors.red
                        : const Color(0xFF7C5DFA)).withOpacity(0.4),
                      blurRadius: recordings.isRecording ? 30 : 20,
                      spreadRadius: recordings.isRecording ? 10 : 5,
                    ),
                  ],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Pulse animation for recording
                    if (recordings.isRecording)
                      AnimatedContainer(
                        duration: const Duration(seconds: 1),
                        width: 160,
                        height: 160,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.red.withOpacity(0.3),
                            width: 2,
                          ),
                        ),
                      ),
                    // Main icon
                    Icon(
                      recordings.isRecording
                        ? Icons.stop_rounded
                        : Icons.mic_rounded,
                      size: recordings.isRecording ? 56 : 48,
                      color: Colors.white,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            Text(
              recordings.isRecording
                ? 'Tap to stop recording'
                : 'Tap to start recording',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[400],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        );
      },
    );
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  Future<void> _startRecording(BuildContext context) async {
    final recordings = context.read<RecordingsProvider>();

    try {
      await recordings.startRecording();
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start recording: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _stopRecording(BuildContext context) async {
    final recordings = context.read<RecordingsProvider>();

    try {
      await recordings.stopRecording();

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Recording saved successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to stop recording: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
