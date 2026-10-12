import 'dart:async';
import 'dart:typed_data';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:record/record.dart';

import '../../providers/silence_provider.dart';
import 'silence_recording_stub.dart'
    if (dart.library.io) 'silence_recording_io.dart'
    if (dart.library.html) 'silence_recording_web.dart';

/// Record-your-take section. Recording runs while the clip plays muted —
/// you perform over the footage, capped at the clip's duration.
class SilenceRecorder extends StatefulWidget {
  /// Called when recording starts — the screen restarts the muted clip so
  /// the performer records in sync with the footage.
  final VoidCallback onRecordStart;
  final int durationSec;

  const SilenceRecorder({
    super.key,
    required this.onRecordStart,
    required this.durationSec,
  });

  @override
  State<SilenceRecorder> createState() => _SilenceRecorderState();
}

class _SilenceRecorderState extends State<SilenceRecorder>
    with SingleTickerProviderStateMixin {
  final _recorder = AudioRecorder();
  final _nameController = TextEditingController();
  final _player = AudioPlayer();
  late final AnimationController _pulse;

  Timer? _ticker;
  DateTime? _recordStart;
  int _elapsedSec = 0;

  bool _recording = false;
  bool _recorded = false;
  Uint8List? _recordedBytes;
  String _audioFormat = 'm4a';

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _recorder.dispose();
    _player.dispose();
    _pulse.dispose();
    _nameController.dispose();
    super.dispose();
  }

  String get _clock {
    String fmt(int s) => '${s ~/ 60}:${(s % 60).toString().padLeft(2, '0')}';
    return '${fmt(_elapsedSec)} / ${fmt(widget.durationSec)}';
  }

  Future<void> _toggleRecord() async {
    if (_recording) {
      await _stopAndKeep();
      return;
    }
    final hasPermission = await _recorder.hasPermission();
    if (!hasPermission) return;
    await _recorder.start(
      const RecordConfig(encoder: AudioEncoder.aacLc),
      path: await recordingPath(),
    );
    widget.onRecordStart();
    _pulse.repeat(reverse: true);
    _recordStart = DateTime.now();
    _ticker = Timer.periodic(const Duration(milliseconds: 250), (_) {
      if (!mounted) return;
      final elapsed = DateTime.now().difference(_recordStart!).inSeconds;
      setState(() => _elapsedSec = elapsed);
      if (elapsed >= widget.durationSec) _stopAndKeep();
    });
    setState(() {
      _recording = true;
      _recorded = false;
      _recordedBytes = null;
      _elapsedSec = 0;
    });
  }

  Future<void> _stopAndKeep() async {
    _ticker?.cancel();
    _pulse.stop();
    final path = await _recorder.stop();
    if (path == null || !mounted) {
      setState(() => _recording = false);
      return;
    }
    final bytes = await readRecordingBytes(path);
    if (!mounted) return;
    setState(() {
      _recording = false;
      _recorded = true;
      _recordedBytes = bytes;
      _audioFormat = recordingFormat();
    });
  }

  Future<void> _submit() async {
    final bytes = _recordedBytes;
    final name = _nameController.text.trim();
    if (bytes == null || name.isEmpty) return;
    await context.read<SilenceProvider>().submitEntry(
          displayName: name,
          audioBytes: bytes,
          audioFormat: _audioFormat,
        );
    if (!mounted) return;
    setState(() {
      _recorded = false;
      _recordedBytes = null;
      _nameController.clear();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Your take is in. Now go watch the others and vote.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final submitting = context.watch<SilenceProvider>().submitting;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _RecordPill(
          recording: _recording,
          enabled: !submitting,
          pulse: _pulse,
          onTap: _toggleRecord,
        ),
        if (_recording)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              _clock,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey[400],
                fontFeatures: const [],
                fontSize: 13,
              ),
            ),
          ),
        if (_recorded) ...[
          const SizedBox(height: 12),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.play_arrow),
                onPressed: () async {
                  if (_recordedBytes != null) {
                    await _player.play(BytesSource(_recordedBytes!));
                  }
                },
              ),
              Expanded(
                child: TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    hintText: 'Your display name',
                    isDense: true,
                  ),
                  maxLength: 40,
                  buildCounter: (
                    _, {
                    required currentLength,
                    required isFocused,
                    maxLength,
                  }) =>
                      null,
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: submitting ? null : _submit,
                child: submitting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Submit'),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

/// The hero CTA — a full-width gradient pill that turns red and pulses while
/// recording.
class _RecordPill extends StatelessWidget {
  final bool recording;
  final bool enabled;
  final AnimationController pulse;
  final VoidCallback onTap;
  const _RecordPill({
    required this.recording,
    required this.enabled,
    required this.pulse,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Opacity(
      opacity: enabled ? 1 : 0.5,
      child: Material(
        borderRadius: BorderRadius.circular(999),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: enabled ? onTap : null,
          child: Ink(
            padding: const EdgeInsets.symmetric(vertical: 18),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              gradient: LinearGradient(
                colors: recording
                    ? const [Color(0xFFE5484D), Color(0xFFB3261E)]
                    : [scheme.primary, const Color(0xFF5B3DE0)],
              ),
              boxShadow: [
                BoxShadow(
                  color: (recording ? Colors.redAccent : scheme.primary)
                      .withValues(alpha: 0.35),
                  blurRadius: 20,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (recording)
                  ScaleTransition(
                    scale: Tween(begin: 1.0, end: 1.4).animate(
                      CurvedAnimation(parent: pulse, curve: Curves.easeInOut),
                    ),
                    child:
                        const Icon(Icons.stop_circle, color: Colors.white),
                  )
                else
                  const Icon(Icons.mic, color: Colors.white),
                const SizedBox(width: 10),
                Text(
                  recording ? 'Recording… tap to stop' : 'Record your voiceover',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
