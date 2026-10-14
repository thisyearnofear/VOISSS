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

/// Usage insights returned by Butler's getInsights.
abstract class ButlerInsights
    implements _i1.SerializableModel, _i1.ProtocolSerialization {
  ButlerInsights._({
    required this.summary,
    required this.topTopics,
    required this.recordingFrequency,
    required this.suggestions,
    required this.totalRecordings,
    required this.totalDuration,
  });

  factory ButlerInsights({
    required String summary,
    required List<String> topTopics,
    required String recordingFrequency,
    required List<String> suggestions,
    required int totalRecordings,
    required int totalDuration,
  }) = _ButlerInsightsImpl;

  factory ButlerInsights.fromJson(Map<String, dynamic> jsonSerialization) {
    return ButlerInsights(
      summary: jsonSerialization['summary'] as String,
      topTopics: (jsonSerialization['topTopics'] as List)
          .map((e) => e as String)
          .toList(),
      recordingFrequency: jsonSerialization['recordingFrequency'] as String,
      suggestions: (jsonSerialization['suggestions'] as List)
          .map((e) => e as String)
          .toList(),
      totalRecordings: jsonSerialization['totalRecordings'] as int,
      totalDuration: jsonSerialization['totalDuration'] as int,
    );
  }

  String summary;

  List<String> topTopics;

  String recordingFrequency;

  List<String> suggestions;

  int totalRecordings;

  int totalDuration;

  /// Returns a shallow copy of this [ButlerInsights]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  ButlerInsights copyWith({
    String? summary,
    List<String>? topTopics,
    String? recordingFrequency,
    List<String>? suggestions,
    int? totalRecordings,
    int? totalDuration,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      'summary': summary,
      'topTopics': topTopics.toJson(),
      'recordingFrequency': recordingFrequency,
      'suggestions': suggestions.toJson(),
      'totalRecordings': totalRecordings,
      'totalDuration': totalDuration,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      'summary': summary,
      'topTopics': topTopics.toJson(),
      'recordingFrequency': recordingFrequency,
      'suggestions': suggestions.toJson(),
      'totalRecordings': totalRecordings,
      'totalDuration': totalDuration,
    };
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _ButlerInsightsImpl extends ButlerInsights {
  _ButlerInsightsImpl({
    required String summary,
    required List<String> topTopics,
    required String recordingFrequency,
    required List<String> suggestions,
    required int totalRecordings,
    required int totalDuration,
  }) : super._(
          summary: summary,
          topTopics: topTopics,
          recordingFrequency: recordingFrequency,
          suggestions: suggestions,
          totalRecordings: totalRecordings,
          totalDuration: totalDuration,
        );

  /// Returns a shallow copy of this [ButlerInsights]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  ButlerInsights copyWith({
    String? summary,
    List<String>? topTopics,
    String? recordingFrequency,
    List<String>? suggestions,
    int? totalRecordings,
    int? totalDuration,
  }) {
    return ButlerInsights(
      summary: summary ?? this.summary,
      topTopics: topTopics ?? this.topTopics.map((e0) => e0).toList(),
      recordingFrequency: recordingFrequency ?? this.recordingFrequency,
      suggestions: suggestions ?? this.suggestions.map((e0) => e0).toList(),
      totalRecordings: totalRecordings ?? this.totalRecordings,
      totalDuration: totalDuration ?? this.totalDuration,
    );
  }
}
