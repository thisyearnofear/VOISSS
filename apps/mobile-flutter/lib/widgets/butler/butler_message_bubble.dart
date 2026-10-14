import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../services/butler/butler_service.dart';

/// Message bubble for Butler chat
class ButlerMessageBubble extends StatelessWidget {
  final ButlerMessage message;
  final VoidCallback? onRecordingTap;

  const ButlerMessageBubble({
    super.key,
    required this.message,
    this.onRecordingTap,
  });

  @override
  Widget build(BuildContext context) {
    final isUser = message.isFromUser;
    
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.85,
        ),
        child: Column(
          crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            // Message bubble
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: isUser
                    ? const LinearGradient(
                        colors: [Color(0xFF7C5DFA), Color(0xFF9B7BFF)],
                      )
                    : null,
                color: isUser ? null : const Color(0xFF2A2A2A),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(20),
                  topRight: const Radius.circular(20),
                  bottomLeft: Radius.circular(isUser ? 20 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 20),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Recording reference badge
                  if (message.recordingId != null)
                    GestureDetector(
                      onTap: onRecordingTap,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.mic,
                              size: 14,
                              color: isUser ? Colors.white70 : const Color(0xFF7C5DFA),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Recording',
                              style: TextStyle(
                                fontSize: 12,
                                color: isUser ? Colors.white70 : const Color(0xFF7C5DFA),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  
                  // Structured tool result card (leaderboard, clips, …)
                  if (message.card != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _ButlerCard(card: message.card!),
                    ),

                  // Message content
                  if (message.type == ButlerMessageType.text)
                    MarkdownBody(
                      data: message.content,
                      styleSheet: MarkdownStyleSheet(
                        p: TextStyle(
                          color: isUser ? Colors.white : Colors.grey[300],
                          fontSize: 15,
                          height: 1.5,
                        ),
                        strong: TextStyle(
                          color: isUser ? Colors.white : Colors.grey[300],
                          fontWeight: FontWeight.bold,
                        ),
                        em: TextStyle(
                          color: isUser ? Colors.white70 : Colors.grey[400],
                          fontStyle: FontStyle.italic,
                        ),
                        listBullet: TextStyle(
                          color: isUser ? Colors.white : Colors.grey[300],
                        ),
                      ),
                    )
                  else if (message.content.isNotEmpty)
                    Text(
                      message.content,
                      style: TextStyle(
                        color: isUser ? Colors.white : Colors.grey[300],
                        fontSize: 15,
                        height: 1.5,
                      ),
                    ),
                ],
              ),
            ),
            
            // Timestamp
            Padding(
              padding: const EdgeInsets.only(top: 4, left: 4, right: 4),
              child: Text(
                _formatTime(message.timestamp),
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey[600],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final messageDate = DateTime(time.year, time.month, time.day);
    
    if (messageDate == today) {
      return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
    } else {
      return '${time.day}/${time.month} ${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
    }
  }
}

/// Structured tool-result card inside a Butler bubble — the generative-UI
/// payload the model asked for via a tool call (leaderboard, clips, entries).
class _ButlerCard extends StatelessWidget {
  final ButlerCardData card;

  const _ButlerCard({required this.card});

  IconData get _icon => switch (card.kind) {
        'leaderboard' => Icons.emoji_events_outlined,
        'clips' => Icons.movie_outlined,
        'entries' => Icons.graphic_eq,
        _ => Icons.info_outline,
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.25),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF7C5DFA).withOpacity(0.35)),
      ),
      padding: const EdgeInsets.all(10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(_icon, size: 15, color: const Color(0xFF9B7BFF)),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  card.title ?? 'Result',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF9B7BFF),
                    letterSpacing: 0.3,
                  ),
                ),
              ),
            ],
          ),
          if (card.items.isNotEmpty) const SizedBox(height: 8),
          ...card.items.map(
            (item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.title,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Colors.white,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (item.subtitle != null)
                          Text(
                            item.subtitle!,
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[500],
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (item.audioUrl != null)
                    const Padding(
                      padding: EdgeInsets.only(right: 6),
                      child: Icon(Icons.play_circle_outline,
                          size: 18, color: Color(0xFF9B7BFF)),
                    ),
                  if (item.trailing != null)
                    Text(
                      item.trailing!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF9B7BFF),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
