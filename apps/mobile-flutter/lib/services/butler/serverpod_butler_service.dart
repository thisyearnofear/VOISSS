import 'package:voisss_butler_client/voisss_butler_client.dart';
import 'package:serverpod_flutter/serverpod_flutter.dart';
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
        context: context,
      );
      
      return ButlerMessage(
        id: response['id'] as String,
        content: response['content'] as String,
        isFromUser: false,
        type: ButlerMessageType.text,
        timestamp: DateTime.parse(response['timestamp'] as String),
        recordingId: response['recordingId'] as String?,
      );
    } catch (e) {
      return ButlerMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: 'Sorry, I had trouble connecting to my brain. Please try again.',
        isFromUser: false,
        timestamp: DateTime.now(),
      );
    }
  }

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
      
      return ButlerMessage(
        id: response['id'] as String,
        content: response['content'] as String,
        isFromUser: false,
        type: ButlerMessageType.transcription,
        timestamp: DateTime.parse(response['timestamp'] as String),
        recordingId: response['recordingId'] as String?,
      );
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
  Future<List<Map<String, dynamic>>> findRecordings(String query) async {
    try {
      return await _client.butler.findRecordings(query: query);
    } catch (e) {
      return [];
    }
  }

  @override
  Future<Map<String, dynamic>?> getInsights() async {
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
  
  Future<ButlerMessage> sendAudioRecording(
    String recordingId,
    String audioUrl, {
    String? prompt,
  });
  
  Future<List<Map<String, dynamic>>> findRecordings(String query);
  
  Future<Map<String, dynamic>?> getInsights();
  
  Future<List<String>> getSuggestions();
  
  Future<String> healthCheck();
  
  void dispose();
}
