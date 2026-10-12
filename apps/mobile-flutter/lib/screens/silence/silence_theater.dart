import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';
import 'package:voisss_butler_client/voisss_butler_client.dart';

import '../../providers/silence_provider.dart';
import 'silence_personas.dart';
import 'silence_reactions.dart';

/// Full-screen "watch the dub" experience — an entry's audio plays over the
/// silent footage. This is where the Bad Lip Reading magic lives.
class SilenceTheater extends StatefulWidget {
  final List<SilenceEntryView> entries;
  final int initialIndex;
  final VideoPlayerController video;
  final String clipTitle;

  const SilenceTheater({
    super.key,
    required this.entries,
    required this.initialIndex,
    required this.video,
    required this.clipTitle,
  });

  static Future<void> open(
    BuildContext context, {
    required List<SilenceEntryView> entries,
    required int initialIndex,
    required VideoPlayerController video,
    required String clipTitle,
  }) {
    return Navigator.of(context).push(
      PageRouteBuilder(
        opaque: true,
        pageBuilder: (_, __, ___) => SilenceTheater(
          entries: entries,
          initialIndex: initialIndex,
          video: video,
          clipTitle: clipTitle,
        ),
        transitionsBuilder: (_, animation, __, child) =>
            FadeTransition(opacity: animation, child: child),
      ),
    );
  }

  @override
  State<SilenceTheater> createState() => _SilenceTheaterState();
}

class _SilenceTheaterState extends State<SilenceTheater> {
  final _player = AudioPlayer();
  late int _index;
  bool _playing = true;

  SilenceEntryView get _entry => widget.entries[_index];

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _player.onPlayerComplete.listen((_) {
      if (mounted) setState(() => _playing = false);
    });
    _playCurrent();
  }

  Future<void> _playCurrent() async {
    await widget.video.seekTo(Duration.zero);
    await widget.video.play();
    await _player.stop();
    // Prefer the Grove gateway URL (CDN-fast) over the DB blob.
    if (_entry.audioUrl.isNotEmpty) {
      await _player.play(UrlSource(_entry.audioUrl));
    } else {
      final audio = _entry.audio;
      await _player.play(
        BytesSource(
          audio.buffer.asUint8List(audio.offsetInBytes, audio.lengthInBytes),
        ),
      );
    }
    if (mounted) setState(() => _playing = true);
  }

  void _next() {
    setState(() => _index = (_index + 1) % widget.entries.length);
    _playCurrent();
  }

  void _prev() {
    setState(() => _index =
        (_index - 1 + widget.entries.length) % widget.entries.length);
    _playCurrent();
  }

  Future<void> _replay() => _playCurrent();

  @override
  void dispose() {
    _player.dispose();
    widget.video.setVolume(0);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SilenceProvider>();
    final revealed = provider.myVotes.containsKey(_entry.id);
    final name = revealed ? _entry.displayName : personaFor(_entry.id);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Full-bleed footage
          if (widget.video.value.isInitialized)
            ClipRect(
              child: FittedBox(
                fit: BoxFit.cover,
                child: SizedBox(
                  width: widget.video.value.size.width,
                  height: widget.video.value.size.height,
                  child: VideoPlayer(widget.video),
                ),
              ),
            )
          else
            const Center(child: CircularProgressIndicator()),

          // Scrim — dark band top and bottom
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.black87, Colors.transparent, Colors.black87],
                stops: [0.0, 0.35, 1.0],
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                      Expanded(
                        child: Text(
                          widget.clipTitle,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              color: Colors.grey[400], fontSize: 13),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.share, color: Colors.white),
                        onPressed: () => Share.share(
                          'Someone voiced a silent classic on VOISSS — come hear the takes and vote for the funniest. '
                          'https://voisss.famile.xyz',
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (!revealed)
                        Text(
                          'Vote to reveal who voiced this',
                          style:
                              TextStyle(color: Colors.grey[500], fontSize: 12),
                        ),
                      if (revealed &&
                          (_entry.isAiGenerated ||
                              kAgentEntryIds.contains(_entry.id)))
                        const Text(
                          'This take was generated by a machine — did you catch it?',
                          style: TextStyle(
                            color: Color(0xFFFFC107),
                            fontSize: 12,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      const SizedBox(height: 8),
                      SilenceReactionRow(entryId: _entry.id, size: 34),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.skip_previous,
                                color: Colors.white, size: 32),
                            onPressed:
                                widget.entries.length > 1 ? _prev : null,
                          ),
                          IconButton(
                            icon: Icon(
                              _playing ? Icons.replay : Icons.play_arrow,
                              color: Colors.white,
                              size: 40,
                            ),
                            onPressed: _replay,
                          ),
                          IconButton(
                            icon: const Icon(Icons.skip_next,
                                color: Colors.white, size: 32),
                            onPressed:
                                widget.entries.length > 1 ? _next : null,
                          ),
                        ],
                      ),
                      Text(
                        'Take ${_index + 1} of ${widget.entries.length}',
                        style:
                            TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
