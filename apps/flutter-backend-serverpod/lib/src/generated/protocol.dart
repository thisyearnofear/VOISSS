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
import 'package:serverpod/protocol.dart' as _i2;
import 'greeting.dart' as _i3;
import 'co_writer_message.dart' as _i4;
import 'silence_clip.dart' as _i5;
import 'silence_entry.dart' as _i6;
import 'silence_entry_view.dart' as _i7;
import 'silence_leaderboard_row.dart' as _i8;
import 'silence_vote.dart' as _i9;
import 'package:voisss_butler_server/src/generated/silence_clip.dart' as _i10;
import 'package:voisss_butler_server/src/generated/co_writer_message.dart'
    as _i11;
import 'package:voisss_butler_server/src/generated/silence_entry_view.dart'
    as _i12;
import 'package:voisss_butler_server/src/generated/silence_leaderboard_row.dart'
    as _i13;
export 'greeting.dart';
export 'co_writer_message.dart';
export 'silence_clip.dart';
export 'silence_entry.dart';
export 'silence_entry_view.dart';
export 'silence_leaderboard_row.dart';
export 'silence_vote.dart';

class Protocol extends _i1.SerializationManagerServer {
  Protocol._();

  factory Protocol() => _instance;

  static final Protocol _instance = Protocol._();

