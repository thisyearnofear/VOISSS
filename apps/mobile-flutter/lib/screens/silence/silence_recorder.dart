import 'dart:async';
import 'dart:typed_data';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:record/record.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:voisss_butler_client/voisss_butler_client.dart'
    show CoWriterMessage;

import '../../providers/silence_provider.dart';
import 'silence_recording_stub.dart'
    if (dart.library.io) 'silence_recording_io.dart'
    if (dart.library.html) 'silence_recording_web.dart';

/// The studio panel: optionally draft lines, then either record yourself
/// (with live captions so you can see the mic capturing) or have an AI
/// voice perform your script via Featherless (Kokoro).
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
  final _player = AudioPlayer();
  final _speech = SpeechToText();
  final _nameController = TextEditingController();
  final _scriptController = TextEditingController();
  late final AnimationController _pulse;

  Timer? _ticker;
  DateTime? _recordStart;
  int _elapsedSec = 0;
  int _recordedSec = 0;

  bool _recording = false;
  bool _recorded = false;
  Uint8List? _recordedBytes;
  String _audioFormat = 'm4a';

  /// Live transcript while recording — proof the mic is capturing.
  String _liveTranscript = '';

  /// Final transcript kept for the "take captured" confirmation card.
  String _finalTranscript = '';
  bool _speechAvailable = false;

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
    _speech.stop();
    _pulse.dispose();
    _nameController.dispose();
    _scriptController.dispose();
    super.dispose();
  }

  String _fmt(int s) => '${s ~/ 60}:${(s % 60).toString().padLeft(2, '0')}';
  String get _clock => '${_fmt(_elapsedSec)} / ${_fmt(widget.durationSec)}';

  Future<void> _startLiveCaptions() async {
    try {
      _speechAvailable = await _speech.initialize(
        onError: (_) {},
        onStatus: (_) {},
      );
      if (!_speechAvailable) return;
      await _speech.listen(
        onResult: (r) {
          if (!mounted) return;
          setState(() => _liveTranscript = r.recognizedWords);
        },
        listenOptions: SpeechListenOptions(
          partialResults: true,
          listenMode: ListenMode.dictation,
        ),
      );
    } catch (_) {
      _speechAvailable = false;
    }
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
    setState(() {
      _recording = true;
      _recorded = false;
      _recordedBytes = null;
      _elapsedSec = 0;
      _liveTranscript = '';
      _finalTranscript = '';
    });
    unawaited(_startLiveCaptions());
    _ticker = Timer.periodic(const Duration(milliseconds: 250), (_) {
      if (!mounted) return;
      final elapsed = DateTime.now().difference(_recordStart!).inSeconds;
      setState(() => _elapsedSec = elapsed);
      if (elapsed >= widget.durationSec) _stopAndKeep();
    });
  }

  Future<void> _stopAndKeep() async {
    _ticker?.cancel();
    _pulse.stop();
    try {
      await _speech.stop();
    } catch (_) {}
    final transcript = _liveTranscript.trim();
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
      _recordedSec = _elapsedSec;
      _audioFormat = recordingFormat();
      _finalTranscript = transcript;
      _liveTranscript = '';
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
      _finalTranscript = '';
      _nameController.clear();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Your take is in — now watch the others and vote.'),
      ),
    );
  }

  void _openAiSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF16131F),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => _AiVoiceSheet(
        script: _scriptController.text.trim(),
        displayName: _nameController.text.trim(),
        parentContext: context,
      ),
    );
  }

  void _openCoWriter() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF16131F),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => _CoWriterSheet(
        scriptController: _scriptController,
        parentContext: context,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final submitting = context.watch<SilenceProvider>().submitting;
    final scheme = Theme.of(context).colorScheme;
    final script = _scriptController.text.trim();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── Optional script draft ──
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF16131F),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
          ),
          child: Column(
            children: [
              InkWell(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16),
                ),
                onTap: () => FocusScope.of(context).requestFocus(FocusNode()),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.edit_note, size: 18, color: scheme.primary),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'Write your lines',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      InkWell(
                        borderRadius: BorderRadius.circular(20),
                        onTap: _openCoWriter,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.auto_awesome,
                                size: 14,
                                color: scheme.primary,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Riff with AI',
                                style: TextStyle(
                                  color: scheme.primary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: TextField(
                  controller: _scriptController,
                  maxLines: 4,
                  maxLength: 1200,
                  buildCounter: (
                    _, {
                    required currentLength,
                    required isFocused,
                    maxLength,
                  }) =>
                      null,
                  decoration: InputDecoration(
                    hintText:
                        '"Well, if it isn\'t my old friend the tax collector…"\n'
                        'Draft your dub, then voice it yourself or hand it to an AI voice.',
                    hintStyle: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 13,
                      height: 1.4,
                    ),
                    isDense: true,
                    filled: true,
                    fillColor: const Color(0xFF0B0A12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  style: const TextStyle(fontSize: 13, height: 1.4),
                  onChanged: (_) => setState(() {}),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // ── Mode picker: yourself or AI ──
        if (!_recording && !_recorded)
          Row(
            children: [
              Expanded(
                flex: 3,
                child: _RecordPill(
                  recording: false,
                  enabled: !submitting,
                  pulse: _pulse,
                  onTap: _toggleRecord,
                  label: 'Voice it myself',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: _AiButton(
                  enabled: !submitting,
                  hasScript: script.isNotEmpty,
                  onTap: _openAiSheet,
                ),
              ),
            ],
          ),

        if (_recording) _RecordPill(
          recording: true,
          enabled: !submitting,
          pulse: _pulse,
          onTap: _toggleRecord,
          label: 'Recording… tap to stop',
        ),

        // ── While recording: clock, teleprompter, live captions ──
        if (_recording) ...[
          const SizedBox(height: 12),
          Text(
            _clock,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 13,
              fontFeatures: const [],
            ),
          ),
          if (script.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                script,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 12,
                  height: 1.4,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          ],
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: scheme.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: scheme.primary.withValues(alpha: 0.25),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.closed_caption,
                    size: 16, color: scheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _liveTranscript.isEmpty
                        ? (_speechAvailable
                            ? 'Listening… your words will appear here as captions'
                            : 'Live captions unavailable in this browser — still recording')
                        : _liveTranscript,
                    style: TextStyle(
                      color: _liveTranscript.isEmpty
                          ? Colors.grey[500]
                          : Colors.white,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],

        // ── Take captured: explicit confirmation before submit ──
        if (_recorded) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF16131F),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFF4CAF50).withValues(alpha: 0.4),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.check_circle,
                        color: Color(0xFF4CAF50), size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Take captured · ${_fmt(_recordedSec)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.play_arrow),
                      tooltip: 'Replay',
                      onPressed: () async {
                        if (_recordedBytes != null) {
                          await _player.play(BytesSource(_recordedBytes!));
                        }
                      },
                    ),
                  ],
                ),
                if (_finalTranscript.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      'We heard: “${_finalTranscript.length > 90 ? '${_finalTranscript.substring(0, 90)}…' : _finalTranscript}”',
                      style: TextStyle(
                        color: Colors.grey[400],
                        fontSize: 12,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                Row(
                  children: [
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
            ),
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
  final String label;
  final AnimationController pulse;
  final VoidCallback onTap;
  const _RecordPill({
    required this.recording,
    required this.enabled,
    required this.label,
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
                  label,
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

/// Secondary CTA — "AI voice". Nudges you to write lines first.
class _AiButton extends StatelessWidget {
  final bool enabled;
  final bool hasScript;
  final VoidCallback onTap;
  const _AiButton({
    required this.enabled,
    required this.hasScript,
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
              color: scheme.primary.withValues(alpha: 0.12),
              border: Border.all(
                color: scheme.primary.withValues(alpha: 0.4),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.smart_toy_outlined,
                    color: scheme.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                  hasScript ? 'AI voice' : 'AI voice',
                  style: TextStyle(
                    color: scheme.primary,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
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

/// Bottom sheet: pick an AI voice, confirm script + name, generate a take.
class _AiVoiceSheet extends StatefulWidget {
  final String script;
  final String displayName;
  final BuildContext parentContext;
  const _AiVoiceSheet({
    required this.script,
    required this.displayName,
    required this.parentContext,
  });

  @override
  State<_AiVoiceSheet> createState() => _AiVoiceSheetState();
}

class _AiVoiceSheetState extends State<_AiVoiceSheet> {
  late final TextEditingController _scriptController;
  late final TextEditingController _nameController;
  Map<String, String> _voices = {};
  String? _selectedVoice;
  bool _loadingVoices = true;
  bool _generating = false;

  @override
  void initState() {
    super.initState();
    _scriptController = TextEditingController(text: widget.script);
    _nameController = TextEditingController(text: widget.displayName);
    _loadVoices();
  }

  Future<void> _loadVoices() async {
    try {
      final voices =
          await widget.parentContext.read<SilenceProvider>().aiVoices();
      if (mounted) {
        setState(() {
          _voices = voices;
          _selectedVoice = voices.keys.isEmpty ? null : voices.keys.first;
          _loadingVoices = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingVoices = false);
    }
  }

  Future<void> _generate() async {
    final script = _scriptController.text.trim();
    final name = _nameController.text.trim();
    final voice = _selectedVoice;
    if (script.isEmpty || name.isEmpty || voice == null || _generating) return;
    setState(() => _generating = true);
    final provider = widget.parentContext.read<SilenceProvider>();
    final messenger = ScaffoldMessenger.of(widget.parentContext);
    final ok = await provider.generateEntry(
      displayName: name,
      script: script,
      voice: voice,
    );
    if (!mounted) return;
    Navigator.of(context).pop();
    messenger.showSnackBar(
      SnackBar(
        content: Text(
          ok
              ? 'AI take generated — it’s in the gallery, voting blind like everyone else.'
              : 'Generation failed — try again.',
        ),
      ),
    );
  }

  @override
  void dispose() {
    _scriptController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(Icons.smart_toy_outlined, color: scheme.primary),
              const SizedBox(width: 8),
              Text(
                'AI voice take',
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'The crowd votes blind — it’ll be flagged as machine-made after voting.',
            style: TextStyle(color: Colors.grey[500], fontSize: 12),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _scriptController,
            maxLines: 4,
            maxLength: 1200,
            buildCounter: (
              _, {
              required currentLength,
              required isFocused,
              maxLength,
            }) =>
                null,
            decoration: const InputDecoration(
              hintText: 'The lines it should perform…',
            ),
          ),
          const SizedBox(height: 12),
          if (_loadingVoices)
            const Center(child: CircularProgressIndicator())
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _voices.entries.map((v) {
                final selected = v.key == _selectedVoice;
                return ChoiceChip(
                  label: Text(v.value),
                  selected: selected,
                  onSelected: (_) =>
                      setState(() => _selectedVoice = v.key),
                  selectedColor: scheme.primary.withValues(alpha: 0.25),
                );
              }).toList(),
            ),
          const SizedBox(height: 12),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(
              hintText: 'Display name for this take',
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
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _generating ? null : _generate,
            icon: _generating
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.auto_awesome, size: 18),
            label: Text(_generating ? 'Generating…' : 'Generate take'),
          ),
        ],
      ),
    );
  }
}

/// Bottom sheet: riff with the AI co-writer — it has watched the clip
/// (vision-distilled scene guide server-side), so its suggestions are
/// tied to actual on-screen moments. Insert anything it writes straight
/// into your draft.
class _CoWriterSheet extends StatefulWidget {
  final TextEditingController scriptController;
  final BuildContext parentContext;
  const _CoWriterSheet({
    required this.scriptController,
    required this.parentContext,
  });

  @override
  State<_CoWriterSheet> createState() => _CoWriterSheetState();
}

class _CoWriterSheetState extends State<_CoWriterSheet> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<CoWriterMessage> _history = [];
  List<String>? _openers;
  bool _sending = false;

  SilenceProvider get _provider =>
      widget.parentContext.read<SilenceProvider>();

  @override
  void initState() {
    super.initState();
    _loadOpeners();
  }

  Future<void> _loadOpeners() async {
    try {
      final openers = await _provider.coWriterOpeners();
      if (mounted) setState(() => _openers = openers);
    } catch (_) {
      if (mounted) setState(() => _openers = const []);
    }
  }

  Future<void> _send(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || _sending) return;
    _input.clear();
    setState(() {
      _history.add(CoWriterMessage(role: 'user', content: trimmed));
      _sending = true;
    });
    _scrollToBottom();
    try {
      final reply = await _provider.coWriterChat(
        _history,
        widget.scriptController.text,
      );
      if (!mounted) return;
      setState(() => _history.add(reply));
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _history.add(
          CoWriterMessage(
            role: 'assistant',
            content: 'Lost my train of thought — try that again.',
          ),
        );
      });
    } finally {
      if (mounted) {
        setState(() => _sending = false);
        _scrollToBottom();
      }
    }
  }

  void _insertIntoDraft(String content) {
    final controller = widget.scriptController;
    // Prefer `LINE:`-marked speakable lines; otherwise strip markdown
    // noise and take the whole reply.
    final lines = content
        .split('\n')
        .where((l) => l.trimLeft().startsWith('LINE:'))
        .map((l) => l.trimLeft().substring(5).trim())
        .where((l) => l.isNotEmpty)
        .toList();
    final clean = lines.isNotEmpty
        ? lines.join('\n')
        : content.replaceAll(RegExp(r'[*_`#]'), '').trim();
    final current = controller.text.trimRight();
    final next = current.isEmpty ? clean : '$current\n$clean';
    controller.text =
        next.length > 1200 ? next.substring(0, 1200) : next;
    ScaffoldMessenger.of(widget.parentContext).showSnackBar(
      const SnackBar(content: Text('Added to your draft')),
    );
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.82,
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 12,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(Icons.auto_awesome, size: 18, color: scheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Riff with the co-writer',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        'It’s watched every frame — ask for lines, angles, or punch-ups.',
                        style: TextStyle(color: Colors.grey[500], fontSize: 11),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView(
                controller: _scroll,
                children: [
                  if (_history.isEmpty) ...[
                    Text(
                      'Pick a direction, or just start typing:',
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                    if (_openers == null)
                      const Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(child: CircularProgressIndicator()),
                      )
                    else
                      for (final opener in _openers!)
                        _OpenerCard(
                          text: opener,
                          onTap: _sending ? null : () => _send(opener),
                        ),
                  ],
                  for (final m in _history)
                    _CoWriterBubble(
                      message: m,
                      onInsert: m.role == 'assistant'
                          ? () => _insertIntoDraft(m.content)
                          : null,
                    ),
                  if (_sending)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text(
                        'thinking…',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 12,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _input,
                    textInputAction: TextInputAction.send,
                    onSubmitted: _send,
                    decoration: InputDecoration(
                      hintText: 'e.g. “make it weirder” or “line for 0:26”',
                      hintStyle:
                          TextStyle(color: Colors.grey[600], fontSize: 13),
                      isDense: true,
                      filled: true,
                      fillColor: const Color(0xFF0B0A12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    style: const TextStyle(fontSize: 13),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _sending ? null : () => _send(_input.text),
                  icon: const Icon(Icons.arrow_upward, size: 18),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _OpenerCard extends StatelessWidget {
  final String text;
  final VoidCallback? onTap;
  const _OpenerCard({required this.text, this.onTap});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: scheme.primary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: scheme.primary.withValues(alpha: 0.25),
            ),
          ),
          child: Text(
            text,
            style: const TextStyle(fontSize: 13, height: 1.4),
          ),
        ),
      ),
    );
  }
}

class _CoWriterBubble extends StatelessWidget {
  final CoWriterMessage message;
  final VoidCallback? onInsert;
  const _CoWriterBubble({required this.message, this.onInsert});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isUser = message.role == 'user';
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        decoration: BoxDecoration(
          color: isUser
              ? scheme.primary.withValues(alpha: 0.22)
              : const Color(0xFF0B0A12),
          borderRadius: BorderRadius.circular(14),
          border: isUser
              ? null
              : Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SelectableText(
              // `LINE:` prefixes exist for draft extraction — hide them.
              message.content.replaceAll(
                RegExp(r'^\s*LINE:\s*', multiLine: true),
                '',
              ),
              style: const TextStyle(fontSize: 13, height: 1.45),
            ),
            if (onInsert != null) ...[
              const SizedBox(height: 6),
              GestureDetector(
                onTap: onInsert,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.add, size: 14, color: scheme.primary),
                    Text(
                      'Insert into draft',
                      style: TextStyle(
                        color: scheme.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
