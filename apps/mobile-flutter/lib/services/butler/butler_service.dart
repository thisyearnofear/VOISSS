import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/serverpod_config.dart';

/// Message types for Butler chat
enum ButlerMessageType {
  text,
  audio,
  transcription,
  summary,
  action,
}

/// A message in the Butler chat
class ButlerMessage {
  final String id;
  final String content;
  final bool isFromUser;
  final ButlerMessageType type;
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;
  final String? audioUrl;
  final String? recordingId;

  ButlerMessage({
    required this.id,
    required this.content,
    required this.isFromUser,
    this.type = ButlerMessageType.text,
    required this.timestamp,
    this.metadata,
    this.audioUrl,
    this.recordingId,
  });

  factory ButlerMessage.fromJson(Map<String, dynamic> json) {
    return ButlerMessage(
      id: json['id'],
      content: json['content'],
      isFromUser: json['isFromUser'],
      type: ButlerMessageType.values.byName(json['type'] ?? 'text'),
      timestamp: DateTime.parse(json['timestamp']),
      metadata: json['metadata'],
      audioUrl: json['audioUrl'],
      recordingId: json['recordingId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'isFromUser': isFromUser,
      'type': type.name,
      'timestamp': timestamp.toIso8601String(),
      'metadata': metadata,
      'audioUrl': audioUrl,
      'recordingId': recordingId,
    };
  }
}

/// Butler capabilities and actions
enum ButlerAction {
  transcribeRecording,
  summarizeRecording,
  findRecording,
  createTask,
  setReminder,
  answerQuestion,
  generateReport,
}

/// Service for interacting with the AI Butler via Serverpod
class ButlerService {
  final String _baseUrl = ServerpodConfig.baseUrl;
  
  /// Stream controller for real-time butler messages
  final _messageController = StreamController<ButlerMessage>.broadcast();
  Stream<ButlerMessage> get messageStream => _messageController.stream;

  /// Send a text message to the Butler
  Future<ButlerMessage> sendMessage(
    String message, {
    String? recordingId,
    Map<String, dynamic>? context,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/butler/chat'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'message': message,
          'recordingId': recordingId,
          'context': context,
          'timestamp': DateTime.now().toIso8601String(),
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final butlerMessage = ButlerMessage.fromJson(data);
        _messageController.add(butlerMessage);
        return butlerMessage;
      } else {
        throw Exception('Butler service error: ${response.body}');
      }
    } catch (e) {
      // Return a fallback message if server is unavailable
      return ButlerMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: 'I apologize, but I\'m having trouble connecting to my brain right now. Please try again in a moment.',
        isFromUser: false,
        timestamp: DateTime.now(),
      );
    }
  }

  /// Send an audio recording to the Butler for transcription/analysis
  Future<ButlerMessage> sendAudioRecording(
    String recordingId,
    String audioUrl, {
    String? prompt,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/butler/analyze-audio'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'recordingId': recordingId,
          'audioUrl': audioUrl,
          'prompt': prompt ?? 'Transcribe and summarize this recording',
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return ButlerMessage.fromJson(data);
      } else {
        throw Exception('Audio analysis failed: ${response.body}');
      }
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

  /// Ask Butler to find recordings matching criteria
  Future<List<Map<String, dynamic>>> findRecordings(String query) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/butler/find-recordings'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'query': query}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['recordings'] ?? []);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// Get Butler insights about user's recording patterns
  Future<Map<String, dynamic>?> getInsights() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/butler/insights'),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Get suggested actions from Butler based on recent recordings
  Future<List<String>> getSuggestions() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/butler/suggestions'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<String>.from(data['suggestions'] ?? []);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  void dispose() {
    _messageController.close();
  }
}