  static final List<_i2.TableDefinition> targetTableDefinitions = [
    _i2.TableDefinition(
      name: 'silence_clip',
      dartName: 'SilenceClip',
      schema: 'public',
      module: 'voisss_butler',
      columns: [
        _i2.ColumnDefinition(
          name: 'id',
          columnType: _i2.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'nextval(\'silence_clip_id_seq\'::regclass)',
        ),
        _i2.ColumnDefinition(
          name: 'title',
          columnType: _i2.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _i2.ColumnDefinition(
          name: 'videoUrl',
          columnType: _i2.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _i2.ColumnDefinition(
          name: 'durationSec',
          columnType: _i2.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _i2.ColumnDefinition(
          name: 'rightsNote',
          columnType: _i2.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _i2.ColumnDefinition(
          name: 'weekStart',
          columnType: _i2.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
        ),
        _i2.ColumnDefinition(
          name: 'active',
          columnType: _i2.ColumnType.boolean,
          isNullable: false,
          dartType: 'bool',
        ),
        _i2.ColumnDefinition(
          name: 'sceneGuide',
          columnType: _i2.ColumnType.text,
          isNullable: false,
          dartType: 'String',
          columnDefault: '\'\'::text',
        ),
        _i2.ColumnDefinition(
          name: 'storageUri',
          columnType: _i2.ColumnType.text,
          isNullable: false,
          dartType: 'String',
          columnDefault: '\'\'::text',
        ),
        _i2.ColumnDefinition(
          name: 'createdAt',
          columnType: _i2.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
        ),
      ],
      foreignKeys: [],
      indexes: [
        _i2.IndexDefinition(
          indexName: 'silence_clip_pkey',
          tableSpace: null,
          elements: [
            _i2.IndexElementDefinition(
              type: _i2.IndexElementDefinitionType.column,
              definition: 'id',
            )
          ],
          type: 'btree',
          isUnique: true,
          isPrimary: true,
        )
      ],
      managed: true,
    ),
    _i2.TableDefinition(
      name: 'silence_entry',
      dartName: 'SilenceEntry',
      schema: 'public',
      module: 'voisss_butler',
      columns: [
        _i2.ColumnDefinition(
          name: 'id',
          columnType: _i2.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'nextval(\'silence_entry_id_seq\'::regclass)',
        ),
        _i2.ColumnDefinition(
          name: 'clipId',
          columnType: _i2.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _i2.ColumnDefinition(
          name: 'displayName',
          columnType: _i2.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _i2.ColumnDefinition(
          name: 'audio',
          columnType: _i2.ColumnType.bytea,
          isNullable: false,
          dartType: 'dart:typed_data:ByteData',
        ),
        _i2.ColumnDefinition(
          name: 'audioFormat',
          columnType: _i2.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _i2.ColumnDefinition(
          name: 'storageUri',
          columnType: _i2.ColumnType.text,
          isNullable: false,
          dartType: 'String',
          columnDefault: '\'\'::text',
        ),
        _i2.ColumnDefinition(
          name: 'audioUrl',
          columnType: _i2.ColumnType.text,
          isNullable: false,
          dartType: 'String',
          columnDefault: '\'\'::text',
        ),
        _i2.ColumnDefinition(
          name: 'isAiGenerated',
          columnType: _i2.ColumnType.boolean,
          isNullable: false,
          dartType: 'bool',
          columnDefault: 'false',
        ),
        _i2.ColumnDefinition(
          name: 'voteCount',
          columnType: _i2.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _i2.ColumnDefinition(
          name: 'voteScoreTotal',
          columnType: _i2.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _i2.ColumnDefinition(
          name: 'createdAt',
          columnType: _i2.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
        ),
      ],
      foreignKeys: [
        _i2.ForeignKeyDefinition(
          constraintName: 'silence_entry_fk_0',
          columns: ['clipId'],
          referenceTable: 'silence_clip',
          referenceTableSchema: 'public',
          referenceColumns: ['id'],
          onUpdate: _i2.ForeignKeyAction.noAction,
          onDelete: _i2.ForeignKeyAction.noAction,
          matchType: null,
        )
      ],
      indexes: [
        _i2.IndexDefinition(
          indexName: 'silence_entry_pkey',
          tableSpace: null,
          elements: [
            _i2.IndexElementDefinition(
              type: _i2.IndexElementDefinitionType.column,
              definition: 'id',
            )
          ],
          type: 'btree',
          isUnique: true,
          isPrimary: true,
        )
      ],
      managed: true,
    ),
    _i2.TableDefinition(
      name: 'silence_vote',
      dartName: 'SilenceVote',
      schema: 'public',
      module: 'voisss_butler',
      columns: [
        _i2.ColumnDefinition(
          name: 'id',
          columnType: _i2.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'nextval(\'silence_vote_id_seq\'::regclass)',
        ),
        _i2.ColumnDefinition(
          name: 'entryId',
          columnType: _i2.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _i2.ColumnDefinition(
          name: 'voterToken',
          columnType: _i2.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _i2.ColumnDefinition(
          name: 'score',
          columnType: _i2.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _i2.ColumnDefinition(
          name: 'createdAt',
          columnType: _i2.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
        ),
      ],
      foreignKeys: [
        _i2.ForeignKeyDefinition(
          constraintName: 'silence_vote_fk_0',
          columns: ['entryId'],
          referenceTable: 'silence_entry',
          referenceTableSchema: 'public',
          referenceColumns: ['id'],
          onUpdate: _i2.ForeignKeyAction.noAction,
          onDelete: _i2.ForeignKeyAction.noAction,
          matchType: null,
        )
      ],
      indexes: [
        _i2.IndexDefinition(
          indexName: 'silence_vote_pkey',
          tableSpace: null,
          elements: [
            _i2.IndexElementDefinition(
              type: _i2.IndexElementDefinitionType.column,
              definition: 'id',
            )
          ],
          type: 'btree',
          isUnique: true,
          isPrimary: true,
        ),
        _i2.IndexDefinition(
          indexName: 'silence_vote_entry_voter_idx',
          tableSpace: null,
          elements: [
            _i2.IndexElementDefinition(
              type: _i2.IndexElementDefinitionType.column,
              definition: 'entryId',
            ),
            _i2.IndexElementDefinition(
              type: _i2.IndexElementDefinitionType.column,
              definition: 'voterToken',
            ),
          ],
          type: 'btree',
          isUnique: true,
          isPrimary: false,
        ),
      ],
      managed: true,
    ),
    ..._i2.Protocol.targetTableDefinitions,
  ];

  @override
  T deserialize<T>(
    dynamic data, [
    Type? t,
  ]) {
    t ??= T;
    if (t == _i3.Greeting) {
      return _i3.Greeting.fromJson(data) as T;
    }
    if (t == _i4.CoWriterMessage) {
      return _i4.CoWriterMessage.fromJson(data) as T;
    }
    if (t == _i5.SilenceClip) {
      return _i5.SilenceClip.fromJson(data) as T;
    }
    if (t == _i6.SilenceEntry) {
      return _i6.SilenceEntry.fromJson(data) as T;
    }
    if (t == _i7.SilenceEntryView) {
      return _i7.SilenceEntryView.fromJson(data) as T;
    }
    if (t == _i8.SilenceLeaderboardRow) {
      return _i8.SilenceLeaderboardRow.fromJson(data) as T;
    }
    if (t == _i9.SilenceVote) {
      return _i9.SilenceVote.fromJson(data) as T;
    }
    if (t == _i1.getType<_i3.Greeting?>()) {
      return (data != null ? _i3.Greeting.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i4.CoWriterMessage?>()) {
      return (data != null ? _i4.CoWriterMessage.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i5.SilenceClip?>()) {
      return (data != null ? _i5.SilenceClip.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i6.SilenceEntry?>()) {
      return (data != null ? _i6.SilenceEntry.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i7.SilenceEntryView?>()) {
      return (data != null ? _i7.SilenceEntryView.fromJson(data) : null) as T;
    }
    if (t == _i1.getType<_i8.SilenceLeaderboardRow?>()) {
      return (data != null ? _i8.SilenceLeaderboardRow.fromJson(data) : null)
          as T;
    }
    if (t == _i1.getType<_i9.SilenceVote?>()) {
      return (data != null ? _i9.SilenceVote.fromJson(data) : null) as T;
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
    if (t == List<_i10.SilenceClip>) {
      return (data as List)
          .map((e) => deserialize<_i10.SilenceClip>(e))
          .toList() as T;
    }
    if (t == List<_i11.CoWriterMessage>) {
      return (data as List)
          .map((e) => deserialize<_i11.CoWriterMessage>(e))
          .toList() as T;
    }
    if (t == Map<String, String>) {
      return (data as Map).map((k, v) =>
          MapEntry(deserialize<String>(k), deserialize<String>(v))) as T;
    }
    if (t == List<_i12.SilenceEntryView>) {
      return (data as List)
          .map((e) => deserialize<_i12.SilenceEntryView>(e))
          .toList() as T;
    }
    if (t == List<_i13.SilenceLeaderboardRow>) {
      return (data as List)
          .map((e) => deserialize<_i13.SilenceLeaderboardRow>(e))
          .toList() as T;
    }
    try {
      return _i2.Protocol().deserialize<T>(data, t);
    } on _i1.DeserializationTypeNotFoundException catch (_) {}
    return super.deserialize<T>(data, t);
  }

  @override
  String? getClassNameForObject(Object? data) {
    String? className = super.getClassNameForObject(data);
    if (className != null) return className;
    if (data is _i3.Greeting) {
      return 'Greeting';
    }
    if (data is _i4.CoWriterMessage) {
      return 'CoWriterMessage';
    }
    if (data is _i5.SilenceClip) {
      return 'SilenceClip';
    }
    if (data is _i6.SilenceEntry) {
      return 'SilenceEntry';
    }
    if (data is _i7.SilenceEntryView) {
      return 'SilenceEntryView';
    }
    if (data is _i8.SilenceLeaderboardRow) {
      return 'SilenceLeaderboardRow';
    }
    if (data is _i9.SilenceVote) {
      return 'SilenceVote';
    }
    className = _i2.Protocol().getClassNameForObject(data);
    if (className != null) {
      return 'serverpod.$className';
    }
    if (data is List<_i13.SilenceLeaderboardRow>) {
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
      return deserialize<_i3.Greeting>(data['data']);
    }
    if (dataClassName == 'CoWriterMessage') {
      return deserialize<_i4.CoWriterMessage>(data['data']);
    }
    if (dataClassName == 'SilenceClip') {
      return deserialize<_i5.SilenceClip>(data['data']);
    }
    if (dataClassName == 'SilenceEntry') {
      return deserialize<_i6.SilenceEntry>(data['data']);
    }
    if (dataClassName == 'SilenceEntryView') {
      return deserialize<_i7.SilenceEntryView>(data['data']);
    }
    if (dataClassName == 'SilenceLeaderboardRow') {
      return deserialize<_i8.SilenceLeaderboardRow>(data['data']);
    }
    if (dataClassName == 'SilenceVote') {
      return deserialize<_i9.SilenceVote>(data['data']);
    }
    if (dataClassName.startsWith('serverpod.')) {
      data['className'] = dataClassName.substring(10);
      return _i2.Protocol().deserializeByClassName(data);
    }
    if (dataClassName == 'List<SilenceLeaderboardRow>') {
      return deserialize<List<_i13.SilenceLeaderboardRow>>(data['data']);
    }
    return super.deserializeByClassName(data);
  }

  @override
  _i1.Table? getTableForType(Type t) {
    {
      var table = _i2.Protocol().getTableForType(t);
      if (table != null) {
        return table;
      }
    }
    switch (t) {
      case _i5.SilenceClip:
        return _i5.SilenceClip.t;
      case _i6.SilenceEntry:
        return _i6.SilenceEntry.t;
      case _i9.SilenceVote:
        return _i9.SilenceVote.t;
    }
    return null;
  }

  @override
  List<_i2.TableDefinition> getTargetTableDefinitions() =>
      targetTableDefinitions;

  @override
  String getModuleName() => 'voisss_butler';
}
