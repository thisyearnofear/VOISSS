import 'generated/protocol.dart';
import 'package:serverpod/serverpod.dart';

/// Voting and the live leaderboard. Accessed as `client.silenceVote`.
class SilenceVoteEndpoint extends Endpoint {
  /// Cast (or change) a vote. One vote per voter token per entry;
  /// repeat calls update the score. Returns the updated leaderboard.
  Future<List<SilenceLeaderboardRow>> cast(
    Session session,
    int entryId,
    String voterToken,
    int score,
  ) async {
    if (voterToken.trim().isEmpty) {
      throw ArgumentError.value(voterToken, 'voterToken', 'Required');
    }
    if (score < 1 || score > 5) {
      throw ArgumentError.value(score, 'score', 'Must be 1-5');
    }

    final entry = await SilenceEntry.db.findById(session, entryId);
    if (entry == null) throw StateError('Entry not found');

    await session.db.transaction((transaction) async {
      final existing = await SilenceVote.db.findFirstRow(
        session,
        where: (t) => t.entryId.equals(entryId) & t.voterToken.equals(voterToken),
        transaction: transaction,
      );

      if (existing == null) {
        await SilenceVote.db.insertRow(
          session,
          SilenceVote(
            entryId: entryId,
            voterToken: voterToken,
            score: score,
            createdAt: DateTime.now().toUtc(),
          ),
          transaction: transaction,
        );
        await _bumpTotals(session, entryId, deltaCount: 1, deltaScore: score,
            transaction: transaction);
      } else {
        await SilenceVote.db.updateRow(
          session,
          existing.copyWith(score: score),
          transaction: transaction,
        );
        await _bumpTotals(session, entryId,
            deltaCount: 0, deltaScore: score - existing.score,
            transaction: transaction);
      }
    });

    return leaderboard(session, entry.clipId);
  }

  /// Current leaderboard for a clip, ordered by average score.
  Future<List<SilenceLeaderboardRow>> leaderboard(
      Session session, int clipId) async {
    final all = await SilenceEntry.db.find(
      session,
      where: (t) => t.clipId.equals(clipId),
      orderBy: (t) => t.voteScoreTotal,
      orderDescending: true,
    );
    final entries =
        all.where((e) => e.voteCount > 0).toList()
          // Sort by true average (denormalised totals sort by sum).
          ..sort(
            (a, b) => (b.voteScoreTotal / b.voteCount)
                .compareTo(a.voteScoreTotal / a.voteCount),
          );
    var rank = 0;
    return entries
        .map(
          (e) => SilenceLeaderboardRow(
            entryId: e.id!,
            displayName: e.displayName,
            voteCount: e.voteCount,
            avgScore: e.voteScoreTotal / e.voteCount,
            rank: ++rank,
          ),
        )
        .toList();
  }

  /// Streams leaderboard updates for a clip. The client calls
  /// `client.silenceVote.watchLeaderboard(clipId)` and listens.
  Stream<List<SilenceLeaderboardRow>> watchLeaderboard(
      Session session, int clipId) async* {
    var lastSignature = '';
    for (var i = 0; i < 3600; i++) {
      final rows = await leaderboard(session, clipId);
      final signature = rows
          .map((r) => '${r.entryId}:${r.voteCount}:${r.avgScore}')
          .join('|');
      if (signature != lastSignature) {
        lastSignature = signature;
        yield rows;
      }
      await Future.delayed(const Duration(seconds: 2));
    }
  }

  Future<void> _bumpTotals(
    Session session,
    int entryId, {
    required int deltaCount,
    required int deltaScore,
    required Transaction transaction,
  }) async {
    final entry = await SilenceEntry.db.findById(
      session,
      entryId,
      transaction: transaction,
    );
    if (entry == null) return;
    await SilenceEntry.db.updateRow(
      session,
      entry.copyWith(
        voteCount: entry.voteCount + deltaCount,
        voteScoreTotal: entry.voteScoreTotal + deltaScore,
      ),
      transaction: transaction,
    );
  }
}
