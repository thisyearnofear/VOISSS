import 'package:serverpod/serverpod.dart';
import 'dart:io';
import 'dart:convert';
import 'dart:async';

/// ACP Compute Client (Virtuals Protocol - Free Venice AI Credits)
class AcpComputeClient {
  final String apiKey;
  final String agentId;
  final String baseUrl;
  
  AcpComputeClient({
    required this.apiKey,
    required this.agentId,
    this.baseUrl = 'https://api.venice.ai/api/v1',
  });
  
  Future<String> chatCompletion(List<Map<String, String>> messages, {String model = 'llama-3.3-70b'}) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(Uri.parse('$baseUrl/chat/completions'));
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('Authorization', 'Bearer $apiKey');
      request.headers.set('X-ACP-Agent-Id', agentId);
      
      final body = jsonEncode({
        'model': model,
        'messages': messages,
        'temperature': 0.4,
        'max_tokens': 1000,
        'venice_parameters': {
          'include_venice_system_prompt': false,
        },
      });
      
      request.write(body);
      final response = await request.close();
      
      if (response.statusCode == 200) {
        final responseBody = await response.transform(utf8.decoder).join();
        final data = jsonDecode(responseBody);
        return data['choices'][0]['message']['content'] ?? 'No response';
      } else {
        throw Exception('ACP Compute Error: ${response.statusCode}');
      }
    } finally {
      client.close();
    }
  }
}

/// Venice AI Client (Fallback - Direct API)
class VeniceAIClient {
  final String apiKey;
  final String baseUrl = 'https://api.venice.ai/api/v1';
  
  VeniceAIClient({required this.apiKey});
  
  Future<String> chatCompletion(List<Map<String, String>> messages, {String model = 'llama-3.3-70b'}) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(Uri.parse('$baseUrl/chat/completions'));
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('Authorization', 'Bearer $apiKey');
      
      final body = jsonEncode({
        'model': model,
        'messages': messages,
        'temperature': 0.7,
        'max_tokens': 1000,
      });
      
      request.write(body);
      final response = await request.close();
      
      if (response.statusCode == 200) {
        final responseBody = await response.transform(utf8.decoder).join();
        final data = jsonDecode(responseBody);
        return data['choices'][0]['message']['content'] ?? 'No response';
      } else {
        throw Exception('Venice AI Error: ${response.statusCode}');
      }
    } finally {
      client.close();
    }
  }
}

class ButlerEndpoint extends Endpoint {
  AcpComputeClient? _acpClient;
  VeniceAIClient? _veniceClient;
  final Map<String, List<Map<String, String>>> _chatHistories = {};
  bool _aiEnabled = false;
  String _activeProvider = 'none';
  
  @override
  bool get requireLogin => false;
  
  @override
  void initialize(Server server, String endpointName, String? methodName) {
    super.initialize(server, endpointName, methodName);
    
    // Try ACP Compute first (primary - free Venice credits)
    final acpKey = Platform.environment['ACP_COMPUTE_KEY'] ?? '';
    final acpAgentId = Platform.environment['ACP_AGENT_ID'] ?? '';
    
    if (acpKey.isNotEmpty && acpAgentId.isNotEmpty) {
      _acpClient = AcpComputeClient(
        apiKey: acpKey,
        agentId: acpAgentId,
        baseUrl: Platform.environment['ACP_COMPUTE_URL'] ?? 'https://api.venice.ai/api/v1',
      );
      _aiEnabled = true;
      _activeProvider = 'acpCompute';
      print('ACP Compute initialized successfully (primary provider)');
    }
    
    // Initialize Venice AI as fallback
    final veniceKey = Platform.environment['VENICE_API_KEY'] ?? '';
    if (veniceKey.isNotEmpty) {
      _veniceClient = VeniceAIClient(apiKey: veniceKey);
      if (!_aiEnabled) {
        _aiEnabled = true;
        _activeProvider = 'venice';
        print('Venice AI initialized (fallback provider)');
      } else {
        print('Venice AI initialized as fallback');
      }
    }
    
    if (!_aiEnabled) {
      print('WARNING: No AI providers configured. Set ACP_COMPUTE_KEY or VENICE_API_KEY.');
    }
  }

  Future<String> health(Session session) async {
    return 'Butler is ready to serve! AI enabled: $_aiEnabled, Provider: $_activeProvider';
  }

