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
import 'silence_clip.dart' as _i2;
import 'dart:typed_data' as _i3;

/// A voiceover entry submitted for a SilenceClip.
abstract class SilenceEntry implements _i1.SerializableModel {
  SilenceEntry._({
    this.id,
    required this.clipId,
    this.clip,
    required this.displayName,
    required this.audio,
    required this.audioFormat,
    required this.voteCount,
    required this.voteScoreTotal,
    required this.createdAt,
  });

  factory SilenceEntry({
    int? id,
    required int clipId,
    _i2.SilenceClip? clip,
    required String displayName,
    required _i3.ByteData audio,
    required String audioFormat,
    required int voteCount,
    required int voteScoreTotal,
    required DateTime createdAt,
  }) = _SilenceEntryImpl;

  factory SilenceEntry.fromJson(Map<String, dynamic> jsonSerialization) {
    return SilenceEntry(
      id: jsonSerialization['id'] as int?,
      clipId: jsonSerialization['clipId'] as int,
      clip: jsonSerialization['clip'] == null
          ? null
          : _i2.SilenceClip.fromJson(
              (jsonSerialization['clip'] as Map<String, dynamic>)),
      displayName: jsonSerialization['displayName'] as String,
      audio: _i1.ByteDataJsonExtension.fromJson(jsonSerialization['audio']),
      audioFormat: jsonSerialization['audioFormat'] as String,
      voteCount: jsonSerialization['voteCount'] as int,
      voteScoreTotal: jsonSerialization['voteScoreTotal'] as int,
      createdAt:
          _i1.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
    );
  }

  /// The database id, set if the object has been inserted into the
  /// database or if it has been fetched from the database. Otherwise,
  /// the id will be null.
  int? id;

  int clipId;

  /// The clip this entry voices.
  _i2.SilenceClip? clip;

  /// Display name the entrant chose (free-form; lightweight identity).
  String displayName;

  /// Raw audio bytes (bytea). Sprint-scale storage; move to cloud storage later.
  _i3.ByteData audio;

  /// Container/codec hint for playback, e.g. "m4a", "wav".
  String audioFormat;

  /// Denormalised vote aggregates, updated on each vote.
  int voteCount;

  int voteScoreTotal;

  DateTime createdAt;

  /// Returns a shallow copy of this [SilenceEntry]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  SilenceEntry copyWith({
    int? id,
    int? clipId,
    _i2.SilenceClip? clip,
    String? displayName,
    _i3.ByteData? audio,
    String? audioFormat,
    int? voteCount,
    int? voteScoreTotal,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'clipId': clipId,
      if (clip != null) 'clip': clip?.toJson(),
      'displayName': displayName,
      'audio': audio.toJson(),
      'audioFormat': audioFormat,
      'voteCount': voteCount,
      'voteScoreTotal': voteScoreTotal,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _SilenceEntryImpl extends SilenceEntry {
  _SilenceEntryImpl({
    int? id,
    required int clipId,
    _i2.SilenceClip? clip,
    required String displayName,
    required _i3.ByteData audio,
    required String audioFormat,
    required int voteCount,
    required int voteScoreTotal,
    required DateTime createdAt,
  }) : super._(
          id: id,
          clipId: clipId,
          clip: clip,
          displayName: displayName,
          audio: audio,
          audioFormat: audioFormat,
          voteCount: voteCount,
          voteScoreTotal: voteScoreTotal,
          createdAt: createdAt,
        );

  /// Returns a shallow copy of this [SilenceEntry]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  SilenceEntry copyWith({
    Object? id = _Undefined,
    int? clipId,
    Object? clip = _Undefined,
    String? displayName,
    _i3.ByteData? audio,
    String? audioFormat,
    int? voteCount,
    int? voteScoreTotal,
    DateTime? createdAt,
  }) {
    return SilenceEntry(
      id: id is int? ? id : this.id,
      clipId: clipId ?? this.clipId,
      clip: clip is _i2.SilenceClip? ? clip : this.clip?.copyWith(),
      displayName: displayName ?? this.displayName,
      audio: audio ?? this.audio.clone(),
      audioFormat: audioFormat ?? this.audioFormat,
      voteCount: voteCount ?? this.voteCount,
      voteScoreTotal: voteScoreTotal ?? this.voteScoreTotal,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
