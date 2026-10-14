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

      // `write()` encodes latin-1 and throws on non-ASCII — send UTF-8 bytes.
      request.add(utf8.encode(body));
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
            'content': 'You are VOISSS Butler, an AI voice assistant inside '
                'the "Voice the Silence" silent-film voiceover contest app. '
                'Be helpful, concise, and friendly.\n\n'
                'You can call tools over the live contest data. When the '
                'user asks about contest clips, submitted voice entries, or '
                'the leaderboard, reply with EXACTLY one line as your '
                'ENTIRE response — no other text:\n'
                '<<tool:NAME {"arg": value}>>\n'
                'Available tools:\n'
                '- list_clips {} — the silent-film clips in the contest\n'
                '- get_leaderboard {"clipId": <int>} — ranked entries; omit '
                'clipId for the currently active clip\n'
                '- list_entries {"clipId": <int>} — voice takes for a clip; '
                'omit clipId for the active clip\n'
                'Never emit the sentinel for other questions — answer those '
                'normally. After a tool runs you receive its JSON result; '
                'then summarize it for the user naturally and concisely.'
          }
        ]);
  }

  void _trim(List<Map<String, String>> messages) {
    if (messages.length > 20) {
      messages.removeRange(1, messages.length - 19);
    }
  }

  // ---- Tools ---------------------------------------------------------------

  static const _toolSentinel = '<<tool:';
  static final _toolRe = RegExp(r'<<tool:([a-zA-Z_]+)\s*(\{.*?\})?\s*>>');

  /// Parses a `<<tool:name {json}>>` sentinel emitted by the model.
  /// Returns (toolName, args) or null when the text isn't a tool call.
  (String, Map<String, dynamic>)? _parseToolCall(String text) {
    final m = _toolRe.firstMatch(text.trimLeft());
    if (m == null) return null;
    var args = <String, dynamic>{};
    final raw = m.group(2);
    if (raw != null) {
      try {
        args = (jsonDecode(raw) as Map).cast<String, dynamic>();
      } catch (_) {}
    }
    return (m.group(1)!, args);
  }

  Future<SilenceClip?> _activeClip(Session session) =>
      SilenceClip.db.findFirstRow(
        session,
        where: (t) => t.active.equals(true),
        orderBy: (t) => t.weekStart,
        orderDescending: true,
      );

  Future<List<SilenceLeaderboardRow>> _leaderboardRows(
      Session session, int clipId) async {
    final all = await SilenceEntry.db.find(
      session,
      where: (t) => t.clipId.equals(clipId),
      orderBy: (t) => t.voteScoreTotal,
      orderDescending: true,
    );
    final entries = all.where((e) => e.voteCount > 0).toList()
      ..sort((a, b) => (b.voteScoreTotal / b.voteCount)
          .compareTo(a.voteScoreTotal / a.voteCount));
    var rank = 0;
    return entries
        .map((e) => SilenceLeaderboardRow(
              entryId: e.id!,
              displayName: e.displayName,
              voteCount: e.voteCount,
              avgScore: e.voteScoreTotal / e.voteCount,
              rank: ++rank,
            ))
        .toList();
  }

  /// Runs a model-invoked tool and returns a `card` event for the UI plus
  /// a compact JSON result that is fed back to the model for grounding.
  Future<(ButlerStreamEvent, String)> _runTool(
      Session session, String name, Map<String, dynamic> args) async {
    Future<int?> resolveClipId() async {
      final arg = args['clipId'];
      if (arg is int) return arg;
      return (await _activeClip(session))?.id;
    }

    try {
      switch (name) {
        case 'list_clips':
          final clips = await SilenceClip.db.find(
            session,
            orderBy: (t) => t.weekStart,
            orderDescending: true,
            limit: 10,
          );
          return (
            ButlerStreamEvent(
                kind: 'card',
                cardKind: 'clips',
                text: 'Contest clips',
                clips: clips),
            jsonEncode(clips
                .map((c) => {
                      'id': c.id,
                      'title': c.title,
                      'durationSec': c.durationSec,
                      'active': c.active,
                      'rightsNote': c.rightsNote,
                    })
                .toList()),
          );
        case 'get_leaderboard':
          final clipId = await resolveClipId();
          if (clipId == null) {
            return (
              ButlerStreamEvent(
                  kind: 'card',
                  cardKind: 'error',
                  text: 'No active clip right now'),
              jsonEncode({'error': 'no active clip'}),
            );
          }
          final clip = await SilenceClip.db.findById(session, clipId);
          final rows = await _leaderboardRows(session, clipId);
          return (
            ButlerStreamEvent(
                kind: 'card',
                cardKind: 'leaderboard',
                text: clip?.title ?? 'Leaderboard',
                leaderboard: rows),
            jsonEncode({
              'clip': clip?.title,
              'entries': rows
                  .map((r) => {
                        'rank': r.rank,
                        'name': r.displayName,
                        'votes': r.voteCount,
                        'avgScore': r.avgScore,
                      })
                  .toList(),
            }),
          );
        case 'list_entries':
          final clipId = await resolveClipId();
          if (clipId == null) {
            return (
              ButlerStreamEvent(
                  kind: 'card',
                  cardKind: 'error',
                  text: 'No active clip right now'),
              jsonEncode({'error': 'no active clip'}),
            );
          }
          final clip = await SilenceClip.db.findById(session, clipId);
          final entries = await SilenceEntry.db.find(
            session,
            where: (t) => t.clipId.equals(clipId),
            orderBy: (t) => t.createdAt,
            orderDescending: true,
            limit: 10,
          );
          final cards = entries
              .map((e) => ButlerEntryCard(
                    id: e.id!,
                    clipId: e.clipId,
                    displayName: e.displayName,
                    audioUrl: e.audioUrl,
                    audioFormat: e.audioFormat,
                    isAiGenerated: e.isAiGenerated,
                    voteCount: e.voteCount,
                    avgScore:
                        e.voteCount > 0 ? e.voteScoreTotal / e.voteCount : 0,
                  ))
              .toList();
          return (
            ButlerStreamEvent(
                kind: 'card',
                cardKind: 'entries',
                text: clip?.title ?? 'Entries',
                entries: cards),
            jsonEncode({
              'clip': clip?.title,
              'entries': cards
                  .map((c) => {
                        'id': c.id,
                        'name': c.displayName,
                        'aiGenerated': c.isAiGenerated,
                        'votes': c.voteCount,
                        'avgScore': c.avgScore,
                      })
                  .toList(),
            }),
          );
      }
    } catch (e) {
      print('Tool $name failed: $e');
      return (
        ButlerStreamEvent(
            kind: 'card', cardKind: 'error', text: 'Tool lookup failed'),
        jsonEncode({'error': 'tool $name failed'}),
      );
    }
    return (
      ButlerStreamEvent(
          kind: 'card', cardKind: 'error', text: 'Unknown tool: $name'),
      jsonEncode({'error': 'unknown tool $name'}),
    );
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
      var responseText = await _complete(messages);
      // Model may open with a tool sentinel — run the tool and re-ask with
      // the result so the final answer is grounded in real data.
      final call = _parseToolCall(responseText);
      if (call != null) {
        messages.add({'role': 'assistant', 'content': responseText});
        final (_, resultJson) = await _runTool(session, call.$1, call.$2);
        messages.add({
          'role': 'user',
          'content': 'Tool result:\n$resultJson\n\n'
              'Now answer the user, summarizing this data naturally.',
        });
        responseText = await _complete(messages);
      }
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
        var flushed = false;
        await for (final chunk in client.chatCompletionStream(messages)) {
          if (flushed) {
            buf.write(chunk);
            yield ButlerStreamEvent(kind: 'delta', text: chunk);
            continue;
          }
          buf.write(chunk);
          final s = buf.toString();
          final t = s.trimLeft();
          if (t.startsWith(_toolSentinel)) {
            // Possible tool call — wait for the closing '>>'.
            final end = t.indexOf('>>');
            if (end < 0) {
              if (t.length > 256) {
                // Pathologically long sentinel — flush as normal text.
                flushed = true;
                emittedThisAttempt = emitted = true;
                yield ButlerStreamEvent(kind: 'delta', text: t);
              }
              continue;
            }
            final call = _parseToolCall(t.substring(0, end + 2));
            if (call == null) {
              flushed = true;
              emittedThisAttempt = emitted = true;
              yield ButlerStreamEvent(kind: 'delta', text: t);
              continue;
            }
            // Tool call: run it, emit the card, then stream a second
            // grounded answer from the same provider.
            emittedThisAttempt = emitted = true;
            final (card, resultJson) =
                await _runTool(session, call.$1, call.$2);
            yield card;
            messages.add({'role': 'assistant', 'content': t.substring(0, end + 2)});
            messages.add({
              'role': 'user',
              'content': 'Tool result:\n$resultJson\n\n'
                  'Now answer the user, summarizing this data naturally '
                  'and concisely.',
            });
            buf.clear();
            final leftover = t.substring(end + 2).trim();
            if (leftover.isNotEmpty) {
              buf.write(leftover);
              yield ButlerStreamEvent(kind: 'delta', text: leftover);
            }
            await for (final chunk2
                in client.chatCompletionStream(messages)) {
              buf.write(chunk2);
              yield ButlerStreamEvent(kind: 'delta', text: chunk2);
            }
            break;
          }
          if (t.length <= _toolSentinel.length &&
              _toolSentinel.startsWith(t)) {
            // Still could become a sentinel — keep buffering.
            continue;
          }
          flushed = true;
          emittedThisAttempt = emitted = true;
          yield ButlerStreamEvent(kind: 'delta', text: t);
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

  /// Searches real contest takes — SilenceEntry rows are the voice
  /// recordings this app actually stores.
  Future<List<ButlerRecording>> findRecordings(Session session,
      {required String query}) async {
    final entries = await SilenceEntry.db.find(
      session,
      orderBy: (t) => t.createdAt,
      orderDescending: true,
      limit: 50,
    );
    final q = query.toLowerCase();
    return entries
        .where((e) => e.displayName.toLowerCase().contains(q))
        .take(10)
        .map((e) => ButlerRecording(
              id: '${e.id}',
              title: e.displayName,
              duration: 0,
              date: e.createdAt.toIso8601String().substring(0, 10),
            ))
        .toList();
  }

  /// Real contest stats instead of fabricated recording analytics.
  Future<ButlerInsights> getInsights(Session session) async {
    final entries = await SilenceEntry.db.find(session, limit: 200);
    final clips = await SilenceClip.db.find(session, limit: 50);
    final totalVotes =
        entries.fold<int>(0, (sum, e) => sum + e.voteCount);
    final active = clips.where((c) => c.active).length;
    final contributors = entries.map((e) => e.displayName).toSet();
    final top = entries.toList()
      ..sort((a, b) => b.voteCount.compareTo(a.voteCount));
    return ButlerInsights(
      summary:
          '${entries.length} voice takes across ${clips.length} clips '
          '($active active) with $totalVotes votes cast so far.',
      topTopics: top.take(3).map((e) => e.displayName).toList(),
      recordingFrequency:
          '${contributors.length} contributor${contributors.length == 1 ? '' : 's'}',
      suggestions: [
        'Show me the leaderboard',
        'What clips are in the contest?',
        'List the latest voice takes',
      ],
      totalRecordings: entries.length,
      // Entry rows don't store clip duration — unknown, so 0.
      totalDuration: 0,
    );
  }

  Future<List<String>> getSuggestions(Session session) async {
    return [
      'What\'s on the leaderboard?',
      'Which clips can I voice?',
      'Show me the latest voice takes',
      'Help me write lines for the active clip',
    ];
  }
}
