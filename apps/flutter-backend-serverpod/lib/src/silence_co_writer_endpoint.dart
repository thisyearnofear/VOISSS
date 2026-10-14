import 'dart:convert';
import 'dart:io';

import 'generated/protocol.dart';
import 'package:serverpod/serverpod.dart';

/// AI writing partner for "Voice the Silence" — riffs on voiceover ideas
/// with on-screen context from the clip's vision-distilled scene guide.
/// Accessed as `client.silenceCoWriter`.
class SilenceCoWriterEndpoint extends Endpoint {
  static const int _maxHistoryMessages = 20;
  static const int _maxMessageChars = 2000;

  /// Three cold-start directions a user could take the voiceover.
  Future<List<String>> openers(Session session, int clipId) async {
    final clip = await _clip(session, clipId);
    const fallback = [
      'A deadpan newsreel narrator calling the action like it\'s 1918',
      'The characters\' inner monologues — what they\'re really thinking',
      'Over-the-top sports commentary on every gesture',
    ];
    try {
      final reply = await _chatCompletion(session, [
        {'role': 'system', 'content': _systemPrompt(clip, '')},
        {
          'role': 'user',
          'content':
              'Suggest exactly 3 distinct, playful creative directions for '
              'voicing this film — each one line of plain text (no '
              'markdown), each tied to something visible on screen. Return '
              'a JSON array of strings only.',
        },
      ], maxTokens: 220);
      final start = reply.indexOf('[');
      final end = reply.lastIndexOf(']');
      if (start >= 0 && end > start) {
        final parsed = jsonDecode(reply.substring(start, end + 1));
        if (parsed is List) {
          final list =
              parsed.map((e) => e.toString().trim()).where((s) => s.isNotEmpty).take(3).toList();
          if (list.isNotEmpty) return list;
        }
      }
    } catch (e) {
      session.log('CoWriter openers failed: $e', level: LogLevel.warning);
    }
    return fallback;
  }

  /// One riff turn. [history] is prior turns; [draft] is the user's current
  /// script so the model iterates on it rather than starting over.
  Future<CoWriterMessage> chat(
    Session session,
    int clipId,
    List<CoWriterMessage> history,
    String draft,
  ) async {
    final clip = await _clip(session, clipId);
    final messages = _buildMessages(clip, history, draft);
    final reply = await _chatCompletion(session, messages, maxTokens: 420);
    return CoWriterMessage(role: 'assistant', content: reply.trim());
  }

