import 'package:serverpod/serverpod.dart';
import 'dart:io';
import 'dart:convert';
import 'dart:async';
import 'generated/protocol.dart';

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

/// LLM chat client (Venice by default; any OpenAI-compatible endpoint via
/// BUTLER_LLM_URL — e.g. Featherless — aligns Butler with the same provider
/// the Silence AI voices use).
class VeniceAIClient {
  final String apiKey;
  final String baseUrl;
  final String model;

  VeniceAIClient({
    required this.apiKey,
    this.baseUrl = 'https://api.venice.ai/api/v1',
    this.model = 'llama-3.3-70b',
  });

  Future<String> chatCompletion(List<Map<String, String>> messages, {String? model}) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(Uri.parse('$baseUrl/chat/completions'));
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('Authorization', 'Bearer $apiKey');
      request.headers.set('User-Agent', 'voisss-butler/1.0');

      final body = jsonEncode({
        'model': model ?? this.model,
        'messages': messages,
        'temperature': 0.7,
        'max_tokens': 1000,
      });

      request.write(body);
      final response =
          await request.close().timeout(const Duration(seconds: 45));

      if (response.statusCode == 200) {
        final responseBody = await response.transform(utf8.decoder).join();
        final data = jsonDecode(responseBody);
        return data['choices'][0]['message']['content'] ?? 'No response';
      } else {
        throw Exception('LLM provider error: ${response.statusCode}');
      }
    } finally {
      client.close();
    }
  }

  /// Token-streaming variant — OpenAI-compatible SSE (`stream: true`).
  Stream<String> chatCompletionStream(
      List<Map<String, String>> messages) async* {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 15);
    try {
      final request =
          await client.postUrl(Uri.parse('$baseUrl/chat/completions'));
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('Authorization', 'Bearer $apiKey');
      request.headers.set('User-Agent', 'voisss-butler/1.0');
      request.add(utf8.encode(jsonEncode({
        'model': model,
        'messages': messages,
        'temperature': 0.7,
        'max_tokens': 1000,
        'stream': true,
      })));
      final response =
          await request.close().timeout(const Duration(seconds: 45));
      if (response.statusCode != 200) {
        final errBody = await response.transform(utf8.decoder).join();
        throw Exception('LLM provider stream error: ${response.statusCode} '
            '${errBody.substring(0, errBody.length.clamp(0, 200))}');
      }
      await for (final line in response
          .transform(utf8.decoder)
          .transform(const LineSplitter())) {
        if (!line.startsWith('data:')) continue;
        final payload = line.substring(5).trim();
        if (payload == '[DONE]') break;
        try {
          final delta = (jsonDecode(payload)['choices'] as List)
              .first['delta']['content'] as String?;
          if (delta != null && delta.isNotEmpty) yield delta;
        } catch (_) {
          // Heartbeat/partial lines — skip.
        }
      }
    } finally {
      client.close();
    }
  }
}

class ButlerEndpoint extends Endpoint {
  AcpComputeClient? _acpClient;
  VeniceAIClient? _llmClient;
  VeniceAIClient? _veniceClient;
  final Map<String, List<Map<String, String>>> _chatHistories = {};
  bool _aiEnabled = false;
  String _activeProvider = 'none';
  
  @override
  bool get requireLogin => false;
  
