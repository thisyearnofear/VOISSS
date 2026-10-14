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
import 'greeting.dart' as _i2;
import 'butler_chat_response.dart' as _i3;
import 'butler_entry_card.dart' as _i4;
import 'butler_insights.dart' as _i5;
import 'butler_recording.dart' as _i6;
import 'butler_stream_event.dart' as _i7;
import 'co_writer_message.dart' as _i8;
import 'silence_clip.dart' as _i9;
import 'silence_entry.dart' as _i10;
import 'silence_entry_view.dart' as _i11;
import 'silence_leaderboard_row.dart' as _i12;
import 'silence_vote.dart' as _i13;
import 'package:voisss_butler_client/src/protocol/butler_recording.dart'
    as _i14;
import 'package:voisss_butler_client/src/protocol/silence_clip.dart' as _i15;
import 'package:voisss_butler_client/src/protocol/co_writer_message.dart'
    as _i16;
import 'package:voisss_butler_client/src/protocol/silence_entry_view.dart'
    as _i17;
import 'package:voisss_butler_client/src/protocol/silence_leaderboard_row.dart'
    as _i18;
export 'greeting.dart';
export 'butler_chat_response.dart';
export 'butler_entry_card.dart';
export 'butler_insights.dart';
export 'butler_recording.dart';
export 'butler_stream_event.dart';
export 'co_writer_message.dart';
export 'silence_clip.dart';
export 'silence_entry.dart';
export 'silence_entry_view.dart';
export 'silence_leaderboard_row.dart';
export 'silence_vote.dart';
export 'client.dart';

class Protocol extends _i1.SerializationManager {
  Protocol._();

  factory Protocol() => _instance;

  static final Protocol _instance = Protocol._();

