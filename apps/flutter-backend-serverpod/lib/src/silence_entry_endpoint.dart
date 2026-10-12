import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'generated/protocol.dart';
import 'package:serverpod/serverpod.dart';

/// Voiceover entry submission and listing. Accessed as `client.silenceEntry`.
class SilenceEntryEndpoint extends Endpoint {
  static const int _maxAudioBytes = 5 * 1024 * 1024; // 5 MB
  static const int _maxDisplayNameLength = 40;
  static const int _maxScriptChars = 1200; // ~60s of speech

  /// Kokoro-82M voices (via Featherless) offered in the app's AI-voice
  /// picker. Server-side allowlist so `voice` can't probe arbitrary voices.
  static const Map<String, String> _aiVoices = {
    'heart': 'af_heart',
    'bella': 'af_bella',
    'sarah': 'af_sarah',
    'adam': 'am_adam',
    'michael': 'am_michael',
    'george': 'bm_george',
  };

  /// The voice menu the client renders its picker from (name → display label).
  Future<Map<String, String>> aiVoices(Session session) async =>
      const {
        'heart': 'Heart',
        'bella': 'Bella',
        'sarah': 'Sarah',
        'adam': 'Adam',
        'michael': 'Michael',
        'george': 'George',
      };

  /// Synthesize a take via Featherless (Kokoro-82M) and submit it flagged
  /// `isAiGenerated` — the crowd votes blind, the flag powers the
  /// post-vote "this one was a machine" reveal.
  Future<SilenceEntryView> generate(
    Session session,
    int clipId,
    String displayName,
    String script,
    String voice,
  ) async {
    final name = displayName.trim();
    if (name.isEmpty || name.length > _maxDisplayNameLength) {
      throw ArgumentError.value(name, 'displayName', 'Invalid display name');
    }
    final text = script.trim();
    if (text.isEmpty || text.length > _maxScriptChars) {
      throw ArgumentError.value(
        text.length,
        'script',
        'Script must be 1–$_maxScriptChars characters',
      );
    }
    final voiceId = _aiVoices[voice.toLowerCase()];
    if (voiceId == null) {
      throw ArgumentError.value(voice, 'voice', 'Unknown AI voice');
    }
    final apiKey = Platform.environment['FEATHERLESS_API_KEY'] ?? '';
    if (apiKey.isEmpty) {
      throw StateError('AI voice generation is not configured on this server');
    }

    final clip = await SilenceClip.db.findById(session, clipId);
    if (clip == null || !clip.active) {
      throw StateError('Clip is not active');
    }

    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 20);
    try {
      final request = await client.postUrl(
        Uri.parse('https://api.featherless.ai/v1/audio/speech'),
      );
      request.headers.set('Authorization', 'Bearer $apiKey');
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('User-Agent', 'voisss-butler/1.0');
      request.add(utf8.encode(jsonEncode({
        'model': 'hexgrad/Kokoro-82M',
        'input': text,
        'voice': voiceId,
        'response_format': 'mp3',
      })));
      final response = await request.close().timeout(
            const Duration(seconds: 60),
          );
      if (response.statusCode != 200) {
        final body = await response.transform(utf8.decoder).join();
        session.log(
          'Featherless TTS failed (${response.statusCode}): $body',
          level: LogLevel.error,
        );
        throw StateError('AI voice generation failed');
      }
      final builder = await response.fold<BytesBuilder>(
        BytesBuilder(copy: false),
        (b, chunk) => b..add(chunk),
      );
      final bytes = builder.takeBytes();
      if (bytes.isEmpty || bytes.length > _maxAudioBytes) {
        throw StateError('Generated audio was empty or too large');
      }

      final entry = await SilenceEntry.db.insertRow(
        session,
        SilenceEntry(
          clipId: clipId,
          displayName: name,
          audio: bytes.buffer.asByteData(),
          audioFormat: 'mp3',
          isAiGenerated: true,
          voteCount: 0,
          voteScoreTotal: 0,
          createdAt: DateTime.now().toUtc(),
        ),
      );
      return _toView(entry);
    } finally {
      client.close();
    }
  }

  /// Submit a voiceover for the active clip.
  /// [audio] is the raw encoded file (e.g. m4a from the `record` package).
  Future<SilenceEntryView> submit(
    Session session,
    int clipId,
    String displayName,
    ByteData audio,
    String audioFormat,
  ) async {
    final name = displayName.trim();
    if (name.isEmpty || name.length > _maxDisplayNameLength) {
      throw ArgumentError.value(name, 'displayName', 'Invalid display name');
    }
    if (audio.lengthInBytes == 0 || audio.lengthInBytes > _maxAudioBytes) {
      throw ArgumentError.value(
        audio.lengthInBytes,
        'audio',
        'Audio must be between 1 byte and ${_maxAudioBytes ~/ (1024 * 1024)} MB',
      );
    }

    final clip = await SilenceClip.db.findById(session, clipId);
    if (clip == null || !clip.active) {
      throw StateError('Clip is not active');
    }

    final entry = await SilenceEntry.db.insertRow(
      session,
      SilenceEntry(
        clipId: clipId,
        displayName: name,
        audio: audio,
        audioFormat: audioFormat,
        isAiGenerated: false,
        voteCount: 0,
        voteScoreTotal: 0,
        createdAt: DateTime.now().toUtc(),
      ),
    );
    return _toView(entry);
  }

  /// All entries for a clip, newest first.
  Future<List<SilenceEntryView>> list(Session session, int clipId) async {
    final entries = await SilenceEntry.db.find(
      session,
      where: (t) => t.clipId.equals(clipId),
      orderBy: (t) => t.createdAt,
      orderDescending: true,
    );
    return entries.map(_toView).toList();
  }

  SilenceEntryView _toView(SilenceEntry e) {
    return SilenceEntryView(
      id: e.id!,
      clipId: e.clipId,
      displayName: e.displayName,
      audio: e.audio,
      audioFormat: e.audioFormat,
      isAiGenerated: e.isAiGenerated,
      voteCount: e.voteCount,
      avgScore: e.voteCount == 0 ? 0 : e.voteScoreTotal / e.voteCount,
      createdAt: e.createdAt,
    );
  }
}
