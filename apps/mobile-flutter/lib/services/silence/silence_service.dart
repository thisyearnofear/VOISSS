import 'dart:typed_data';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:voisss_butler_client/voisss_butler_client.dart';

import '../../core/serverpod_config.dart';

/// Thin wrapper over the generated Serverpod client for the
/// "Voice the Silence" weekly contest endpoints.
class SilenceService {
  late final Client _client;
  String? _voterToken;

  SilenceService() {
    _client = Client(ServerpodConfig.baseUrl);
  }

  /// Stable per-device voter identity (no accounts needed for the sprint).
  Future<String> _getVoterToken() async {
    if (_voterToken != null) return _voterToken!;
    final prefs = await SharedPreferences.getInstance();
    var token = prefs.getString('silence_voter_token');
    if (token == null) {
      token = const Uuid().v4();
      await prefs.setString('silence_voter_token', token);
    }
    _voterToken = token;
    return token;
  }

  Future<SilenceClip?> getActiveClip() => _client.silenceClip.getActive();

  Future<List<SilenceEntryView>> listEntries(int clipId) =>
      _client.silenceEntry.list(clipId);

  Future<SilenceEntryView> submit({
    required int clipId,
    required String displayName,
    required Uint8List audioBytes,
    required String audioFormat,
  }) {
    return _client.silenceEntry.submit(
      clipId,
      displayName,
      ByteData.sublistView(audioBytes),
      audioFormat,
    );
  }

  /// AI voice menu (name → display label) for the picker.
  Future<Map<String, String>> aiVoices() => _client.silenceEntry.aiVoices();

  /// Synthesize a take server-side via ElevenLabs; lands flagged
  /// `isAiGenerated` so post-vote reveals can call it out.
  Future<SilenceEntryView> generate({
    required int clipId,
    required String displayName,
    required String script,
    required String voice,
  }) =>
      _client.silenceEntry.generate(clipId, displayName, script, voice);

  /// Returns the updated leaderboard after the vote is recorded.
  Future<List<SilenceLeaderboardRow>> castVote(int entryId, int score) async {
    final token = await _getVoterToken();
    return _client.silenceVote.cast(entryId, token, score);
  }

  Future<List<SilenceLeaderboardRow>> leaderboard(int clipId) =>
      _client.silenceVote.leaderboard(clipId);

  /// Live leaderboard updates (polling stream on the server).
  Stream<List<SilenceLeaderboardRow>> watchLeaderboard(int clipId) =>
      _client.silenceVote.watchLeaderboard(clipId);

  void dispose() => _client.close();
}
