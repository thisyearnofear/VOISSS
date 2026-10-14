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

/// A Butler chat message exchanged with the client. Replaces the loose
/// Map<String, dynamic> responses so generated clients can deserialize them.
abstract class ButlerChatResponse implements _i1.SerializableModel {
  ButlerChatResponse._({
    required this.id,
    required this.content,
    required this.isFromUser,
    required this.type,
    required this.timestamp,
    this.recordingId,
    this.provider,
  });

  factory ButlerChatResponse({
    required String id,
    required String content,
    required bool isFromUser,
    required String type,
    required DateTime timestamp,
    String? recordingId,
    String? provider,
  }) = _ButlerChatResponseImpl;

  factory ButlerChatResponse.fromJson(Map<String, dynamic> jsonSerialization) {
    return ButlerChatResponse(
      id: jsonSerialization['id'] as String,
      content: jsonSerialization['content'] as String,
      isFromUser: jsonSerialization['isFromUser'] as bool,
      type: jsonSerialization['type'] as String,
      timestamp:
          _i1.DateTimeJsonExtension.fromJson(jsonSerialization['timestamp']),
      recordingId: jsonSerialization['recordingId'] as String?,
      provider: jsonSerialization['provider'] as String?,
    );
  }

  /// Unique message id.
  String id;

  /// The message text (markdown).
  String content;

  /// True when authored by the user, false when authored by Butler.
  bool isFromUser;

  /// Bubble variant: 'text' or 'transcription'.
  String type;

  /// When the message was produced.
  DateTime timestamp;

  /// Recording the message refers to, if any.
  String? recordingId;

  /// Which LLM provider served the reply (llm, venice, acpCompute).
  String? provider;

  /// Returns a shallow copy of this [ButlerChatResponse]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  ButlerChatResponse copyWith({
    String? id,
    String? content,
    bool? isFromUser,
    String? type,
    DateTime? timestamp,
    String? recordingId,
    String? provider,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'isFromUser': isFromUser,
      'type': type,
      'timestamp': timestamp.toJson(),
      if (recordingId != null) 'recordingId': recordingId,
      if (provider != null) 'provider': provider,
    };
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _ButlerChatResponseImpl extends ButlerChatResponse {
  _ButlerChatResponseImpl({
    required String id,
    required String content,
    required bool isFromUser,
    required String type,
    required DateTime timestamp,
    String? recordingId,
    String? provider,
  }) : super._(
          id: id,
          content: content,
          isFromUser: isFromUser,
          type: type,
          timestamp: timestamp,
          recordingId: recordingId,
          provider: provider,
        );

  /// Returns a shallow copy of this [ButlerChatResponse]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  ButlerChatResponse copyWith({
    String? id,
    String? content,
    bool? isFromUser,
    String? type,
    DateTime? timestamp,
    Object? recordingId = _Undefined,
    Object? provider = _Undefined,
  }) {
    return ButlerChatResponse(
      id: id ?? this.id,
      content: content ?? this.content,
      isFromUser: isFromUser ?? this.isFromUser,
      type: type ?? this.type,
      timestamp: timestamp ?? this.timestamp,
      recordingId: recordingId is String? ? recordingId : this.recordingId,
      provider: provider is String? ? provider : this.provider,
    );
  }
}
