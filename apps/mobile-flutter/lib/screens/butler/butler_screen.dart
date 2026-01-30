import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/butler_provider.dart';
import '../../services/butler/butler_service.dart';
import '../../widgets/butler/butler_message_bubble.dart';
import '../../widgets/butler/butler_input_bar.dart';
import '../../widgets/butler/butler_suggestions.dart';
import '../../widgets/butler/butler_typing_indicator.dart';

/// Main screen for interacting with the VOISSS Butler
class ButlerScreen extends StatefulWidget {
  final String? initialRecordingId;
  final String? initialPrompt;

  const ButlerScreen({
    super.key,
    this.initialRecordingId,
    this.initialPrompt,
  });

  @override
  State<ButlerScreen> createState() => _ButlerScreenState();
}

class _ButlerScreenState extends State<ButlerScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _textController = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    
    // Handle initial prompt if provided
    if (widget.initialPrompt != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.read<ButlerProvider>().sendMessage(
          widget.initialPrompt!,
          recordingId: widget.initialRecordingId,
        );
      });
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _textController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _sendMessage() {
    final text = _textController.text.trim();
    if (text.isNotEmpty) {
      context.read<ButlerProvider>().sendMessage(text);
      _textController.clear();
      _focusNode.requestFocus();
      
      // Scroll to bottom after message is added
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF7C5DFA), Color(0xFF9B7BFF)],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                Icons.assistant,
                color: Colors.white,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'VOISSS Butler',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'Your AI Voice Assistant',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                    fontWeight: FontWeight.normal,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: _showOptions,
          ),
        ],
      ),
      body: Column(
        children: [
          // Chat messages
          Expanded(
            child: Consumer<ButlerProvider>(
              builder: (context, provider, child) {
                final messages = provider.messages;
                
                // Auto-scroll when messages change
                WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
                
                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length + (provider.isTyping ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == messages.length && provider.isTyping) {
                      return const ButlerTypingIndicator();
                    }
                    
                    final message = messages[index];
                    return ButlerMessageBubble(
                      message: message,
                      onRecordingTap: message.recordingId != null
                          ? () => _openRecording(message.recordingId!)
                          : null,
                    );
                  },
                );
              },
            ),
          ),

          // Suggestions (only show when not typing)
          Consumer<ButlerProvider>(
            builder: (context, provider, child) {
              if (provider.isTyping || provider.messages.length > 2) {
                return const SizedBox.shrink();
              }
              return ButlerSuggestions(
                suggestions: provider.suggestions,
                onSuggestionTap: (suggestion) {
                  _textController.text = suggestion;
                  _sendMessage();
                },
              );
            },
          ),

          // Input bar
          ButlerInputBar(
            controller: _textController,
            focusNode: _focusNode,
            onSend: _sendMessage,
            onVoiceInput: _startVoiceInput,
          ),
        ],
      ),
    );
  }

  void _showOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.clear_all, color: Colors.white),
              title: const Text('Clear Chat', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                context.read<ButlerProvider>().clearChat();
              },
            ),
            ListTile(
              leading: const Icon(Icons.history, color: Colors.white),
              title: const Text('View Recording History', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                // Navigate to recordings
              },
            ),
            ListTile(
              leading: const Icon(Icons.help_outline, color: Colors.white),
              title: const Text('Help & Tips', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                _showHelp();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showHelp() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Butler Help', style: TextStyle(color: Colors.white)),
        content: const SingleChildScrollView(
          child: Text(
            'Your VOISSS Butler can help you:\n\n'
            '• Transcribe voice recordings\n'
            '• Summarize long recordings\n'
            '• Find recordings by content\n'
            '• Extract action items\n'
            '• Answer questions about your recordings\n\n'
            'Just type or speak naturally!',
            style: TextStyle(color: Colors.grey),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }

  void _startVoiceInput() {
    // TODO: Implement speech-to-text for voice commands
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Voice input coming soon!')),
    );
  }

  void _openRecording(String recordingId) {
    // TODO: Navigate to recording detail screen
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Opening recording $recordingId')),
    );
  }
}
