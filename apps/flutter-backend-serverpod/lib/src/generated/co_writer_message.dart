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

/// One turn in a co-writer riff session. `role` is "user" or "assistant".
abstract class CoWriterMessage
    implements _i1.SerializableModel, _i1.ProtocolSerialization {
  CoWriterMessage._({
    required this.role,
    required this.content,
  });

  factory CoWriterMessage({
    required String role,
    required String content,
  }) = _CoWriterMessageImpl;

  factory CoWriterMessage.fromJson(Map<String, dynamic> jsonSerialization) {
    return CoWriterMessage(
      role: jsonSerialization['role'] as String,
      content: jsonSerialization['content'] as String,
    );
  }

  String role;

  String content;

  /// Returns a shallow copy of this [CoWriterMessage]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  CoWriterMessage copyWith({
    String? role,
    String? content,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      'role': role,
      'content': content,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      'role': role,
      'content': content,
    };
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _CoWriterMessageImpl extends CoWriterMessage {
  _CoWriterMessageImpl({
    required String role,
    required String content,
  }) : super._(
          role: role,
          content: content,
        );

  /// Returns a shallow copy of this [CoWriterMessage]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  CoWriterMessage copyWith({
    String? role,
    String? content,
  }) {
    return CoWriterMessage(
      role: role ?? this.role,
      content: content ?? this.content,
    );
  }
}