  /// Streaming riff — same prompt as [chat] but yields reply deltas so
  /// the client can render the answer as it lands instead of staring at
  /// a spinner for ~15s. Client calls `client.silenceCoWriter.riff(...)`.
  Stream<String> riff(
    Session session,
    int clipId,
    List<CoWriterMessage> history,
    String draft,
  ) async* {
    final clip = await _clip(session, clipId);
    final messages = _buildMessages(clip, history, draft);

    final apiKey = Platform.environment['BUTLER_LLM_KEY'] ?? '';
    final baseUrl = Platform.environment['BUTLER_LLM_URL'] ??
        'https://api.featherless.ai/v1';
    final model = Platform.environment['BUTLER_LLM_MODEL'] ??
        'Qwen/Qwen3-Next-80B-A3B-Instruct';
    if (apiKey.isEmpty) {
      throw StateError('Co-writer LLM is not configured on this server');
    }

    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 15);
    try {
      final request =
          await client.postUrl(Uri.parse('$baseUrl/chat/completions'));
      request.headers.set('Authorization', 'Bearer $apiKey');
      request.headers.set('Content-Type', 'application/json');
      request.add(utf8.encode(jsonEncode({
        'model': model,
        'messages': messages,
        'max_tokens': 420,
        'temperature': 0.9,
        'stream': true,
        'chat_template_kwargs': {'enable_thinking': false},
      })));
      final response =
          await request.close().timeout(const Duration(seconds: 45));
      if (response.statusCode != 200) {
        session.log(
          'CoWriter stream failed (${response.statusCode})',
          level: LogLevel.error,
        );
        throw StateError('Co-writer request failed');
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

  Future<SilenceClip> _clip(Session session, int clipId) async {
    final clip = await SilenceClip.db.findById(session, clipId);
    if (clip == null || !clip.active) {
      throw StateError('Clip is not active');
    }
    return clip;
  }

  List<Map<String, String>> _buildMessages(
    SilenceClip clip,
    List<CoWriterMessage> history,
    String draft,
  ) {
    if (history.isEmpty || history.last.role != 'user') {
      throw ArgumentError('history must end with a user message');
    }
    final turns = history
        .where((m) =>
            (m.role == 'user' || m.role == 'assistant') &&
            m.content.trim().isNotEmpty)
        .toList();
    final recent = turns.length > _maxHistoryMessages
        ? turns.sublist(turns.length - _maxHistoryMessages)
        : turns;
    return [
      {'role': 'system', 'content': _systemPrompt(clip, draft)},
      for (final m in recent)
        {
          'role': m.role,
          'content': m.content.length > _maxMessageChars
              ? m.content.substring(0, _maxMessageChars)
              : m.content,
        },
    ];
  }

  String _systemPrompt(SilenceClip clip, String draft) {
    final guide = clip.sceneGuide.trim().isEmpty
        ? '(no scene guide available — infer from the title)'
        : clip.sceneGuide.trim();
    final d = draft.trim();
    return 'You are the co-writer inside "Voice the Silence", an app where '
        'people dub their own voiceover onto silent public-domain films.\n\n'
        'FILM: ${clip.title} (${clip.rightsNote}), '
        '${clip.durationSec}s of silent footage.\n'
        'WHAT HAPPENS ON SCREEN (timestamped):\n$guide\n\n'
        'YOUR JOB: riff with the user on voiceover ideas — narration, '
        'dialogue, inner monologue, commentary. Suggest speakable lines tied '
        'to specific on-screen moments (cite timestamps like 0:12). Keep '
        'total material under ~${clip.durationSec}s of speech '
        '(~150 words max). Be a playful writing partner, not an essay '
        'generator: short replies, concrete lines, offer alternatives. '
        'When the user likes a direction, develop it; when they give lines, '
        'punch them up without losing their voice.\n\n'
        'FORMAT: every line the user could actually speak out loud goes on '
        'its own line prefixed `LINE:` — e.g. `LINE: 0:26 — "And just like '
        'that…"`. Everything else stays conversational prose. No markdown '
        'formatting (no ** or *).\n\n'
        'THEIR CURRENT DRAFT:\n${d.isEmpty ? '(empty — help them start)' : d}';
  }

  /// OpenAI-compatible chat call against the Featherless account shared
  /// with Butler (BUTLER_LLM_* env).
  Future<String> _chatCompletion(
    Session session,
    List<Map<String, String>> messages, {
    required int maxTokens,
  }) async {
    final apiKey = Platform.environment['BUTLER_LLM_KEY'] ?? '';
    final baseUrl = Platform.environment['BUTLER_LLM_URL'] ??
        'https://api.featherless.ai/v1';
    final model = Platform.environment['BUTLER_LLM_MODEL'] ??
        'Qwen/Qwen3-Next-80B-A3B-Instruct';
    if (apiKey.isEmpty) {
      throw StateError('Co-writer LLM is not configured on this server');
    }

    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 15);
    try {
      // Featherless occasionally concatenates an error payload onto a
      // successful response — retry once on malformed/non-200 results.
      Object? lastErr;
      for (var attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await Future<void>.delayed(const Duration(seconds: 1));
        try {
          final request =
              await client.postUrl(Uri.parse('$baseUrl/chat/completions'));
          request.headers.set('Authorization', 'Bearer $apiKey');
          request.headers.set('Content-Type', 'application/json');
          request.add(utf8.encode(jsonEncode({
            'model': model,
            'messages': messages,
            'max_tokens': maxTokens,
            'temperature': 0.9,
            // Qwen3 is a thinking model — without this it burns the token
            // budget on reasoning and returns empty content.
            'chat_template_kwargs': {'enable_thinking': false},
          })));
          final response =
              await request.close().timeout(const Duration(seconds: 45));
          final body = await response.transform(utf8.decoder).join();
          if (response.statusCode != 200) {
            throw StateError('Co-writer request failed (${response.statusCode})');
          }
          final decoded = jsonDecode(body) as Map<String, dynamic>;
          return ((decoded['choices'] as List).first['message']
                  ['content'] as String)
              .trim();
        } catch (e) {
          lastErr = e;
          session.log('CoWriter LLM attempt ${attempt + 1} failed: $e',
              level: LogLevel.warning);
        }
      }
      throw StateError('Co-writer request failed: $lastErr');
    } finally {
      client.close();
    }
  }
}
