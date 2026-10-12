import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/silence_provider.dart';

/// Reaction-tap voting — one tap casts a vote (mapped to the 1–5 int the
/// backend expects) instead of asking people to score comedy numerically.
class SilenceReactionRow extends StatelessWidget {
  static const reactions = <String, int>{'😂': 5, '🔥': 4, '💀': 3};

  final int entryId;
  final double size;
  const SilenceReactionRow({super.key, required this.entryId, this.size = 28});

  @override
  Widget build(BuildContext context) {
    final myScore = context
        .watch<SilenceProvider>()
        .myVotes[entryId];
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: reactions.entries.map((r) {
        final selected = myScore == r.value;
        return _ReactionButton(
          emoji: r.key,
          selected: selected,
          size: size,
          onTap: () => context.read<SilenceProvider>().vote(entryId, r.value),
        );
      }).toList(),
    );
  }
}

class _ReactionButton extends StatefulWidget {
  final String emoji;
  final bool selected;
  final double size;
  final VoidCallback onTap;
  const _ReactionButton({
    required this.emoji,
    required this.selected,
    required this.size,
    required this.onTap,
  });

  @override
  State<_ReactionButton> createState() => _ReactionButtonState();
}

class _ReactionButtonState extends State<_ReactionButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pop = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 250),
  );

  @override
  void dispose() {
    _pop.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: () {
        _pop.forward(from: 0);
        widget.onTap();
      },
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: ScaleTransition(
          scale: Tween(begin: 1.0, end: 1.35).animate(
            CurvedAnimation(parent: _pop, curve: Curves.elasticOut),
          ),
          child: Text(
            widget.emoji,
            style: TextStyle(
              fontSize: widget.size,
              color: widget.selected ? null : Colors.grey.withValues(alpha: 0.35),
            ),
          ),
        ),
      ),
    );
  }
}
