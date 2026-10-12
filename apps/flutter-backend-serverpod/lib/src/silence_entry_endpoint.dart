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
    'nicole': 'af_nicole',
    'river': 'af_river',
    'sky': 'af_sky',
    'nova': 'af_nova',
    'adam': 'am_adam',
    'michael': 'am_michael',
    'onyx': 'am_onyx',
    'echo': 'am_echo',
    'emma': 'bf_emma',
    'george': 'bm_george',
    'fable': 'bm_fable',
  };

  /// The voice menu the client renders its picker from (name → display label).
  Future<Map<String, String>> aiVoices(Session session) async =>
      const {
        'heart': 'Heart · warm',
        'bella': 'Bella · bright',
        'sarah': 'Sarah · soft',
        'nicole': 'Nicole · calm',
        'river': 'River · neutral',
        'sky': 'Sky · airy',
        'nova': 'Nova · lively',
        'adam': 'Adam · clear',
        'michael': 'Michael · steady',
        'onyx': 'Onyx · deep',
        'echo': 'Echo · gravelly',
        'emma': 'Emma · British F',
        'george': 'George · British M',
        'fable': 'Fable · storyteller',
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

      final grove = await _uploadToGrove(session, bytes, 'audio/mpeg');
      final entry = await SilenceEntry.db.insertRow(
        session,
        SilenceEntry(
          clipId: clipId,
          displayName: name,
          audio: bytes.buffer.asByteData(),
          audioFormat: 'mp3',
          storageUri: grove?.uri ?? '',
          audioUrl: grove?.gatewayUrl ?? '',
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

    final mime = audioFormat == 'mp3' ? 'audio/mpeg' : 'audio/$audioFormat';
    final grove = await _uploadToGrove(
      session,
      audio.buffer.asUint8List(audio.offsetInBytes, audio.lengthInBytes),
      mime,
    );
    final entry = await SilenceEntry.db.insertRow(
      session,
      SilenceEntry(
        clipId: clipId,
        displayName: name,
        audio: audio,
        audioFormat: audioFormat,
        storageUri: grove?.uri ?? '',
        audioUrl: grove?.gatewayUrl ?? '',
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

  /// Uploads bytes to Grove (Lens storage) — one-step immutable upload
  /// against Lens Chain mainnet (chain_id 232). Returns null on failure:
  /// storage is provenance/faster playback, never a reason to drop a take.
  Future<({String uri, String gatewayUrl})?> _uploadToGrove(
    Session session,
    Uint8List data,
    String contentType,
  ) async {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 15);
    try {
      final request = await client.postUrl(
        Uri.parse('https://api.grove.storage/?chain_id=232'),
      );
      request.headers.set('Content-Type', contentType);
      request.add(data);
      final response =
          await request.close().timeout(const Duration(seconds: 60));
      final body = await response.transform(utf8.decoder).join();
      if (response.statusCode != 200 && response.statusCode != 201 &&
          response.statusCode != 202) {
        session.log(
          'Grove upload failed (${response.statusCode}): $body',
          level: LogLevel.warning,
        );
        return null;
      }
      // Grove replies with a JSON array of uploaded resources.
      final decoded = jsonDecode(body);
      final first = decoded is List && decoded.isNotEmpty
          ? decoded.first as Map<String, dynamic>
          : decoded as Map<String, dynamic>;
      return (
        uri: first['uri'] as String? ?? '',
        gatewayUrl: first['gateway_url'] as String? ?? '',
      );
    } catch (e) {
      session.log('Grove upload error: $e', level: LogLevel.warning);
      return null;
    } finally {
      client.close();
    }
  }

  SilenceEntryView _toView(SilenceEntry e) {
    return SilenceEntryView(
      id: e.id!,
      clipId: e.clipId,
      displayName: e.displayName,
      audio: e.audio,
      audioFormat: e.audioFormat,
      audioUrl: e.audioUrl,
      storageUri: e.storageUri,
      isAiGenerated: e.isAiGenerated,
      voteCount: e.voteCount,
      avgScore: e.voteCount == 0 ? 0 : e.voteScoreTotal / e.voteCount,
      createdAt: e.createdAt,
    );
  }
}
