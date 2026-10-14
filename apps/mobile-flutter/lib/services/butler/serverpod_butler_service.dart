import 'package:voisss_butler_client/voisss_butler_client.dart';
import 'butler_service.dart';

/// Serverpod implementation of the Butler service
class ServerpodButlerService implements ButlerServiceInterface {
  late final Client _client;
  
  ServerpodButlerService() {
    // Create the Serverpod client pointing to your Hetzner server
    // Uses HTTPS through Nginx reverse proxy
    _client = Client(
      'https://butler.voisss.famile.xyz/',
    );
  }

  @override
  Future<ButlerMessage> sendMessage(
    String message, {
    String? recordingId,
    Map<String, dynamic>? context,
  }) async {
    try {
      final response = await _client.butler.chat(
        message: message,
        recordingId: recordingId,
      );
      return _toMessage(response);
    } catch (e) {
      return ButlerMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: 'Sorry, I had trouble connecting to my brain. Please try again.',
        isFromUser: false,
        timestamp: DateTime.now(),
      );
    }
  }

  /// Streaming variant — yields the generated [ButlerStreamEvent]s so the
  /// caller can render tokens as they land (`delta`), swap in the final
  /// message on `done`, or show `error` text.
  @override
  Stream<ButlerStreamEvent> sendMessageStream(
    String message, {
    String? recordingId,
  }) =>
      _client.butler.chatStream(message: message, recordingId: recordingId);

  ButlerMessage _toMessage(ButlerChatResponse response) => ButlerMessage(
        id: response.id,
        content: response.content,
        isFromUser: response.isFromUser,
        type: response.type == 'transcription'
            ? ButlerMessageType.transcription
            : ButlerMessageType.text,
        timestamp: response.timestamp.toLocal(),
        recordingId: response.recordingId,
        metadata: response.provider != null
            ? {'provider': response.provider}
            : null,
      );

  @override
  Future<ButlerMessage> sendAudioRecording(
    String recordingId,
    String audioUrl, {
    String? prompt,
  }) async {
    try {
      final response = await _client.butler.analyzeAudio(
        recordingId: recordingId,
        audioUrl: audioUrl,
        prompt: prompt,
      );
      return _toMessage(response);
    } catch (e) {
      return ButlerMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: 'I had trouble analyzing that recording. Please try again.',
        isFromUser: false,
        type: ButlerMessageType.text,
        timestamp: DateTime.now(),
        recordingId: recordingId,
      );
    }
  }

  @override
  Future<List<ButlerRecording>> findRecordings(String query) async {
    try {
      return await _client.butler.findRecordings(query: query);
    } catch (e) {
      return [];
    }
  }

  @override
  Future<ButlerInsights?> getInsights() async {
    try {
      return await _client.butler.getInsights();
    } catch (e) {
      return null;
    }
  }

  @override
  Future<List<String>> getSuggestions() async {
    try {
      return await _client.butler.getSuggestions();
    } catch (e) {
      return [
        'Summarize my latest recording',
        'Find recordings about work',
        'What did I record yesterday?',
      ];
    }
  }

  @override
  Future<String> healthCheck() async {
    try {
      return await _client.butler.health();
    } catch (e) {
      return 'Butler service unavailable';
    }
  }

  @override
  Stream<ButlerMessage> get messageStream => const Stream.empty();

  @override
  void dispose() {
    // Client doesn't need explicit disposal
  }
}

/// Interface for Butler service
abstract class ButlerServiceInterface {
  Stream<ButlerMessage> get messageStream;
  
  Future<ButlerMessage> sendMessage(
    String message, {
    String? recordingId,
    Map<String, dynamic>? context,
  });

  Stream<ButlerStreamEvent> sendMessageStream(
    String message, {
    String? recordingId,
  });
  
  Future<ButlerMessage> sendAudioRecording(
    String recordingId,
    String audioUrl, {
    String? prompt,
  });
  
  Future<List<ButlerRecording>> findRecordings(String query);

  Future<ButlerInsights?> getInsights();
  
  Future<List<String>> getSuggestions();
  
  Future<String> healthCheck();
  
  void dispose();
}