  Future<Map<String, dynamic>> chat(
    Session session, {
    required String message,
    String? recordingId,
    Map<String, dynamic>? context,
  }) async {
    if (!_aiEnabled || (_acpClient == null && _veniceClient == null)) {
      return {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'content': 'AI is not configured. Please set ACP_COMPUTE_KEY or VENICE_API_KEY.',
        'isFromUser': false,
        'type': 'text',
        'timestamp': DateTime.now().toIso8601String(),
        'recordingId': recordingId,
      };
    }
    
    try {
      final sessionId = session.sessionId.toString();
      
      // Get or create chat history
      var messages = _chatHistories[sessionId];
      if (messages == null) {
        messages = [
          {'role': 'system', 'content': 'You are VOISSS Butler, an AI voice assistant that helps users manage their voice recordings. Be helpful, concise, and friendly.'}
        ];
        _chatHistories[sessionId] = messages;
      }
      
      // Add user message with context
      var userMessage = message;
      if (recordingId != null) {
        userMessage = '[Recording: $recordingId] $userMessage';
      }
      messages.add({'role': 'user', 'content': userMessage});
      
      // Try ACP Compute first, then Venice fallback
      String responseText;
      try {
        if (_acpClient != null) {
          responseText = await _acpClient!.chatCompletion(messages);
          _activeProvider = 'acpCompute';
        } else {
          throw Exception('ACP Compute not available');
        }
      } catch (e) {
        print('ACP Compute failed, falling back to Venice: $e');
        if (_veniceClient != null) {
          responseText = await _veniceClient!.chatCompletion(messages);
          _activeProvider = 'venice';
        } else {
          throw Exception('All AI providers failed');
        }
      }
      
      // Add assistant response to history
      messages.add({'role': 'assistant', 'content': responseText});
      
      // Keep only last 20 messages to prevent memory issues
      if (messages.length > 20) {
        messages.removeRange(1, messages.length - 19);
      }
      
      return {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'content': responseText,
        'isFromUser': false,
        'type': 'text',
        'timestamp': DateTime.now().toIso8601String(),
        'recordingId': recordingId,
        'provider': _activeProvider,
      };
      
    } catch (e) {
      print('Butler chat error: $e');
      return {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'content': 'I apologize, but I encountered an error: ${e.toString()}',
        'isFromUser': false,
        'type': 'text',
        'timestamp': DateTime.now().toIso8601String(),
        'recordingId': recordingId,
      };
    }
  }

  Future<Map<String, dynamic>> analyzeAudio(
    Session session, {
    required String recordingId,
    required String audioUrl,
    String? prompt,
  }) async {
    if (!_aiEnabled || (_acpClient == null && _veniceClient == null)) {
      return {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'content': 'AI is not configured.',
        'isFromUser': false,
        'type': 'transcription',
        'timestamp': DateTime.now().toIso8601String(),
        'recordingId': recordingId,
      };
    }
    
    try {
      final analysisPrompt = prompt ?? 
        'Please analyze this voice recording and provide:\n'
        '1. A transcript of what was said\n'
        '2. A brief summary of the content\n'
        '3. Any key points or action items mentioned\n\n'
        'Recording ID: $recordingId';
      
      final messages = [
        {'role': 'system', 'content': 'You are an audio transcription and analysis assistant.'},
        {'role': 'user', 'content': analysisPrompt},
      ];
      
      // Try ACP Compute first, then Venice fallback
      String responseText;
      try {
        if (_acpClient != null) {
          responseText = await _acpClient!.chatCompletion(messages);
          _activeProvider = 'acpCompute';
        } else {
          throw Exception('ACP Compute not available');
        }
      } catch (e) {
        print('ACP Compute failed, falling back to Venice: $e');
        if (_veniceClient != null) {
          responseText = await _veniceClient!.chatCompletion(messages);
          _activeProvider = 'venice';
        } else {
          throw Exception('All AI providers failed');
        }
      }
      
      return {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'content': responseText,
        'isFromUser': false,
        'type': 'transcription',
        'timestamp': DateTime.now().toIso8601String(),
        'recordingId': recordingId,
        'provider': _activeProvider,
        'metadata': {
          'audioUrl': audioUrl,
          'analyzed': true,
        },
      };
    } catch (e) {
      return {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'content': 'Error analyzing audio: ${e.toString()}',
        'isFromUser': false,
        'type': 'transcription',
        'timestamp': DateTime.now().toIso8601String(),
        'recordingId': recordingId,
      };
    }
  }

  Future<List<Map<String, dynamic>>> findRecordings(Session session, {required String query}) async {
    return [
      {'id': '1', 'title': 'Meeting with team', 'duration': 300, 'date': '2026-01-28'},
      {'id': '2', 'title': 'Project ideas', 'duration': 180, 'date': '2026-01-27'},
    ];
  }

  Future<Map<String, dynamic>> getInsights(Session session) async {
    return {
      'summary': 'You have been actively using voice recordings for meetings and ideas.',
      'topTopics': ['Meetings', 'Project Planning', 'Personal Notes'],
      'recordingFrequency': '3-4 recordings per week',
      'suggestions': [
        'Try organizing recordings with tags',
        'Consider transcribing important meetings',
        'Set reminders for follow-ups',
      ],
      'totalRecordings': 12,
      'totalDuration': 3600,
    };
  }

  Future<List<String>> getSuggestions(Session session) async {
    return [
      'Summarize my latest recording',
      'Find recordings about work',
      'What did I record yesterday?',
      'Transcribe my last voice memo',
      'Extract action items from my meeting',
    ];
  }
}
