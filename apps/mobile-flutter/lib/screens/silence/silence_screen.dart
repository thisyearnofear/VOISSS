import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';
import 'package:voisss_butler_client/voisss_butler_client.dart';

import '../../providers/silence_provider.dart';
import 'silence_personas.dart';
import 'silence_reactions.dart';
import 'silence_recorder.dart';
import 'silence_theater.dart';

/// "Voice the Silence" — weekly silent-clip voiceover contest.
/// Watch → Record → Vote. The winner's voice can be licensed on VOISSS.
class SilenceScreen extends StatefulWidget {
  const SilenceScreen({super.key});

  @override
  State<SilenceScreen> createState() => _SilenceScreenState();
}

class _SilenceScreenState extends State<SilenceScreen> {
  VideoPlayerController? _video;
  bool _videoFailed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await context.read<SilenceProvider>().load();
      _initVideo();
    });
  }

  Future<void> _initVideo() async {
    final clip = context.read<SilenceProvider>().clip;
    if (clip == null || !mounted) return;
    final controller = VideoPlayerController.networkUrl(
      Uri.parse(clip.videoUrl),
    );
    try {
      await controller.initialize();
      await controller.setLooping(true);
      await controller.setVolume(0);
      await controller.play();
      if (mounted) setState(() => _video = controller);
    } catch (_) {
      if (mounted) setState(() => _videoFailed = true);
    }
  }

  void _restartClip() {
    _video?.seekTo(Duration.zero);
    _video?.play();
  }

  @override
  void dispose() {
    _video?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SilenceProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Voice the Silence'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            tooltip: 'Share the challenge',
            onPressed: () => Share.share(
              'A silent classic needs a voice — record yours and let the crowd '
              'pick the funniest. Voice the Silence on VOISSS: '
              'https://voisss.famile.xyz',
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => provider.load(),
          ),
        ],
      ),
      body: provider.loading && provider.clip == null
          ? const Center(child: CircularProgressIndicator())
          : provider.clip == null
              ? _NoClip(error: provider.error, onRetry: provider.load)
              : RefreshIndicator(
                  onRefresh: provider.load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _ClipCard(
                        clip: provider.clip!,
                        video: _video,
                        videoFailed: _videoFailed,
                        entryCount: provider.entries.length,
                      ),
                      const SizedBox(height: 16),
                      SilenceRecorder(
                        durationSec: provider.clip!.durationSec,
                        onRecordStart: _restartClip,
                      ),
                      if (provider.error != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            provider.error!,
                            style: const TextStyle(color: Colors.redAccent),
                          ),
                        ),
                      const SizedBox(height: 24),
                      _EntriesList(
                        entries: provider.entries,
                        video: _video,
                        clipTitle: provider.clip!.title,
                      ),
                      const SizedBox(height: 24),
                      _RevealCard(votes: provider.myVotes),
                      _Leaderboard(rows: provider.leaderboard),
                      const SizedBox(height: 16),
                      const _ServerpodExpander(),
                      const _VoissFooter(),
                    ],
                  ),
                ),
    );
  }
}

class _NoClip extends StatelessWidget {
  final String? error;
  final Future<void> Function() onRetry;
  const _NoClip({this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.videocam_off_outlined, size: 48, color: Colors.grey),
          const SizedBox(height: 12),
          Text(error ?? 'No active clip this week.'),
          const SizedBox(height: 12),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}

class _ClipCard extends StatefulWidget {
  final SilenceClip clip;
  final VideoPlayerController? video;
  final bool videoFailed;
  final int entryCount;
  const _ClipCard({
    required this.clip,
    required this.video,
    required this.videoFailed,
    required this.entryCount,
  });

  @override
  State<_ClipCard> createState() => _ClipCardState();
}

class _ClipCardState extends State<_ClipCard> {
  bool _hookVisible = false;

