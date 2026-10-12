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

/// A silent video clip posted for a "Voice the Silence" contest week.
abstract class SilenceClip implements _i1.SerializableModel {
  SilenceClip._({
    this.id,
    required this.title,
    required this.videoUrl,
    required this.durationSec,
    required this.rightsNote,
    required this.weekStart,
    required this.active,
    required this.createdAt,
  });

  factory SilenceClip({
    int? id,
    required String title,
    required String videoUrl,
    required int durationSec,
    required String rightsNote,
    required DateTime weekStart,
    required bool active,
    required DateTime createdAt,
  }) = _SilenceClipImpl;

  factory SilenceClip.fromJson(Map<String, dynamic> jsonSerialization) {
    return SilenceClip(
      id: jsonSerialization['id'] as int?,
      title: jsonSerialization['title'] as String,
      videoUrl: jsonSerialization['videoUrl'] as String,
      durationSec: jsonSerialization['durationSec'] as int,
      rightsNote: jsonSerialization['rightsNote'] as String,
      weekStart:
          _i1.DateTimeJsonExtension.fromJson(jsonSerialization['weekStart']),
      active: jsonSerialization['active'] as bool,
      createdAt:
          _i1.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
    );
  }

  /// The database id, set if the object has been inserted into the
  /// database or if it has been fetched from the database. Otherwise,
  /// the id will be null.
  int? id;

  /// Title shown in the app.
  String title;

  /// Public URL of the (muted) video, e.g. hosted on Netlify/static.
  String videoUrl;

  /// Clip length in seconds.
  int durationSec;

  /// Provenance/rights note, e.g. "Public domain (1923)".
  String rightsNote;

  /// Start of the contest week this clip belongs to.
  DateTime weekStart;

  /// Whether this clip is the currently active contest clip.
  bool active;

  DateTime createdAt;

  /// Returns a shallow copy of this [SilenceClip]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  SilenceClip copyWith({
    int? id,
    String? title,
    String? videoUrl,
    int? durationSec,
    String? rightsNote,
    DateTime? weekStart,
    bool? active,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'title': title,
      'videoUrl': videoUrl,
      'durationSec': durationSec,
      'rightsNote': rightsNote,
      'weekStart': weekStart.toJson(),
      'active': active,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _SilenceClipImpl extends SilenceClip {
  _SilenceClipImpl({
    int? id,
    required String title,
    required String videoUrl,
    required int durationSec,
    required String rightsNote,
    required DateTime weekStart,
    required bool active,
    required DateTime createdAt,
  }) : super._(
          id: id,
          title: title,
          videoUrl: videoUrl,
          durationSec: durationSec,
          rightsNote: rightsNote,
          weekStart: weekStart,
          active: active,
          createdAt: createdAt,
        );

  /// Returns a shallow copy of this [SilenceClip]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  SilenceClip copyWith({
    Object? id = _Undefined,
    String? title,
    String? videoUrl,
    int? durationSec,
    String? rightsNote,
    DateTime? weekStart,
    bool? active,
    DateTime? createdAt,
  }) {
    return SilenceClip(
      id: id is int? ? id : this.id,
      title: title ?? this.title,
      videoUrl: videoUrl ?? this.videoUrl,
      durationSec: durationSec ?? this.durationSec,
      rightsNote: rightsNote ?? this.rightsNote,
      weekStart: weekStart ?? this.weekStart,
      active: active ?? this.active,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
