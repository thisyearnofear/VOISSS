import 'dart:typed_data';

import 'generated/protocol.dart';
import 'package:serverpod/serverpod.dart';

/// Voiceover entry submission and listing. Accessed as `client.silenceEntry`.
class SilenceEntryEndpoint extends Endpoint {
  static const int _maxAudioBytes = 5 * 1024 * 1024; // 5 MB
  static const int _maxDisplayNameLength = 40;

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
      voteCount: e.voteCount,
      avgScore: e.voteCount == 0 ? 0 : e.voteScoreTotal / e.voteCount,
      createdAt: e.createdAt,
    );
  }
}
