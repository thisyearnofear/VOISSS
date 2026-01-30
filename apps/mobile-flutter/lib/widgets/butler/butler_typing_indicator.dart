import 'package:flutter/material.dart';

/// Typing indicator for Butler
class ButlerTypingIndicator extends StatefulWidget {
  const ButlerTypingIndicator({super.key});

  @override
  State<ButlerTypingIndicator> createState() => _ButlerTypingIndicatorState();
}

class _ButlerTypingIndicatorState extends State<ButlerTypingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF2A2A2A),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildDot(0),
            const SizedBox(width: 4),
            _buildDot(1),
            const SizedBox(width: 4),
            _buildDot(2),
          ],
        ),
      ),
    );
  }

  Widget _buildDot(int index) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final delay = index * 0.2;
        final value = (_controller.value + delay) % 1.0;
        final opacity = 0.3 + (0.7 * (value < 0.5 ? value * 2 : (1 - value) * 2));
        
        return Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: const Color(0xFF7C5DFA).withOpacity(opacity),
            shape: BoxShape.circle,
          ),
        );
      },
    );
  }
}
