/* AUTOMATICALLY GENERATED CODE DO NOT MODIFY */
/*   To generate run: "serverpod generate"    */

// ignore_for_file: implementation_imports
// ignore_for_file: library_private_types_in_public_api
// ignore_for_file: non_constant_identifier_names
// ignore_for_file: public_member_api_docs
// ignore_for_file: type_literal_in_constant_pattern
// ignore_for_file: use_super_parameters

// ignore_for_file: no_leading_underscores_for_library_prefixes

import 'package:serverpod/serverpod.dart' as _i1;

/// One row of the live leaderboard, ordered by average score.
abstract class SilenceLeaderboardRow
    implements _i1.SerializableModel, _i1.ProtocolSerialization {
  SilenceLeaderboardRow._({
    required this.entryId,
    required this.displayName,
    required this.voteCount,
    required this.avgScore,
    required this.rank,
  });

  factory SilenceLeaderboardRow({
    required int entryId,
    required String displayName,
    required int voteCount,
    required double avgScore,
    required int rank,
  }) = _SilenceLeaderboardRowImpl;

  factory SilenceLeaderboardRow.fromJson(
      Map<String, dynamic> jsonSerialization) {
    return SilenceLeaderboardRow(
      entryId: jsonSerialization['entryId'] as int,
      displayName: jsonSerialization['displayName'] as String,
      voteCount: jsonSerialization['voteCount'] as int,
      avgScore: (jsonSerialization['avgScore'] as num).toDouble(),
      rank: jsonSerialization['rank'] as int,
    );
  }

  int entryId;

  String displayName;

  int voteCount;

  double avgScore;

  int rank;

  /// Returns a shallow copy of this [SilenceLeaderboardRow]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  SilenceLeaderboardRow copyWith({
    int? entryId,
    String? displayName,
    int? voteCount,
    double? avgScore,
    int? rank,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      'entryId': entryId,
      'displayName': displayName,
      'voteCount': voteCount,
      'avgScore': avgScore,
      'rank': rank,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      'entryId': entryId,
      'displayName': displayName,
      'voteCount': voteCount,
      'avgScore': avgScore,
      'rank': rank,
    };
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _SilenceLeaderboardRowImpl extends SilenceLeaderboardRow {
  _SilenceLeaderboardRowImpl({
    required int entryId,
    required String displayName,
    required int voteCount,
    required double avgScore,
    required int rank,
  }) : super._(
          entryId: entryId,
          displayName: displayName,
          voteCount: voteCount,
          avgScore: avgScore,
          rank: rank,
        );

  /// Returns a shallow copy of this [SilenceLeaderboardRow]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  SilenceLeaderboardRow copyWith({
    int? entryId,
    String? displayName,
    int? voteCount,
    double? avgScore,
    int? rank,
  }) {
    return SilenceLeaderboardRow(
      entryId: entryId ?? this.entryId,
      displayName: displayName ?? this.displayName,
      voteCount: voteCount ?? this.voteCount,
      avgScore: avgScore ?? this.avgScore,
      rank: rank ?? this.rank,
    );
  }
}
