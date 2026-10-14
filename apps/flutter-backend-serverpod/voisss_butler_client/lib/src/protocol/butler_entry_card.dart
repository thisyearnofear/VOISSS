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

/// Lightweight voice-take card for Butler tool results. The full
/// SilenceEntry row carries raw audio bytes (bytea) — far too heavy to
/// ship inside a chat event, so this carries just what a card needs.
abstract class ButlerEntryCard implements _i1.SerializableModel {
  ButlerEntryCard._({
    required this.id,
    required this.clipId,
    required this.displayName,
    required this.audioUrl,
    required this.audioFormat,
    required this.isAiGenerated,
    required this.voteCount,
    required this.avgScore,
  });

  factory ButlerEntryCard({
    required int id,
    required int clipId,
    required String displayName,
    required String audioUrl,
    required String audioFormat,
    required bool isAiGenerated,
    required int voteCount,
    required double avgScore,
  }) = _ButlerEntryCardImpl;

  factory ButlerEntryCard.fromJson(Map<String, dynamic> jsonSerialization) {
    return ButlerEntryCard(
      id: jsonSerialization['id'] as int,
      clipId: jsonSerialization['clipId'] as int,
      displayName: jsonSerialization['displayName'] as String,
      audioUrl: jsonSerialization['audioUrl'] as String,
      audioFormat: jsonSerialization['audioFormat'] as String,
      isAiGenerated: jsonSerialization['isAiGenerated'] as bool,
      voteCount: jsonSerialization['voteCount'] as int,
      avgScore: (jsonSerialization['avgScore'] as num).toDouble(),
    );
  }

  int id;

  int clipId;

  String displayName;

  /// Grove gateway URL for playback ('' when only DB bytes exist).
  String audioUrl;

  String audioFormat;

  bool isAiGenerated;

  int voteCount;

  double avgScore;

  /// Returns a shallow copy of this [ButlerEntryCard]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  ButlerEntryCard copyWith({
    int? id,
    int? clipId,
    String? displayName,
    String? audioUrl,
    String? audioFormat,
    bool? isAiGenerated,
    int? voteCount,
    double? avgScore,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'clipId': clipId,
      'displayName': displayName,
      'audioUrl': audioUrl,
      'audioFormat': audioFormat,
      'isAiGenerated': isAiGenerated,
      'voteCount': voteCount,
      'avgScore': avgScore,
    };
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _ButlerEntryCardImpl extends ButlerEntryCard {
  _ButlerEntryCardImpl({
    required int id,
    required int clipId,
    required String displayName,
    required String audioUrl,
    required String audioFormat,
    required bool isAiGenerated,
    required int voteCount,
    required double avgScore,
  }) : super._(
          id: id,
          clipId: clipId,
          displayName: displayName,
          audioUrl: audioUrl,
          audioFormat: audioFormat,
          isAiGenerated: isAiGenerated,
          voteCount: voteCount,
          avgScore: avgScore,
        );

  /// Returns a shallow copy of this [ButlerEntryCard]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  ButlerEntryCard copyWith({
    int? id,
    int? clipId,
    String? displayName,
    String? audioUrl,
    String? audioFormat,
    bool? isAiGenerated,
    int? voteCount,
    double? avgScore,
  }) {
    return ButlerEntryCard(
      id: id ?? this.id,
      clipId: clipId ?? this.clipId,
      displayName: displayName ?? this.displayName,
      audioUrl: audioUrl ?? this.audioUrl,
      audioFormat: audioFormat ?? this.audioFormat,
      isAiGenerated: isAiGenerated ?? this.isAiGenerated,
      voteCount: voteCount ?? this.voteCount,
      avgScore: avgScore ?? this.avgScore,
    );
  }
}
