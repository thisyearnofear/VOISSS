import 'package:flutter/material.dart';

/// Input bar for Butler chat
class ButlerInputBar extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final VoidCallback onSend;
  final VoidCallback onVoiceInput;

  const ButlerInputBar({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.onSend,
    required this.onVoiceInput,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        border: Border(
          top: BorderSide(color: Colors.grey[800]!, width: 0.5),
        ),
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Voice input button
            IconButton(
              icon: const Icon(Icons.mic, color: Color(0xFF7C5DFA)),
              onPressed: onVoiceInput,
            ),
            
            // Text input
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFF2A2A2A),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: controller,
                  focusNode: focusNode,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'Ask your Butler...',
                    hintStyle: TextStyle(color: Colors.grey),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 12),
                  ),
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => onSend(),
                  maxLines: null,
                  minLines: 1,
                ),
              ),
            ),
            
            // Send button
            ValueListenableBuilder<TextEditingValue>(
              valueListenable: controller,
              builder: (context, value, child) {
                final hasText = value.text.trim().isNotEmpty;
                return IconButton(
                  icon: Icon(
                    Icons.send,
                    color: hasText ? const Color(0xFF7C5DFA) : Colors.grey,
                  ),
                  onPressed: hasText ? onSend : null,
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
