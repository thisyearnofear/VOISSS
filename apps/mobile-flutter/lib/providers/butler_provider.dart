import 'package:flutter/foundation.dart';
import '../services/butler/butler_service.dart';
import '../services/butler/serverpod_butler_service.dart';

/// Provider for managing Butler state and interactions
class ButlerProvider extends ChangeNotifier {
  final ButlerServiceInterface _butlerService = ServerpodButlerService();
  
  List<ButlerMessage> _messages = [];
  bool _isLoading = false;
  bool _isTyping = false;
  List<String> _suggestions = [];
  
  // Getters
  List<ButlerMessage> get messages => List.unmodifiable(_messages);
  bool get isLoading => _isLoading;
  bool get isTyping => _isTyping;
  List<String> get suggestions => _suggestions;
  
  // Stream subscription for real-time messages
  Stream<ButlerMessage> get messageStream => _butlerService.messageStream;

  ButlerProvider() {
    _initialize();
  }

  void _initialize() {
    // Add welcome message
    _addMessage(ButlerMessage(
      id: 'welcome',
      content: 'Hello! I\'m your VOISSS Butler. 🎙️\n\n'
          'I can help you:\n'
          '• Transcribe and summarize your recordings\n'
          '• Find specific recordings\n'
          '• Extract action items and tasks\n'
          '• Answer questions about your voice memos\n\n'
          'Try asking me something or send me a recording!',
      isFromUser: false,
      timestamp: DateTime.now(),
    ));

    // Listen for incoming messages
    _butlerService.messageStream.listen((message) {
      _addMessage(message);
    });

    // Load initial suggestions
    _loadSuggestions();
  }

  void _addMessage(ButlerMessage message) {
    _messages.add(message);
    notifyListeners();
  }

  /// Send a message to the Butler
  Future<void> sendMessage(String content, {String? recordingId}) async {
    if (content.trim().isEmpty) return;

    // Add user message
    final userMessage = ButlerMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      content: content,
      isFromUser: true,
      timestamp: DateTime.now(),
      recordingId: recordingId,
    );
    _addMessage(userMessage);

    // Show typing indicator
    _isTyping = true;
    notifyListeners();

    try {
      // Get context from recent recordings if available
      final context = recordingId != null ? {'recordingId': recordingId} : null;

      // Send to Butler service
      final response = await _butlerService.sendMessage(
        content,
        recordingId: recordingId,
        context: context,
      );

      _addMessage(response);
    } catch (e) {
      _addMessage(ButlerMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: 'I apologize, but I encountered an error. Please try again.',
        isFromUser: false,
        timestamp: DateTime.now(),
      ));
    } finally {
      _isTyping = false;
      notifyListeners();
    }
  }

  /// Send a recording to the Butler for analysis
  Future<void> analyzeRecording(String recordingId, String audioUrl) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _butlerService.sendAudioRecording(
        recordingId,
        audioUrl,
        prompt: 'Please transcribe this recording and provide a brief summary.',
      );

      _addMessage(response);
    } catch (e) {
      _addMessage(ButlerMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: 'I had trouble analyzing that recording. Please try again.',
        isFromUser: false,
        timestamp: DateTime.now(),
        recordingId: recordingId,
      ));
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Quick action: Transcribe recording
  Future<void> transcribeRecording(String recordingId, String audioUrl) async {
    await sendMessage(
      'Please transcribe this recording for me.',
      recordingId: recordingId,
    );
  }

  /// Quick action: Summarize recording
  Future<void> summarizeRecording(String recordingId, String audioUrl) async {
    await sendMessage(
      'Please provide a summary of this recording.',
      recordingId: recordingId,
    );
  }

  /// Quick action: Extract action items
  Future<void> extractActionItems(String recordingId, String audioUrl) async {
    await sendMessage(
      'What are the action items or tasks mentioned in this recording?',
      recordingId: recordingId,
    );
  }

  /// Search for recordings via Butler
  Future<void> searchRecordings(String query) async {
    _isLoading = true;
    notifyListeners();

    try {
      final results = await _butlerService.findRecordings(query);
      
      if (results.isEmpty) {
        _addMessage(ButlerMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          content: 'I couldn\'t find any recordings matching "$query". Try different keywords?',
          isFromUser: false,
          timestamp: DateTime.now(),
        ));
      } else {
        final recordingList = results.map((r) => '• ${r['title']}').join('\n');
        _addMessage(ButlerMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          content: 'I found ${results.length} recording(s) matching "$query":\n\n$recordingList',
          isFromUser: false,
          timestamp: DateTime.now(),
          metadata: {'results': results},
        ));
      }
    } catch (e) {
      _addMessage(ButlerMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: 'I had trouble searching. Please try again.',
        isFromUser: false,
        timestamp: DateTime.now(),
      ));
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load Butler suggestions
  Future<void> _loadSuggestions() async {
    try {
      _suggestions = await _butlerService.getSuggestions();
      notifyListeners();
    } catch (e) {
      // Use default suggestions
      _suggestions = [
        'Summarize my latest recording',
        'Find recordings about work',
        'What did I record yesterday?',
        'Transcribe my last voice memo',
      ];
      notifyListeners();
    }
  }

  /// Clear chat history
  void clearChat() {
    _messages.clear();
    _initialize();
  }

  @override
  void dispose() {
    _butlerService.dispose();
    super.dispose();
  }
}
