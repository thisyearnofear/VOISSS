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
import 'dart:typed_data' as _i2;

/// Public view of an entry returned to clients (no internal fields).
abstract class SilenceEntryView
    implements _i1.SerializableModel, _i1.ProtocolSerialization {
  SilenceEntryView._({
    required this.id,
    required this.clipId,
    required this.displayName,
    required this.audio,
    required this.audioFormat,
    required this.audioUrl,
    required this.storageUri,
    required this.isAiGenerated,
    required this.voteCount,
    required this.avgScore,
    required this.createdAt,
  });

  factory SilenceEntryView({
    required int id,
    required int clipId,
    required String displayName,
    required _i2.ByteData audio,
    required String audioFormat,
    required String audioUrl,
    required String storageUri,
    required bool isAiGenerated,
    required int voteCount,
    required double avgScore,
    required DateTime createdAt,
  }) = _SilenceEntryViewImpl;

  factory SilenceEntryView.fromJson(Map<String, dynamic> jsonSerialization) {
    return SilenceEntryView(
      id: jsonSerialization['id'] as int,
      clipId: jsonSerialization['clipId'] as int,
      displayName: jsonSerialization['displayName'] as String,
      audio: _i1.ByteDataJsonExtension.fromJson(jsonSerialization['audio']),
      audioFormat: jsonSerialization['audioFormat'] as String,
      audioUrl: jsonSerialization['audioUrl'] as String,
      storageUri: jsonSerialization['storageUri'] as String,
      isAiGenerated: jsonSerialization['isAiGenerated'] as bool,
      voteCount: jsonSerialization['voteCount'] as int,
      avgScore: (jsonSerialization['avgScore'] as num).toDouble(),
      createdAt:
          _i1.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
    );
  }

  int id;

  int clipId;

  String displayName;

  _i2.ByteData audio;

  String audioFormat;

  /// Grove gateway URL when the take was uploaded to Lens storage
  /// ('' otherwise — fall back to the `audio` bytes).
  String audioUrl;

  /// Content-addressed `lens://` URI — provenance for the asset ('' if none).
  String storageUri;

  bool isAiGenerated;

  int voteCount;

  double avgScore;

  DateTime createdAt;

  /// Returns a shallow copy of this [SilenceEntryView]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  SilenceEntryView copyWith({
    int? id,
    int? clipId,
    String? displayName,
    _i2.ByteData? audio,
    String? audioFormat,
    String? audioUrl,
    String? storageUri,
    bool? isAiGenerated,
    int? voteCount,
    double? avgScore,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'clipId': clipId,
      'displayName': displayName,
      'audio': audio.toJson(),
      'audioFormat': audioFormat,
      'audioUrl': audioUrl,
      'storageUri': storageUri,
      'isAiGenerated': isAiGenerated,
      'voteCount': voteCount,
      'avgScore': avgScore,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      'id': id,
      'clipId': clipId,
      'displayName': displayName,
      'audio': audio.toJson(),
      'audioFormat': audioFormat,
      'audioUrl': audioUrl,
      'storageUri': storageUri,
      'isAiGenerated': isAiGenerated,
      'voteCount': voteCount,
      'avgScore': avgScore,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _SilenceEntryViewImpl extends SilenceEntryView {
  _SilenceEntryViewImpl({
    required int id,
    required int clipId,
    required String displayName,
    required _i2.ByteData audio,
    required String audioFormat,
    required String audioUrl,
    required String storageUri,
    required bool isAiGenerated,
    required int voteCount,
    required double avgScore,
    required DateTime createdAt,
  }) : super._(
          id: id,
          clipId: clipId,
          displayName: displayName,
          audio: audio,
          audioFormat: audioFormat,
          audioUrl: audioUrl,
          storageUri: storageUri,
          isAiGenerated: isAiGenerated,
          voteCount: voteCount,
          avgScore: avgScore,
          createdAt: createdAt,
        );

  /// Returns a shallow copy of this [SilenceEntryView]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  SilenceEntryView copyWith({
    int? id,
    int? clipId,
    String? displayName,
    _i2.ByteData? audio,
    String? audioFormat,
    String? audioUrl,
    String? storageUri,
    bool? isAiGenerated,
    int? voteCount,
    double? avgScore,
    DateTime? createdAt,
  }) {
    return SilenceEntryView(
      id: id ?? this.id,
      clipId: clipId ?? this.clipId,
      displayName: displayName ?? this.displayName,
      audio: audio ?? this.audio.clone(),
      audioFormat: audioFormat ?? this.audioFormat,
      audioUrl: audioUrl ?? this.audioUrl,
      storageUri: storageUri ?? this.storageUri,
      isAiGenerated: isAiGenerated ?? this.isAiGenerated,
      voteCount: voteCount ?? this.voteCount,
      avgScore: avgScore ?? this.avgScore,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
