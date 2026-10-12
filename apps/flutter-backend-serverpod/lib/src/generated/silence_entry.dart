/* AUTOMATICALLY GENERATED CODE DO NOT MODIFY */
/*   To generate run: "serverpod generate"    */

// ignore_for_file: implementation_imports
// ignore_for_file: library_private_types_in_public_api
// ignore_for_file: non_constant_identifier_names
// ignore_for_file: public_member_api_docs
// ignore_for_file: type_literal_in_constant_pattern
// ignore_for_file: use_super_parameters

// ignore_for_file: no_leading_underscores_for_library_prefixes
// ignore_for_file: unnecessary_null_comparison

import 'package:serverpod/serverpod.dart' as _i1;
import 'silence_clip.dart' as _i2;
import 'dart:typed_data' as _i3;

/// A voiceover entry submitted for a SilenceClip.
abstract class SilenceEntry
    implements _i1.TableRow<int?>, _i1.ProtocolSerialization {
  SilenceEntry._({
    this.id,
    required this.clipId,
    this.clip,
    required this.displayName,
    required this.audio,
    required this.audioFormat,
    required this.voteCount,
    required this.voteScoreTotal,
    required this.createdAt,
  });

  factory SilenceEntry({
    int? id,
    required int clipId,
    _i2.SilenceClip? clip,
    required String displayName,
    required _i3.ByteData audio,
    required String audioFormat,
    required int voteCount,
    required int voteScoreTotal,
    required DateTime createdAt,
  }) = _SilenceEntryImpl;

  factory SilenceEntry.fromJson(Map<String, dynamic> jsonSerialization) {
    return SilenceEntry(
      id: jsonSerialization['id'] as int?,
      clipId: jsonSerialization['clipId'] as int,
      clip: jsonSerialization['clip'] == null
          ? null
          : _i2.SilenceClip.fromJson(
              (jsonSerialization['clip'] as Map<String, dynamic>)),
      displayName: jsonSerialization['displayName'] as String,
      audio: _i1.ByteDataJsonExtension.fromJson(jsonSerialization['audio']),
      audioFormat: jsonSerialization['audioFormat'] as String,
      voteCount: jsonSerialization['voteCount'] as int,
      voteScoreTotal: jsonSerialization['voteScoreTotal'] as int,
      createdAt:
          _i1.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
    );
  }

  static final t = SilenceEntryTable();

  static const db = SilenceEntryRepository._();

  @override
  int? id;

  int clipId;

  /// The clip this entry voices.
  _i2.SilenceClip? clip;

  /// Display name the entrant chose (free-form; lightweight identity).
  String displayName;

  /// Raw audio bytes (bytea). Sprint-scale storage; move to cloud storage later.
  _i3.ByteData audio;

  /// Container/codec hint for playback, e.g. "m4a", "wav".
  String audioFormat;

  /// Denormalised vote aggregates, updated on each vote.
  int voteCount;

  int voteScoreTotal;

  DateTime createdAt;

  @override
  _i1.Table<int?> get table => t;

  /// Returns a shallow copy of this [SilenceEntry]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  SilenceEntry copyWith({
    int? id,
    int? clipId,
    _i2.SilenceClip? clip,
    String? displayName,
    _i3.ByteData? audio,
    String? audioFormat,
    int? voteCount,
    int? voteScoreTotal,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'clipId': clipId,
      if (clip != null) 'clip': clip?.toJson(),
      'displayName': displayName,
      'audio': audio.toJson(),
      'audioFormat': audioFormat,
      'voteCount': voteCount,
      'voteScoreTotal': voteScoreTotal,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      if (id != null) 'id': id,
      'clipId': clipId,
      if (clip != null) 'clip': clip?.toJsonForProtocol(),
      'displayName': displayName,
      'audio': audio.toJson(),
      'audioFormat': audioFormat,
      'voteCount': voteCount,
      'voteScoreTotal': voteScoreTotal,
      'createdAt': createdAt.toJson(),
    };
  }

  static SilenceEntryInclude include({_i2.SilenceClipInclude? clip}) {
    return SilenceEntryInclude._(clip: clip);
  }

  static SilenceEntryIncludeList includeList({
    _i1.WhereExpressionBuilder<SilenceEntryTable>? where,
    int? limit,
    int? offset,
    _i1.OrderByBuilder<SilenceEntryTable>? orderBy,
    bool orderDescending = false,
    _i1.OrderByListBuilder<SilenceEntryTable>? orderByList,
    SilenceEntryInclude? include,
  }) {
    return SilenceEntryIncludeList._(
      where: where,
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(SilenceEntry.t),
      orderDescending: orderDescending,
      orderByList: orderByList?.call(SilenceEntry.t),
      include: include,
    );
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _SilenceEntryImpl extends SilenceEntry {
  _SilenceEntryImpl({
    int? id,
    required int clipId,
    _i2.SilenceClip? clip,
    required String displayName,
    required _i3.ByteData audio,
    required String audioFormat,
    required int voteCount,
    required int voteScoreTotal,
    required DateTime createdAt,
  }) : super._(
          id: id,
          clipId: clipId,
          clip: clip,
          displayName: displayName,
          audio: audio,
          audioFormat: audioFormat,
          voteCount: voteCount,
          voteScoreTotal: voteScoreTotal,
          createdAt: createdAt,
        );

  /// Returns a shallow copy of this [SilenceEntry]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  SilenceEntry copyWith({
    Object? id = _Undefined,
    int? clipId,
    Object? clip = _Undefined,
    String? displayName,
    _i3.ByteData? audio,
    String? audioFormat,
    int? voteCount,
    int? voteScoreTotal,
    DateTime? createdAt,
  }) {
    return SilenceEntry(
      id: id is int? ? id : this.id,
      clipId: clipId ?? this.clipId,
      clip: clip is _i2.SilenceClip? ? clip : this.clip?.copyWith(),
      displayName: displayName ?? this.displayName,
      audio: audio ?? this.audio.clone(),
      audioFormat: audioFormat ?? this.audioFormat,
      voteCount: voteCount ?? this.voteCount,
      voteScoreTotal: voteScoreTotal ?? this.voteScoreTotal,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class SilenceEntryTable extends _i1.Table<int?> {
  SilenceEntryTable({super.tableRelation}) : super(tableName: 'silence_entry') {
    clipId = _i1.ColumnInt(
      'clipId',
      this,
    );
    displayName = _i1.ColumnString(
      'displayName',
      this,
    );
    audio = _i1.ColumnByteData(
      'audio',
      this,
    );
    audioFormat = _i1.ColumnString(
      'audioFormat',
      this,
    );
    voteCount = _i1.ColumnInt(
      'voteCount',
      this,
    );
    voteScoreTotal = _i1.ColumnInt(
      'voteScoreTotal',
      this,
    );
    createdAt = _i1.ColumnDateTime(
      'createdAt',
      this,
    );
  }

  late final _i1.ColumnInt clipId;

  /// The clip this entry voices.
  _i2.SilenceClipTable? _clip;

  /// Display name the entrant chose (free-form; lightweight identity).
  late final _i1.ColumnString displayName;

  /// Raw audio bytes (bytea). Sprint-scale storage; move to cloud storage later.
  late final _i1.ColumnByteData audio;

  /// Container/codec hint for playback, e.g. "m4a", "wav".
  late final _i1.ColumnString audioFormat;

  /// Denormalised vote aggregates, updated on each vote.
  late final _i1.ColumnInt voteCount;

  late final _i1.ColumnInt voteScoreTotal;

  late final _i1.ColumnDateTime createdAt;

  _i2.SilenceClipTable get clip {
    if (_clip != null) return _clip!;
    _clip = _i1.createRelationTable(
      relationFieldName: 'clip',
      field: SilenceEntry.t.clipId,
      foreignField: _i2.SilenceClip.t.id,
      tableRelation: tableRelation,
      createTable: (foreignTableRelation) =>
          _i2.SilenceClipTable(tableRelation: foreignTableRelation),
    );
    return _clip!;
  }

  @override
  List<_i1.Column> get columns => [
        id,
        clipId,
        displayName,
        audio,
        audioFormat,
        voteCount,
        voteScoreTotal,
        createdAt,
      ];

  @override
  _i1.Table? getRelationTable(String relationField) {
    if (relationField == 'clip') {
      return clip;
    }
    return null;
  }
}

class SilenceEntryInclude extends _i1.IncludeObject {
  SilenceEntryInclude._({_i2.SilenceClipInclude? clip}) {
    _clip = clip;
  }

  _i2.SilenceClipInclude? _clip;

  @override
  Map<String, _i1.Include?> get includes => {'clip': _clip};

  @override
  _i1.Table<int?> get table => SilenceEntry.t;
}

class SilenceEntryIncludeList extends _i1.IncludeList {
  SilenceEntryIncludeList._({
    _i1.WhereExpressionBuilder<SilenceEntryTable>? where,
    super.limit,
    super.offset,
    super.orderBy,
    super.orderDescending,
    super.orderByList,
    super.include,
  }) {
    super.where = where?.call(SilenceEntry.t);
  }

  @override
  Map<String, _i1.Include?> get includes => include?.includes ?? {};

  @override
  _i1.Table<int?> get table => SilenceEntry.t;
}

class SilenceEntryRepository {
  const SilenceEntryRepository._();

  final attachRow = const SilenceEntryAttachRowRepository._();

  /// Returns a list of [SilenceEntry]s matching the given query parameters.
  ///
  /// Use [where] to specify which items to include in the return value.
  /// If none is specified, all items will be returned.
  ///
  /// To specify the order of the items use [orderBy] or [orderByList]
  /// when sorting by multiple columns.
  ///
  /// The maximum number of items can be set by [limit]. If no limit is set,
  /// all items matching the query will be returned.
  ///
  /// [offset] defines how many items to skip, after which [limit] (or all)
  /// items are read from the database.
  ///
  /// ```dart
  /// var persons = await Persons.db.find(
  ///   session,
  ///   where: (t) => t.lastName.equals('Jones'),
  ///   orderBy: (t) => t.firstName,
  ///   limit: 100,
  /// );
  /// ```
  Future<List<SilenceEntry>> find(
    _i1.Session session, {
    _i1.WhereExpressionBuilder<SilenceEntryTable>? where,
    int? limit,
    int? offset,
    _i1.OrderByBuilder<SilenceEntryTable>? orderBy,
    bool orderDescending = false,
    _i1.OrderByListBuilder<SilenceEntryTable>? orderByList,
    _i1.Transaction? transaction,
    SilenceEntryInclude? include,
  }) async {
    return session.db.find<SilenceEntry>(
      where: where?.call(SilenceEntry.t),
      orderBy: orderBy?.call(SilenceEntry.t),
      orderByList: orderByList?.call(SilenceEntry.t),
      orderDescending: orderDescending,
      limit: limit,
      offset: offset,
      transaction: transaction,
      include: include,
    );
  }

  /// Returns the first matching [SilenceEntry] matching the given query parameters.
  ///
  /// Use [where] to specify which items to include in the return value.
  /// If none is specified, all items will be returned.
  ///
  /// To specify the order use [orderBy] or [orderByList]
  /// when sorting by multiple columns.
  ///
  /// [offset] defines how many items to skip, after which the next one will be picked.
  ///
  /// ```dart
  /// var youngestPerson = await Persons.db.findFirstRow(
  ///   session,
  ///   where: (t) => t.lastName.equals('Jones'),
  ///   orderBy: (t) => t.age,
  /// );
  /// ```
  Future<SilenceEntry?> findFirstRow(
    _i1.Session session, {
    _i1.WhereExpressionBuilder<SilenceEntryTable>? where,
    int? offset,
    _i1.OrderByBuilder<SilenceEntryTable>? orderBy,
    bool orderDescending = false,
    _i1.OrderByListBuilder<SilenceEntryTable>? orderByList,
    _i1.Transaction? transaction,
    SilenceEntryInclude? include,
  }) async {
    return session.db.findFirstRow<SilenceEntry>(
      where: where?.call(SilenceEntry.t),
      orderBy: orderBy?.call(SilenceEntry.t),
      orderByList: orderByList?.call(SilenceEntry.t),
      orderDescending: orderDescending,
      offset: offset,
      transaction: transaction,
      include: include,
    );
  }

  /// Finds a single [SilenceEntry] by its [id] or null if no such row exists.
  Future<SilenceEntry?> findById(
    _i1.Session session,
    int id, {
    _i1.Transaction? transaction,
    SilenceEntryInclude? include,
  }) async {
    return session.db.findById<SilenceEntry>(
      id,
      transaction: transaction,
      include: include,
    );
  }

  /// Inserts all [SilenceEntry]s in the list and returns the inserted rows.
  ///
  /// The returned [SilenceEntry]s will have their `id` fields set.
  ///
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// insert, none of the rows will be inserted.
  Future<List<SilenceEntry>> insert(
    _i1.Session session,
    List<SilenceEntry> rows, {
    _i1.Transaction? transaction,
  }) async {
    return session.db.insert<SilenceEntry>(
      rows,
      transaction: transaction,
    );
  }

  /// Inserts a single [SilenceEntry] and returns the inserted row.
  ///
  /// The returned [SilenceEntry] will have its `id` field set.
  Future<SilenceEntry> insertRow(
    _i1.Session session,
    SilenceEntry row, {
    _i1.Transaction? transaction,
  }) async {
    return session.db.insertRow<SilenceEntry>(
      row,
      transaction: transaction,
    );
  }

  /// Updates all [SilenceEntry]s in the list and returns the updated rows. If
  /// [columns] is provided, only those columns will be updated. Defaults to
  /// all columns.
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// update, none of the rows will be updated.
  Future<List<SilenceEntry>> update(
    _i1.Session session,
    List<SilenceEntry> rows, {
    _i1.ColumnSelections<SilenceEntryTable>? columns,
    _i1.Transaction? transaction,
  }) async {
    return session.db.update<SilenceEntry>(
      rows,
      columns: columns?.call(SilenceEntry.t),
      transaction: transaction,
    );
  }

  /// Updates a single [SilenceEntry]. The row needs to have its id set.
  /// Optionally, a list of [columns] can be provided to only update those
  /// columns. Defaults to all columns.
  Future<SilenceEntry> updateRow(
    _i1.Session session,
    SilenceEntry row, {
    _i1.ColumnSelections<SilenceEntryTable>? columns,
    _i1.Transaction? transaction,
  }) async {
    return session.db.updateRow<SilenceEntry>(
      row,
      columns: columns?.call(SilenceEntry.t),
      transaction: transaction,
    );
  }

  /// Deletes all [SilenceEntry]s in the list and returns the deleted rows.
  /// This is an atomic operation, meaning that if one of the rows fail to
  /// be deleted, none of the rows will be deleted.
  Future<List<SilenceEntry>> delete(
    _i1.Session session,
    List<SilenceEntry> rows, {
    _i1.Transaction? transaction,
  }) async {
    return session.db.delete<SilenceEntry>(
      rows,
      transaction: transaction,
    );
  }

  /// Deletes a single [SilenceEntry].
  Future<SilenceEntry> deleteRow(
    _i1.Session session,
    SilenceEntry row, {
    _i1.Transaction? transaction,
  }) async {
    return session.db.deleteRow<SilenceEntry>(
      row,
      transaction: transaction,
    );
  }

  /// Deletes all rows matching the [where] expression.
  Future<List<SilenceEntry>> deleteWhere(
    _i1.Session session, {
    required _i1.WhereExpressionBuilder<SilenceEntryTable> where,
    _i1.Transaction? transaction,
  }) async {
    return session.db.deleteWhere<SilenceEntry>(
      where: where(SilenceEntry.t),
      transaction: transaction,
    );
  }

  /// Counts the number of rows matching the [where] expression. If omitted,
  /// will return the count of all rows in the table.
  Future<int> count(
    _i1.Session session, {
    _i1.WhereExpressionBuilder<SilenceEntryTable>? where,
    int? limit,
    _i1.Transaction? transaction,
  }) async {
    return session.db.count<SilenceEntry>(
      where: where?.call(SilenceEntry.t),
      limit: limit,
      transaction: transaction,
    );
  }
}

class SilenceEntryAttachRowRepository {
  const SilenceEntryAttachRowRepository._();

  /// Creates a relation between the given [SilenceEntry] and [SilenceClip]
  /// by setting the [SilenceEntry]'s foreign key `clipId` to refer to the [SilenceClip].
  Future<void> clip(
    _i1.Session session,
    SilenceEntry silenceEntry,
    _i2.SilenceClip clip, {
    _i1.Transaction? transaction,
  }) async {
    if (silenceEntry.id == null) {
      throw ArgumentError.notNull('silenceEntry.id');
    }
    if (clip.id == null) {
      throw ArgumentError.notNull('clip.id');
    }

    var $silenceEntry = silenceEntry.copyWith(clipId: clip.id);
    await session.db.updateRow<SilenceEntry>(
      $silenceEntry,
      columns: [SilenceEntry.t.clipId],
      transaction: transaction,
    );
  }
}