  @override
  void initialize(Server server, String endpointName, String? methodName) {
    super.initialize(server, endpointName, methodName);
    
    // Primary: BUTLER_LLM_* — any OpenAI-compatible host (Featherless in
    // prod, aligned with the Silence AI voices).
    final llmKey = Platform.environment['BUTLER_LLM_KEY'] ?? '';
    if (llmKey.isNotEmpty) {
      _llmClient = VeniceAIClient(
        apiKey: llmKey,
        baseUrl: Platform.environment['BUTLER_LLM_URL'] ??
            'https://api.featherless.ai/v1',
        model: Platform.environment['BUTLER_LLM_MODEL'] ??
            'Qwen/Qwen3-Next-80B-A3B-Instruct',
      );
      _aiEnabled = true;
      _activeProvider = 'llm';
      print('LLM provider initialized (primary)');
    }
    
    // Secondary: Venice direct (VENICE_API_KEY → api.venice.ai).
    final veniceKey = Platform.environment['VENICE_API_KEY'] ?? '';
    if (veniceKey.isNotEmpty) {
      _veniceClient = VeniceAIClient(
        apiKey: veniceKey,
        baseUrl: 'https://api.venice.ai/api/v1',
        model: 'llama-3.3-70b',
      );
      if (!_aiEnabled) {
        _aiEnabled = true;
        _activeProvider = 'venice';
      }
      print('Venice initialized (fallback)');
    }
    
    // Last resort: ACP Compute (Virtuals Protocol free Venice credits) —
    // only attempted when both creds are configured.
    final acpKey = Platform.environment['ACP_COMPUTE_KEY'] ?? '';
    final acpAgentId = Platform.environment['ACP_AGENT_ID'] ?? '';
    if (acpKey.isNotEmpty && acpAgentId.isNotEmpty) {
      _acpClient = AcpComputeClient(
        apiKey: acpKey,
        agentId: acpAgentId,
        baseUrl: Platform.environment['ACP_COMPUTE_URL'] ?? 'https://api.venice.ai/api/v1',
      );
      if (!_aiEnabled) {
        _aiEnabled = true;
        _activeProvider = 'acpCompute';
      }
      print('ACP Compute initialized (last-resort fallback)');
    }
    
    if (!_aiEnabled) {
      print('WARNING: No AI providers configured. Set BUTLER_LLM_KEY or VENICE_API_KEY.');
    }
  }
  
  /// Provider chain: primary LLM → Venice → ACP (only configured providers
  /// are attempted). Records which one served the request.
  Future<String> _complete(List<Map<String, String>> messages) async {
    final chain = <(String, VeniceAIClient?)>[
      ('llm', _llmClient),
      ('venice', _veniceClient),
    ];
    Object? lastErr;
    for (final (name, client) in chain) {
      if (client == null) continue;
      try {
        final result = await client.chatCompletion(messages);
        _activeProvider = name;
        return result;
      } catch (e) {
        lastErr = e;
        print('$name provider failed: $e');
      }
    }
    if (_acpClient != null) {
      try {
        final result = await _acpClient!.chatCompletion(messages);
        _activeProvider = 'acpCompute';
        return result;
      } catch (e) {
        lastErr = e;
        print('acpCompute provider failed: $e');
      }
    }
    throw Exception('All AI providers failed: $lastErr');
  }

  Future<String> health(Session session) async {
    return 'Butler is ready to serve! AI enabled: $_aiEnabled, Provider: $_activeProvider';
  }

  ButlerChatResponse _response(String content, String? recordingId,
      {String type = 'text'}) {
    return ButlerChatResponse(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      content: content,
      isFromUser: false,
      type: type,
      timestamp: DateTime.now(),
      recordingId: recordingId,
      provider: _activeProvider == 'none' ? null : _activeProvider,
    );
  }

  List<Map<String, String>> _historyFor(Session session) {
    final sessionId = session.sessionId.toString();
    return _chatHistories.putIfAbsent(sessionId, () => [
          {
            'role': 'system',
            'content': 'You are VOISSS Butler, an AI voice assistant that '
                'helps users manage their voice recordings. Be helpful, '
                'concise, and friendly.'
          }
        ]);
  }

  void _trim(List<Map<String, String>> messages) {
    if (messages.length > 20) {
      messages.removeRange(1, messages.length - 19);
    }
  }

  Future<ButlerChatResponse> chat(
    Session session, {
    required String message,
    String? recordingId,
  }) async {
    if (!_aiEnabled) {
      return _response(
        'AI is not configured. Please set BUTLER_LLM_KEY or VENICE_API_KEY.',
        recordingId,
      );
    }
    try {
      final messages = _historyFor(session);
      var userMessage = message;
      if (recordingId != null) {
        userMessage = '[Recording: $recordingId] $userMessage';
      }
      messages.add({'role': 'user', 'content': userMessage});
      final responseText = await _complete(messages);
      messages.add({'role': 'assistant', 'content': responseText});
      _trim(messages);
      return _response(responseText, recordingId);
    } catch (e) {
      print('Butler chat error: $e');
      return _response('I apologize, but I encountered an error: $e',
          recordingId);
    }
  }

