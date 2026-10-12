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
      body: provider.loading && provider.clip == null
          ? const Center(child: CircularProgressIndicator())
          : provider.clip == null
              ? _NoClip(error: provider.error, onRetry: provider.load)
              : RefreshIndicator(
                  onRefresh: provider.load,
                  child: ListView(
                    padding: EdgeInsets.zero,
                    children: [
                      _HeroClip(
                        clip: provider.clip!,
                        video: _video,
                        videoFailed: _videoFailed,
                        entryCount: provider.entries.length,
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            SilenceRecorder(
                              durationSec: provider.clip!.durationSec,
                              onRecordStart: _restartClip,
                            ),
                            if (provider.error != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  provider.error!,
                                  style:
                                      const TextStyle(color: Colors.redAccent),
                                ),
                              ),
                            const SizedBox(height: 28),
                            _EntriesList(
                              entries: provider.entries,
                              video: _video,
                              clipTitle: provider.clip!.title,
                            ),
                            const SizedBox(height: 24),
                            _RevealCard(
                              votes: provider.myVotes,
                              entries: provider.entries,
                            ),
                            _Leaderboard(rows: provider.leaderboard),
                            const SizedBox(height: 8),
                            const _ServerpodExpander(),
                            const _VoissFooter(),
                          ],
                        ),
                      ),
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

/// Full-bleed hero — the footage IS the screen. Gradient scrim carries the
/// title, the hook, and the Watch→Record→Vote steps over the picture.
class _HeroClip extends StatefulWidget {
  final SilenceClip clip;
  final VideoPlayerController? video;
  final bool videoFailed;
  final int entryCount;
  const _HeroClip({
    required this.clip,
    required this.video,
    required this.videoFailed,
    required this.entryCount,
  });

  @override
  State<_HeroClip> createState() => _HeroClipState();
}

class _HeroClipState extends State<_HeroClip> {
  bool _hookVisible = false;

  @override
  void initState() {
    super.initState();
    // Let the silent footage sit for a beat — mystery before instruction —
    // then fade the hook in.
    Future.delayed(const Duration(milliseconds: 1600), () {
      if (mounted) setState(() => _hookVisible = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    // Hero height tracks the viewport so the overlay stays above the fold
    // on both phones and desktop — roughly 60% of the screen.
    final heroHeight =
        (MediaQuery.of(context).size.height * 0.6).clamp(360.0, 640.0);
    return SizedBox(
      height: heroHeight,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Footage
          widget.video != null
              ? ClipRect(
                  child: FittedBox(
                    fit: BoxFit.cover,
                    child: SizedBox(
                      width: widget.video!.value.size.width,
                      height: widget.video!.value.size.height,
                      child: VideoPlayer(widget.video!),
                    ),
                  ),
                )
              : Container(
                  color: const Color(0xFF16131F),
                  child: Center(
                    child: widget.videoFailed
                        ? const Text('Clip could not be loaded')
                        : const CircularProgressIndicator(),
                  ),
                ),

          // Scrim — transparent up top, deep at the base
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black54,
                  Colors.transparent,
                  Colors.transparent,
                  Color(0xF20B0A12),
                ],
                stops: [0.0, 0.2, 0.45, 1.0],
              ),
            ),
          ),

          // Floating actions
          Positioned(
            top: 12,
            right: 12,
            child: SafeArea(
              child: Row(
                children: [
                  _GlassIcon(
                    icon: Icons.share_outlined,
                    tooltip: 'Share the challenge',
                    onTap: () => Share.share(
                      'A silent classic needs a voice — record yours and let '
                      'the crowd pick the funniest. Voice the Silence on '
                      'VOISSS: https://voisss.famile.xyz',
                    ),
                  ),
                  const SizedBox(width: 8),
                  _GlassIcon(
                    icon: Icons.refresh,
                    tooltip: 'Refresh',
                    onTap: () =>
                        context.read<SilenceProvider>().load(),
                  ),
                ],
              ),
            ),
          ),

          // Title + hook + steps, over the scrim
          Positioned(
            left: 20,
            right: 20,
            bottom: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'VOICE THE SILENCE',
                  style: TextStyle(
                    color: scheme.primary,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 2.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  widget.clip.title,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                AnimatedOpacity(
                  opacity: _hookVisible ? 1 : 0,
                  duration: const Duration(milliseconds: 900),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 6),
                      Text(
                        'A century of silence ends today — give it a voice.',
                        style: TextStyle(
                          color: Colors.grey[300],
                          fontSize: 14,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 14),
                      const Row(
                        children: [
                          _StepChip(
                              icon: Icons.play_circle_outline, label: 'Watch'),
                          _StepArrow(),
                          _StepChip(icon: Icons.mic_none, label: 'Record'),
                          _StepArrow(),
                          _StepChip(
                              icon: Icons.emoji_events_outlined, label: 'Vote'),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  widget.entryCount == 0
                      ? 'No voices yet — be the first'
                      : '${widget.entryCount} ${widget.entryCount == 1 ? 'voice' : 'voices'} so far · yours could top the board',
                  style: TextStyle(color: Colors.grey[500], fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GlassIcon extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  const _GlassIcon({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.45),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
          ),
          child: Icon(icon, size: 18, color: Colors.white),
        ),
      ),
    );
  }
}

class _StepChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _StepChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: scheme.primary),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: Colors.white),
          ),
        ],
      ),
    );
  }
}

