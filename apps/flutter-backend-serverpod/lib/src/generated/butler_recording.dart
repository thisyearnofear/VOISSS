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

/// A recording reference returned by Butler's findRecordings.
abstract class ButlerRecording
    implements _i1.SerializableModel, _i1.ProtocolSerialization {
  ButlerRecording._({
    required this.id,
    required this.title,
    required this.duration,
    required this.date,
  });

  factory ButlerRecording({
    required String id,
    required String title,
    required int duration,
    required String date,
  }) = _ButlerRecordingImpl;

  factory ButlerRecording.fromJson(Map<String, dynamic> jsonSerialization) {
    return ButlerRecording(
      id: jsonSerialization['id'] as String,
      title: jsonSerialization['title'] as String,
      duration: jsonSerialization['duration'] as int,
      date: jsonSerialization['date'] as String,
    );
  }

  String id;

  String title;

  /// Duration in seconds.
  int duration;

  String date;

  /// Returns a shallow copy of this [ButlerRecording]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  ButlerRecording copyWith({
    String? id,
    String? title,
    int? duration,
    String? date,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'duration': duration,
      'date': date,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      'id': id,
      'title': title,
      'duration': duration,
      'date': date,
    };
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _ButlerRecordingImpl extends ButlerRecording {
  _ButlerRecordingImpl({
    required String id,
    required String title,
    required int duration,
    required String date,
  }) : super._(
          id: id,
          title: title,
          duration: duration,
          date: date,
        );

  /// Returns a shallow copy of this [ButlerRecording]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  ButlerRecording copyWith({
    String? id,
    String? title,
    int? duration,
    String? date,
  }) {
    return ButlerRecording(
      id: id ?? this.id,
      title: title ?? this.title,
      duration: duration ?? this.duration,
      date: date ?? this.date,
    );
  }
}