  /// Streaming chat — yields `delta` events as tokens land, then a final
  /// `done` event carrying the full [ButlerChatResponse]. Provider order is
  /// the same as [chat]: primary LLM → Venice → ACP (guarded). A provider
  /// is only skipped before it has emitted any deltas; a mid-stream failure
  /// surfaces an `error` event rather than silently restarting (which would
  /// emit a doubled answer).
  Stream<ButlerStreamEvent> chatStream(
    Session session, {
    required String message,
    String? recordingId,
  }) async* {
    if (!_aiEnabled) {
      yield ButlerStreamEvent(
          kind: 'error',
          text: 'AI is not configured on this server.');
      return;
    }

    final messages = _historyFor(session);
    var userMessage = message;
    if (recordingId != null) {
      userMessage = '[Recording: $recordingId] $userMessage';
    }
    messages.add({'role': 'user', 'content': userMessage});

    String? accumulated;
    var emitted = false;
    for (final (name, client) in <(String, VeniceAIClient?)>[
      ('llm', _llmClient),
      ('venice', _veniceClient),
    ]) {
      if (client == null || accumulated != null) continue;
      var emittedThisAttempt = false;
      try {
        final buf = StringBuffer();
        await for (final delta in client.chatCompletionStream(messages)) {
          buf.write(delta);
          emittedThisAttempt = true;
          emitted = true;
          yield ButlerStreamEvent(kind: 'delta', text: delta);
        }
        accumulated = buf.toString();
        _activeProvider = name;
      } catch (e) {
        print('$name stream failed: $e');
        if (emittedThisAttempt) {
          yield ButlerStreamEvent(
              kind: 'error', text: 'Response stream interrupted.');
          return;
        }
      }
    }

    // Last resort: ACP Compute — no stream support, emit as one delta.
    if (accumulated == null && _acpClient != null) {
      try {
        accumulated = await _acpClient!.chatCompletion(messages);
        _activeProvider = 'acpCompute';
        yield ButlerStreamEvent(kind: 'delta', text: accumulated);
      } catch (e) {
        print('acpCompute provider failed: $e');
      }
    }

    if (accumulated == null) {
      yield ButlerStreamEvent(
          kind: 'error',
          text: emitted
              ? 'Response stream interrupted.'
              : 'All AI providers failed. Please try again.');
      return;
    }

    messages.add({'role': 'assistant', 'content': accumulated});
    _trim(messages);
    yield ButlerStreamEvent(
        kind: 'done', response: _response(accumulated, recordingId));
  }

  Future<ButlerChatResponse> analyzeAudio(
    Session session, {
    required String recordingId,
    required String audioUrl,
    String? prompt,
  }) async {
    if (!_aiEnabled) {
      return _response('AI is not configured.', recordingId,
          type: 'transcription');
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
      final responseText = await _complete(messages);
      return _response(responseText, recordingId, type: 'transcription');
    } catch (e) {
      return _response('Error analyzing audio: $e', recordingId,
          type: 'transcription');
    }
  }

  Future<List<ButlerRecording>> findRecordings(Session session,
      {required String query}) async {
    return [
      ButlerRecording(
          id: '1',
          title: 'Meeting with team',
          duration: 300,
          date: '2026-01-28'),
      ButlerRecording(
          id: '2',
          title: 'Project ideas',
          duration: 180,
          date: '2026-01-27'),
    ];
  }

  Future<ButlerInsights> getInsights(Session session) async {
    return ButlerInsights(
      summary:
          'You have been actively using voice recordings for meetings and ideas.',
      topTopics: ['Meetings', 'Project Planning', 'Personal Notes'],
      recordingFrequency: '3-4 recordings per week',
      suggestions: [
        'Try organizing recordings with tags',
        'Consider transcribing important meetings',
        'Set reminders for follow-ups',
      ],
      totalRecordings: 12,
      totalDuration: 3600,
    );
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