class _StepArrow extends StatelessWidget {
  const _StepArrow();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: Icon(Icons.arrow_forward, size: 12, color: Colors.grey[600]),
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
          'The takes',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 4),
        Text(
          entries.isEmpty
              ? 'Nothing yet — Chaplin is waiting for a voice.'
              : 'Watch each dub over the footage, then vote your favourite.',
          style: TextStyle(color: Colors.grey[500], fontSize: 12),
        ),
        const SizedBox(height: 12),
        if (entries.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF16131F),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.06),
              ),
            ),
            child: Center(
              child: Text(
                'Be first.',
                style: TextStyle(color: Colors.grey[500], fontSize: 14),
              ),
            ),
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
    final scheme = Theme.of(context).colorScheme;
    final revealed = provider.myVotes.containsKey(entry.id);
    final isAgent =
        entry.isAiGenerated || kAgentEntryIds.contains(entry.id);
    final name = revealed ? entry.displayName : personaFor(entry.id);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF16131F),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          // Persona avatar — first glyph of the stage name
          CircleAvatar(
            radius: 20,
            backgroundColor: revealed && isAgent
                ? const Color(0xFFFFC107).withValues(alpha: 0.15)
                : scheme.primary.withValues(alpha: 0.15),
            child: Text(
              name.characters.first,
              style: TextStyle(
                color: revealed && isAgent
                    ? const Color(0xFFFFC107)
                    : scheme.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  revealed
                      ? isAgent
                          ? 'This one was a machine 🤖 · ${entry.avgScore.toStringAsFixed(1)} ★'
                          : '${entry.avgScore.toStringAsFixed(1)} ★ · ${entry.voteCount} votes'
                      : 'Vote to reveal the voice',
                  style: TextStyle(
                    color: revealed && isAgent
                        ? const Color(0xFFFFC107)
                        : Colors.grey[500],
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.play_circle_fill),
            iconSize: 34,
            color: scheme.primary,
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
          SilenceReactionRow(entryId: entry.id, size: 20),
        ],
      ),
    );
  }
}

/// Post-first-vote reveal — the marketplace bridge delivered at the moment
/// of peak engagement, plus the "one of these was a machine" twist once a
/// judge has voted on the planted agent take.
class _RevealCard extends StatelessWidget {
  final Map<int, int> votes;
  final List<SilenceEntryView> entries;
  const _RevealCard({required this.votes, required this.entries});

  @override
  Widget build(BuildContext context) {
    if (votes.isEmpty) return const SizedBox.shrink();
    final scheme = Theme.of(context).colorScheme;
    final caughtAgent = entries.any(
      (e) =>
          votes.containsKey(e.id) &&
          (e.isAiGenerated || kAgentEntryIds.contains(e.id)),
    );
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: scheme.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: scheme.primary.withValues(alpha: 0.3)),
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
                'machine — The Projectionist’s Apprentice. Could you tell?',
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
        Text(
          'Leaderboard',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        ...rows.take(5).map((r) {
          final winner = r.rank == 1;
          return Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: winner
                ? BoxDecoration(
                    color: const Color(0xFFFFC107).withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: const Color(0xFFFFC107).withValues(alpha: 0.3),
                    ),
                  )
                : BoxDecoration(
                    color: const Color(0xFF16131F),
                    borderRadius: BorderRadius.circular(14),
                  ),
            child: ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
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
