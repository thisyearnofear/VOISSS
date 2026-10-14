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
import 'silence_leaderboard_row.dart' as _i3;
import 'silence_clip.dart' as _i4;
import 'butler_entry_card.dart' as _i5;

/// One event on the Butler streaming chat channel. `kind` is:
/// 'delta'  – incremental text chunk, append to the live bubble
/// 'card'   – structured tool result; `cardKind` says which payload is set
/// 'done'   – final message; carries the full ButlerChatResponse
/// 'error'  – the chain failed; carries a human-readable message in `text`
abstract class ButlerStreamEvent
    implements _i1.SerializableModel, _i1.ProtocolSerialization {
  ButlerStreamEvent._({
    required this.kind,
    this.text,
    this.response,
    this.cardKind,
    this.leaderboard,
    this.clips,
    this.entries,
  });

  factory ButlerStreamEvent({
    required String kind,
    String? text,
    _i2.ButlerChatResponse? response,
    String? cardKind,
    List<_i3.SilenceLeaderboardRow>? leaderboard,
    List<_i4.SilenceClip>? clips,
    List<_i5.ButlerEntryCard>? entries,
  }) = _ButlerStreamEventImpl;

  factory ButlerStreamEvent.fromJson(Map<String, dynamic> jsonSerialization) {
    return ButlerStreamEvent(
      kind: jsonSerialization['kind'] as String,
      text: jsonSerialization['text'] as String?,
      response: jsonSerialization['response'] == null
          ? null
          : _i2.ButlerChatResponse.fromJson(
              (jsonSerialization['response'] as Map<String, dynamic>)),
      cardKind: jsonSerialization['cardKind'] as String?,
      leaderboard: (jsonSerialization['leaderboard'] as List?)
          ?.map((e) =>
              _i3.SilenceLeaderboardRow.fromJson((e as Map<String, dynamic>)))
          .toList(),
      clips: (jsonSerialization['clips'] as List?)
          ?.map((e) => _i4.SilenceClip.fromJson((e as Map<String, dynamic>)))
          .toList(),
      entries: (jsonSerialization['entries'] as List?)
          ?.map(
              (e) => _i5.ButlerEntryCard.fromJson((e as Map<String, dynamic>)))
          .toList(),
    );
  }

  String kind;

  String? text;

  _i2.ButlerChatResponse? response;

  /// For kind 'card': 'leaderboard' | 'clips' | 'entries' | 'error'.
  /// `text` doubles as the card title (e.g. the clip name).
  String? cardKind;

  List<_i3.SilenceLeaderboardRow>? leaderboard;

  List<_i4.SilenceClip>? clips;

  List<_i5.ButlerEntryCard>? entries;

  /// Returns a shallow copy of this [ButlerStreamEvent]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  ButlerStreamEvent copyWith({
    String? kind,
    String? text,
    _i2.ButlerChatResponse? response,
    String? cardKind,
    List<_i3.SilenceLeaderboardRow>? leaderboard,
    List<_i4.SilenceClip>? clips,
    List<_i5.ButlerEntryCard>? entries,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      'kind': kind,
      if (text != null) 'text': text,
      if (response != null) 'response': response?.toJson(),
      if (cardKind != null) 'cardKind': cardKind,
      if (leaderboard != null)
        'leaderboard': leaderboard?.toJson(valueToJson: (v) => v.toJson()),
      if (clips != null) 'clips': clips?.toJson(valueToJson: (v) => v.toJson()),
      if (entries != null)
        'entries': entries?.toJson(valueToJson: (v) => v.toJson()),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      'kind': kind,
      if (text != null) 'text': text,
      if (response != null) 'response': response?.toJsonForProtocol(),
      if (cardKind != null) 'cardKind': cardKind,
      if (leaderboard != null)
        'leaderboard':
            leaderboard?.toJson(valueToJson: (v) => v.toJsonForProtocol()),
      if (clips != null)
        'clips': clips?.toJson(valueToJson: (v) => v.toJsonForProtocol()),
      if (entries != null)
        'entries': entries?.toJson(valueToJson: (v) => v.toJsonForProtocol()),
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
    String? cardKind,
    List<_i3.SilenceLeaderboardRow>? leaderboard,
    List<_i4.SilenceClip>? clips,
    List<_i5.ButlerEntryCard>? entries,
  }) : super._(
          kind: kind,
          text: text,
          response: response,
          cardKind: cardKind,
          leaderboard: leaderboard,
          clips: clips,
          entries: entries,
        );

  /// Returns a shallow copy of this [ButlerStreamEvent]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  ButlerStreamEvent copyWith({
    String? kind,
    Object? text = _Undefined,
    Object? response = _Undefined,
    Object? cardKind = _Undefined,
    Object? leaderboard = _Undefined,
    Object? clips = _Undefined,
    Object? entries = _Undefined,
  }) {
    return ButlerStreamEvent(
      kind: kind ?? this.kind,
      text: text is String? ? text : this.text,
      response: response is _i2.ButlerChatResponse?
          ? response
          : this.response?.copyWith(),
      cardKind: cardKind is String? ? cardKind : this.cardKind,
      leaderboard: leaderboard is List<_i3.SilenceLeaderboardRow>?
          ? leaderboard
          : this.leaderboard?.map((e0) => e0.copyWith()).toList(),
      clips: clips is List<_i4.SilenceClip>?
          ? clips
          : this.clips?.map((e0) => e0.copyWith()).toList(),
      entries: entries is List<_i5.ButlerEntryCard>?
          ? entries
          : this.entries?.map((e0) => e0.copyWith()).toList(),
    );
  }
}
