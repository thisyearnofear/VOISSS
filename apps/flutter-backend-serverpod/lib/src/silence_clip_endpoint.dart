import 'generated/protocol.dart';
import 'package:serverpod/serverpod.dart';

/// Endpoints for the "Voice the Silence" weekly clip contest.
/// Accessed on the client as `client.silenceClip`.
class SilenceClipEndpoint extends Endpoint {
  /// The featured contest clip (newest active), or null if none is active.
  Future<SilenceClip?> getActive(Session session) async {
    return SilenceClip.db.findFirstRow(
      session,
      where: (t) => t.active.equals(true),
      orderBy: (t) => t.weekStart,
      orderDescending: true,
    );
  }

  /// Every selectable clip — the shelf users pick what to voice from.
  /// Featured first (newest weekStart), then the rest.
  Future<List<SilenceClip>> listSelectable(Session session) async {
    return SilenceClip.db.find(
      session,
      where: (t) => t.active.equals(true),
      orderBy: (t) => t.weekStart,
      orderDescending: true,
    );
  }

  /// Points a clip's media at a new URL + records its Grove storage URI.
  /// Sprint admin path — same exposure caveat as [createClip].
  Future<SilenceClip> updateClipMedia(
    Session session,
    int clipId,
    String videoUrl,
    String storageUri,
  ) async {
    final clip = await SilenceClip.db.findById(session, clipId);
    if (clip == null) {
      throw StateError('Clip not found');
    }
    return SilenceClip.db.updateRow(
      session,
      clip.copyWith(videoUrl: videoUrl, storageUri: storageUri),
    );
  }

  /// Past (inactive) clips, newest first.
  Future<List<SilenceClip>> listArchive(Session session) async {
    return SilenceClip.db.find(
      session,
      where: (t) => t.active.equals(false),
      orderBy: (t) => t.weekStart,
      orderDescending: true,
    );
  }

  /// Stores the vision-generated scene guide for a clip. Sprint admin
  /// path — same exposure caveat as [createClip].
  Future<SilenceClip> updateSceneGuide(
    Session session,
    int clipId,
    String sceneGuide,
  ) async {
    final clip = await SilenceClip.db.findById(session, clipId);
    if (clip == null) {
      throw StateError('Clip not found');
    }
    return SilenceClip.db.updateRow(
      session,
      clip.copyWith(sceneGuide: sceneGuide),
    );
  }

  /// Creates a clip. Sprint admin path — no auth for now; do not expose
  /// publicly without adding an admin check.
  Future<SilenceClip> createClip(
    Session session,
    String title,
    String videoUrl,
    int durationSec,
    String rightsNote,
    DateTime weekStart, {
    bool activate = true,
  }) async {
    // Multiple clips can be active at once — the app renders them as a
    // selectable shelf; getActive() returns the newest as featured.
    return SilenceClip.db.insertRow(
      session,
      SilenceClip(
        title: title,
        videoUrl: videoUrl,
        durationSec: durationSec,
        rightsNote: rightsNote,
        weekStart: weekStart,
        active: activate,
        createdAt: DateTime.now().toUtc(),
      ),
    );
  }
}
