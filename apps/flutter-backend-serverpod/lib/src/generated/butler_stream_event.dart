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
import 'butler_chat_response.dart' as _i2;

/// One event on the Butler streaming chat channel. `kind` is:
/// 'delta'  – incremental text chunk, append to the live bubble
/// 'done'   – final message; carries the full ButlerChatResponse
/// 'error'  – the chain failed; carries a human-readable message in `text`
abstract class ButlerStreamEvent
    implements _i1.SerializableModel, _i1.ProtocolSerialization {
  ButlerStreamEvent._({
    required this.kind,
    this.text,
    this.response,
  });

  factory ButlerStreamEvent({
    required String kind,
    String? text,
    _i2.ButlerChatResponse? response,
  }) = _ButlerStreamEventImpl;

  factory ButlerStreamEvent.fromJson(Map<String, dynamic> jsonSerialization) {
    return ButlerStreamEvent(
      kind: jsonSerialization['kind'] as String,
      text: jsonSerialization['text'] as String?,
      response: jsonSerialization['response'] == null
          ? null
          : _i2.ButlerChatResponse.fromJson(
              (jsonSerialization['response'] as Map<String, dynamic>)),
    );
  }

  String kind;

  String? text;

  _i2.ButlerChatResponse? response;

  /// Returns a shallow copy of this [ButlerStreamEvent]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  ButlerStreamEvent copyWith({
    String? kind,
    String? text,
    _i2.ButlerChatResponse? response,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      'kind': kind,
      if (text != null) 'text': text,
      if (response != null) 'response': response?.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      'kind': kind,
      if (text != null) 'text': text,
      if (response != null) 'response': response?.toJsonForProtocol(),
    };
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _ButlerStreamEventImpl extends ButlerStreamEvent {
  _ButlerStreamEventImpl({
    required String kind,
    String? text,
    _i2.ButlerChatResponse? response,
  }) : super._(
          kind: kind,
          text: text,
          response: response,
        );

  /// Returns a shallow copy of this [ButlerStreamEvent]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  ButlerStreamEvent copyWith({
    String? kind,
    Object? text = _Undefined,
    Object? response = _Undefined,
  }) {
    return ButlerStreamEvent(
      kind: kind ?? this.kind,
      text: text is String? ? text : this.text,
      response: response is _i2.ButlerChatResponse?
          ? response
          : this.response?.copyWith(),
    );
  }
}
