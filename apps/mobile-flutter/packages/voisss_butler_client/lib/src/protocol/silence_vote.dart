/* AUTOMATICALLY GENERATED CODE DO NOT MODIFY */
/*   To generate run: "serverpod generate"    */

// ignore_for_file: implementation_imports
// ignore_for_file: library_private_types_in_public_api
// ignore_for_file: non_constant_identifier_names
// ignore_for_file: public_member_api_docs
// ignore_for_file: type_literal_in_constant_pattern
// ignore_for_file: use_super_parameters

// ignore_for_file: no_leading_underscores_for_library_prefixes

import 'package:serverpod_client/serverpod_client.dart' as _i1;
import 'silence_entry.dart' as _i2;

/// One vote per voter session per entry.
abstract class SilenceVote implements _i1.SerializableModel {
  SilenceVote._({
    this.id,
    required this.entryId,
    this.entry,
    required this.voterToken,
    required this.score,
    required this.createdAt,
  });

  factory SilenceVote({
    int? id,
    required int entryId,
    _i2.SilenceEntry? entry,
    required String voterToken,
    required int score,
    required DateTime createdAt,
  }) = _SilenceVoteImpl;

  factory SilenceVote.fromJson(Map<String, dynamic> jsonSerialization) {
    return SilenceVote(
      id: jsonSerialization['id'] as int?,
      entryId: jsonSerialization['entryId'] as int,
      entry: jsonSerialization['entry'] == null
          ? null
          : _i2.SilenceEntry.fromJson(
              (jsonSerialization['entry'] as Map<String, dynamic>)),
      voterToken: jsonSerialization['voterToken'] as String,
      score: jsonSerialization['score'] as int,
      createdAt:
          _i1.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
    );
  }

  /// The database id, set if the object has been inserted into the
  /// database or if it has been fetched from the database. Otherwise,
  /// the id will be null.
  int? id;

  int entryId;

  /// The entry being voted on.
  _i2.SilenceEntry? entry;

  /// Client-generated voter token (UUID stored on device), used to dedupe
  /// votes without requiring accounts.
  String voterToken;

  /// Score 1-5.
  int score;

  DateTime createdAt;

  /// Returns a shallow copy of this [SilenceVote]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  SilenceVote copyWith({
    int? id,
    int? entryId,
    _i2.SilenceEntry? entry,
    String? voterToken,
    int? score,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'entryId': entryId,
      if (entry != null) 'entry': entry?.toJson(),
      'voterToken': voterToken,
      'score': score,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _SilenceVoteImpl extends SilenceVote {
  _SilenceVoteImpl({
    int? id,
    required int entryId,
    _i2.SilenceEntry? entry,
    required String voterToken,
    required int score,
    required DateTime createdAt,
  }) : super._(
          id: id,
          entryId: entryId,
          entry: entry,
          voterToken: voterToken,
          score: score,
          createdAt: createdAt,
        );

  /// Returns a shallow copy of this [SilenceVote]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  SilenceVote copyWith({
    Object? id = _Undefined,
    int? entryId,
    Object? entry = _Undefined,
    String? voterToken,
    int? score,
    DateTime? createdAt,
  }) {
    return SilenceVote(
      id: id is int? ? id : this.id,
      entryId: entryId ?? this.entryId,
      entry: entry is _i2.SilenceEntry? ? entry : this.entry?.copyWith(),
      voterToken: voterToken ?? this.voterToken,
      score: score ?? this.score,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
