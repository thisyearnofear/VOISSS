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
import 'silence_clip.dart' as _i3;
import 'silence_entry.dart' as _i4;
import 'silence_entry_view.dart' as _i5;
import 'silence_leaderboard_row.dart' as _i6;
import 'silence_vote.dart' as _i7;
import 'package:voisss_butler_client/src/protocol/silence_clip.dart' as _i8;
import 'package:voisss_butler_client/src/protocol/silence_entry_view.dart'
    as _i9;
import 'package:voisss_butler_client/src/protocol/silence_leaderboard_row.dart'
    as _i10;
export 'greeting.dart';
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
    if (t == _i3.SilenceClip) {
      return _i3.SilenceClip.fromJson(data) as T;
    }
    if (t == _i4.SilenceEntry) {
      return _i4.SilenceEntry.fromJson(data) as T;
    }
    if (t == _i5.SilenceEntryView) {
      return _i5.SilenceEntryView.fromJson(data) as T;
    }
    if (t == _i6.SilenceLeaderboardRow) {
      return _i6.SilenceLeaderboardRow.fromJson(data) as T;
    }
    if (t == _i7.SilenceVote) {
      return _i7.SilenceVote.fromJson(data) as T;
    }
    if (t == _i1.getType<_i2.Greeting?>()) {
      return (data != null ? _i2.Greeting.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i3.SilenceClip?>()) {
      return (data != null ? _i3.SilenceClip.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i4.SilenceEntry?>()) {
      return (data != null ? _i4.SilenceEntry.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i5.SilenceEntryView?>()) {
      return (data != null ? _i5.SilenceEntryView.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i6.SilenceLeaderboardRow?>()) {
      return (data != null ? _i6.SilenceLeaderboardRow.fromJson(data) : null)
          as T;
    }
    if (t == _i1.getType<_i7.SilenceVote?>()) {
      return (data != null ? _i7.SilenceVote.fromJson(data) : null) as T;
    }
    if (t == Map<String, dynamic>) {
      return (data as Map).map((k, v) =>
          MapEntry(deserialize<String>(k), deserialize<dynamic>(v))) as T;
    }
    if (t == _i1.getType<Map<String, dynamic>?>()) {
      return (data != null
          ? (data as Map).map((k, v) =>
              MapEntry(deserialize<String>(k), deserialize<dynamic>(v)))
          : null) as T;
    }
    if (t == List<Map<String, dynamic>>) {
      return (data as List)
          .map((e) => deserialize<Map<String, dynamic>>(e))
          .toList() as T;
    }
    if (t == List<String>) {
      return (data as List).map((e) => deserialize<String>(e)).toList() as T;
    }
    if (t == List<_i8.SilenceClip>) {
      return (data as List).map((e) => deserialize<_i8.SilenceClip>(e)).toList()
          as T;
    }
    if (t == List<_i9.SilenceEntryView>) {
      return (data as List)
          .map((e) => deserialize<_i9.SilenceEntryView>(e))
          .toList() as T;
    }
    if (t == List<_i10.SilenceLeaderboardRow>) {
      return (data as List)
          .map((e) => deserialize<_i10.SilenceLeaderboardRow>(e))
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
    if (data is _i3.SilenceClip) {
      return 'SilenceClip';
    }
    if (data is _i4.SilenceEntry) {
      return 'SilenceEntry';
    }
    if (data is _i5.SilenceEntryView) {
      return 'SilenceEntryView';
    }
    if (data is _i6.SilenceLeaderboardRow) {
      return 'SilenceLeaderboardRow';
    }
    if (data is _i7.SilenceVote) {
      return 'SilenceVote';
    }
    if (data is List<_i10.SilenceLeaderboardRow>) {
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
    if (dataClassName == 'SilenceClip') {
      return deserialize<_i3.SilenceClip>(data['data']);
    }
    if (dataClassName == 'SilenceEntry') {
      return deserialize<_i4.SilenceEntry>(data['data']);
    }
    if (dataClassName == 'SilenceEntryView') {
      return deserialize<_i5.SilenceEntryView>(data['data']);
    }
    if (dataClassName == 'SilenceLeaderboardRow') {
      return deserialize<_i6.SilenceLeaderboardRow>(data['data']);
    }
    if (dataClassName == 'SilenceVote') {
      return deserialize<_i7.SilenceVote>(data['data']);
    }
    if (dataClassName == 'List<SilenceLeaderboardRow>') {
      return deserialize<List<_i10.SilenceLeaderboardRow>>(data['data']);
    }
    return super.deserializeByClassName(data);
  }
}