  @override
  T deserialize<T>(
    dynamic data, [
    Type? t,
  ]) {
    t ??= T;
    if (t == _i2.Greeting) {
      return _i2.Greeting.fromJson(data) as T;
    }
    if (t == _i3.ButlerChatResponse) {
      return _i3.ButlerChatResponse.fromJson(data) as T;
    }
    if (t == _i4.ButlerEntryCard) {
      return _i4.ButlerEntryCard.fromJson(data) as T;
    }
    if (t == _i5.ButlerInsights) {
      return _i5.ButlerInsights.fromJson(data) as T;
    }
    if (t == _i6.ButlerRecording) {
      return _i6.ButlerRecording.fromJson(data) as T;
    }
    if (t == _i7.ButlerStreamEvent) {
      return _i7.ButlerStreamEvent.fromJson(data) as T;
    }
    if (t == _i8.CoWriterMessage) {
      return _i8.CoWriterMessage.fromJson(data) as T;
    }
    if (t == _i9.SilenceClip) {
      return _i9.SilenceClip.fromJson(data) as T;
    }
    if (t == _i10.SilenceEntry) {
      return _i10.SilenceEntry.fromJson(data) as T;
    }
    if (t == _i11.SilenceEntryView) {
      return _i11.SilenceEntryView.fromJson(data) as T;
    }
    if (t == _i12.SilenceLeaderboardRow) {
      return _i12.SilenceLeaderboardRow.fromJson(data) as T;
    }
    if (t == _i13.SilenceVote) {
      return _i13.SilenceVote.fromJson(data) as T;
    }
    if (t == _i1.getType<_i2.Greeting?>()) {
      return (data != null ? _i2.Greeting.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i3.ButlerChatResponse?>()) {
      return (data != null ? _i3.ButlerChatResponse.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i4.ButlerEntryCard?>()) {
      return (data != null ? _i4.ButlerEntryCard.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i5.ButlerInsights?>()) {
      return (data != null ? _i5.ButlerInsights.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i6.ButlerRecording?>()) {
      return (data != null ? _i6.ButlerRecording.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i7.ButlerStreamEvent?>()) {
      return (data != null ? _i7.ButlerStreamEvent.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i8.CoWriterMessage?>()) {
      return (data != null ? _i8.CoWriterMessage.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i9.SilenceClip?>()) {
      return (data != null ? _i9.SilenceClip.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i10.SilenceEntry?>()) {
      return (data != null ? _i10.SilenceEntry.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i11.SilenceEntryView?>()) {
      return (data != null ? _i11.SilenceEntryView.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i12.SilenceLeaderboardRow?>()) {
      return (data != null ? _i12.SilenceLeaderboardRow.fromJson(data) : null)
          as T;
    }
    if (t == _i1.getType<_i13.SilenceVote?>()) {
      return (data != null ? _i13.SilenceVote.fromJson(data) : null) as T;
    }
    if (t == List<String>) {
      return (data as List).map((e) => deserialize<String>(e)).toList() as T;
    }
    if (t == _i1.getType<List<_i12.SilenceLeaderboardRow>?>()) {
      return (data != null
          ? (data as List)
              .map((e) => deserialize<_i12.SilenceLeaderboardRow>(e))
              .toList()
          : null) as T;
    }
    if (t == _i1.getType<List<_i9.SilenceClip>?>()) {
      return (data != null
          ? (data as List).map((e) => deserialize<_i9.SilenceClip>(e)).toList()
          : null) as T;
    }
    if (t == _i1.getType<List<_i4.ButlerEntryCard>?>()) {
      return (data != null
          ? (data as List)
              .map((e) => deserialize<_i4.ButlerEntryCard>(e))
              .toList()
          : null) as T;
    }
    if (t == List<_i14.ButlerRecording>) {
      return (data as List)
          .map((e) => deserialize<_i14.ButlerRecording>(e))
          .toList() as T;
    }
    if (t == List<String>) {
      return (data as List).map((e) => deserialize<String>(e)).toList() as T;
    }
    if (t == List<_i15.SilenceClip>) {
      return (data as List)
          .map((e) => deserialize<_i15.SilenceClip>(e))
          .toList() as T;
    }
    if (t == List<_i16.CoWriterMessage>) {
      return (data as List)
          .map((e) => deserialize<_i16.CoWriterMessage>(e))
          .toList() as T;
    }
    if (t == Map<String, String>) {
      return (data as Map).map((k, v) =>
          MapEntry(deserialize<String>(k), deserialize<String>(v))) as T;
    }
    if (t == List<_i17.SilenceEntryView>) {
      return (data as List)
          .map((e) => deserialize<_i17.SilenceEntryView>(e))
          .toList() as T;
    }
    if (t == List<_i18.SilenceLeaderboardRow>) {
      return (data as List)
          .map((e) => deserialize<_i18.SilenceLeaderboardRow>(e))
          .toList() as T;
    }
    return super.deserialize<T>(data, t);
  }

  @override
  String? getClassNameForObject(Object? data) {
    String? className = super.getClassNameForObject(data);
    if (className != null) return className;
    if (data is _i2.Greeting) {
      return 'Greeting';
    }
    if (data is _i3.ButlerChatResponse) {
      return 'ButlerChatResponse';
    }
    if (data is _i4.ButlerEntryCard) {
      return 'ButlerEntryCard';
    }
    if (data is _i5.ButlerInsights) {
      return 'ButlerInsights';
    }
    if (data is _i6.ButlerRecording) {
      return 'ButlerRecording';
    }
    if (data is _i7.ButlerStreamEvent) {
      return 'ButlerStreamEvent';
    }
    if (data is _i8.CoWriterMessage) {
      return 'CoWriterMessage';
    }
    if (data is _i9.SilenceClip) {
      return 'SilenceClip';
    }
    if (data is _i10.SilenceEntry) {
      return 'SilenceEntry';
    }
    if (data is _i11.SilenceEntryView) {
      return 'SilenceEntryView';
    }
    if (data is _i12.SilenceLeaderboardRow) {
      return 'SilenceLeaderboardRow';
    }
    if (data is _i13.SilenceVote) {
      return 'SilenceVote';
    }
    if (data is List<_i18.SilenceLeaderboardRow>) {
      return 'List<SilenceLeaderboardRow>';
    }
    return null;
  }

  @override
  dynamic deserializeByClassName(Map<String, dynamic> data) {
    var dataClassName = data['className'];
    if (dataClassName is! String) {
      return super.deserializeByClassName(data);
    }
    if (dataClassName == 'Greeting') {
      return deserialize<_i2.Greeting>(data['data']);
    }
    if (dataClassName == 'ButlerChatResponse') {
      return deserialize<_i3.ButlerChatResponse>(data['data']);
    }
    if (dataClassName == 'ButlerEntryCard') {
      return deserialize<_i4.ButlerEntryCard>(data['data']);
    }
    if (dataClassName == 'ButlerInsights') {
      return deserialize<_i5.ButlerInsights>(data['data']);
    }
    if (dataClassName == 'ButlerRecording') {
      return deserialize<_i6.ButlerRecording>(data['data']);
    }
    if (dataClassName == 'ButlerStreamEvent') {
      return deserialize<_i7.ButlerStreamEvent>(data['data']);
    }
    if (dataClassName == 'CoWriterMessage') {
      return deserialize<_i8.CoWriterMessage>(data['data']);
    }
    if (dataClassName == 'SilenceClip') {
      return deserialize<_i9.SilenceClip>(data['data']);
    }
    if (dataClassName == 'SilenceEntry') {
      return deserialize<_i10.SilenceEntry>(data['data']);
    }
    if (dataClassName == 'SilenceEntryView') {
      return deserialize<_i11.SilenceEntryView>(data['data']);
    }
    if (dataClassName == 'SilenceLeaderboardRow') {
      return deserialize<_i12.SilenceLeaderboardRow>(data['data']);
    }
    if (dataClassName == 'SilenceVote') {
      return deserialize<_i13.SilenceVote>(data['data']);
    }
    if (dataClassName == 'List<SilenceLeaderboardRow>') {
      return deserialize<List<_i18.SilenceLeaderboardRow>>(data['data']);
    }
    return super.deserializeByClassName(data);
  }
}