  @override
  void initState() {
    super.initState();
    // Let the silent footage sit for a beat — mystery before instruction —
    // then fade the hook in.
    Future.delayed(const Duration(milliseconds: 1400), () {
      if (mounted) setState(() => _hookVisible = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 4 / 3,
            child: widget.video != null
                ? VideoPlayer(widget.video!)
                : Container(
                    color: Colors.black,
                    child: Center(
                      child: widget.videoFailed
                          ? const Text('Clip could not be loaded')
                          : const CircularProgressIndicator(),
                    ),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.clip.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                AnimatedOpacity(
                  opacity: _hookVisible ? 1 : 0,
                  duration: const Duration(milliseconds: 900),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'A century of silence ends today — give it a voice.',
                        style: TextStyle(color: Colors.grey[400], fontSize: 13),
                      ),
                      const SizedBox(height: 10),
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _Step(
                            icon: Icons.play_circle_outline,
                            label: 'Watch',
                          ),
                          _Step(icon: Icons.mic_none, label: 'Record'),
                          _Step(
                            icon: Icons.emoji_events_outlined,
                            label: 'Vote',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.entryCount == 0
                      ? 'No voices yet — be the first.'
                      : '${widget.entryCount} ${widget.entryCount == 1 ? 'voice' : 'voices'} so far — yours could top the board.',
                  style: TextStyle(color: Colors.grey[600], fontSize: 11),
                ),
                const SizedBox(height: 4),
                Text(
                  widget.clip.rightsNote,
                  style: TextStyle(color: Colors.grey[700], fontSize: 10),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Step extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Step({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 20, color: const Color(0xFF7C5DFA)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[400])),
      ],
    );
  }
}

class _EntriesList extends StatelessWidget {
  final List<SilenceEntryView> entries;
  final VideoPlayerController? video;
  final String clipTitle;
  const _EntriesList({
    required this.entries,
    required this.video,
    required this.clipTitle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'The takes (${entries.length})',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        if (entries.isEmpty)
          Text(
            'Nothing yet — Chaplin is waiting for a voice. Be first.',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ...List.generate(
          entries.length,
          (i) => _EntryTile(
            entry: entries[i],
            index: i,
            video: video,
            clipTitle: clipTitle,
          ),
        ),
      ],
    );
  }
}

class _EntryTile extends StatelessWidget {
  final SilenceEntryView entry;
  final int index;
  final VideoPlayerController? video;
  final String clipTitle;
  const _EntryTile({
    required this.entry,
    required this.index,
    required this.video,
    required this.clipTitle,
  });

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SilenceProvider>();
    final revealed = provider.myVotes.containsKey(entry.id);
    final name = revealed ? entry.displayName : personaFor(entry.id);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.play_circle),
              iconSize: 36,
              color: const Color(0xFF7C5DFA),
              tooltip: 'Watch this take',
              onPressed: video == null
                  ? null
                  : () => SilenceTheater.open(
                        context,
                        entries: provider.entries,
                        initialIndex: index,
                        video: video!,
                        clipTitle: clipTitle,
                      ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  Text(
                    revealed
                        ? kAgentEntryIds.contains(entry.id)
                            ? 'This one was a machine 🤖 · ${entry.avgScore.toStringAsFixed(1)} ★'
                            : '${entry.avgScore.toStringAsFixed(1)} ★ · ${entry.voteCount} votes'
                        : 'Vote to reveal the voice',
                    style: TextStyle(
                      color: revealed && kAgentEntryIds.contains(entry.id)
                          ? const Color(0xFFFFC107)
                          : Colors.grey[500],
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            SilenceReactionRow(entryId: entry.id, size: 22),
          ],
        ),
      ),
    );
  }
}

/// Post-first-vote reveal — the marketplace bridge delivered at the moment
/// of peak engagement, plus the "one of these was a machine" twist once a
/// judge has voted on the planted agent take.
class _RevealCard extends StatelessWidget {
  final Map<int, int> votes;
  const _RevealCard({required this.votes});

  @override
  Widget build(BuildContext context) {
    if (votes.isEmpty) return const SizedBox.shrink();
    final caughtAgent = votes.keys.any(kAgentEntryIds.contains);
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF7C5DFA).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: const Color(0xFF7C5DFA).withValues(alpha: 0.3),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'You just judged an audition.',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 4),
            Text(
              'Every take here is a licensable voice — recorded with consent, '
              'ranked by the crowd, ready for VOISSS.',
              style: TextStyle(color: Colors.grey[400], fontSize: 12),
            ),
            if (caughtAgent) ...[
              const SizedBox(height: 8),
              const Text(
                'Plot twist: at least one take you judged was generated by a '
                'machine — The Projectionist\u2019s Apprentice. Could you tell?',
                style: TextStyle(
                  color: Color(0xFFFFC107),
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Leaderboard extends StatelessWidget {
  final List<SilenceLeaderboardRow> rows;
  const _Leaderboard({required this.rows});

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Leaderboard',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        ...rows.take(5).map((r) {
          final winner = r.rank == 1;
          return Container(
            margin: const EdgeInsets.only(bottom: 4),
            decoration: winner
                ? BoxDecoration(
                    color: const Color(0xFFFFC107).withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: const Color(0xFFFFC107).withValues(alpha: 0.3),
                    ),
                  )
                : null,
            child: ListTile(
              dense: true,
              contentPadding: const EdgeInsets.symmetric(horizontal: 8),
              leading: winner
                  ? const Icon(Icons.emoji_events, color: Color(0xFFFFC107))
                  : CircleAvatar(radius: 14, child: Text('${r.rank}')),
              title: Text(
                r.displayName,
                style:
                    winner ? const TextStyle(fontWeight: FontWeight.bold) : null,
              ),
              trailing: Text(
                '${r.avgScore.toStringAsFixed(1)} ★ · ${r.voteCount} votes',
                style: TextStyle(color: Colors.grey[400], fontSize: 12),
              ),
            ),
          );
        }),
      ],
    );
  }
}

/// Progressive disclosure for judges: players never open this, but it puts
/// the Serverpod story one tap away for anyone who wants the "how".
class _ServerpodExpander extends StatelessWidget {
  const _ServerpodExpander();

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: EdgeInsets.zero,
        title: Text(
          'Built on Serverpod',
          style: TextStyle(color: Colors.grey[500], fontSize: 12),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              'Type-safe endpoints generated server→client — '
              'audio uploads are ByteData params into Postgres bytea, '
              'no multipart, no REST glue. The leaderboard is a Serverpod '
              'stream polling with change-signature dedupe. Deployed live: '
              'Postgres 16 + nginx + TLS on a real server.',
              style: TextStyle(color: Colors.grey[600], fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }
}

class _VoissFooter extends StatelessWidget {
  const _VoissFooter();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: TextButton.icon(
        onPressed: () => launchUrl(Uri.parse('https://voisss.famile.xyz')),
        icon: const Icon(Icons.mic_external_on_outlined, size: 16),
        label: const Text(
          'Winning voices can be licensed on VOISSS',
          style: TextStyle(fontSize: 12),
        ),
      ),
    );
  }
}
