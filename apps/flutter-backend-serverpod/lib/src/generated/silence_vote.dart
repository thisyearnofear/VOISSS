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
import 'silence_entry.dart' as _i2;

/// One vote per voter session per entry.
abstract class SilenceVote
    implements _i1.TableRow<int?>, _i1.ProtocolSerialization {
  SilenceVote._({
    this.id,
    required this.entryId,
    this.entry,
    required this.voterToken,
    required this.score,
    required this.createdAt,
  });

  factory SilenceVote({
    int? id,
    required int entryId,
    _i2.SilenceEntry? entry,
    required String voterToken,
    required int score,
    required DateTime createdAt,
  }) = _SilenceVoteImpl;

  factory SilenceVote.fromJson(Map<String, dynamic> jsonSerialization) {
    return SilenceVote(
      id: jsonSerialization['id'] as int?,
      entryId: jsonSerialization['entryId'] as int,
      entry: jsonSerialization['entry'] == null
          ? null
          : _i2.SilenceEntry.fromJson(
              (jsonSerialization['entry'] as Map<String, dynamic>)),
      voterToken: jsonSerialization['voterToken'] as String,
      score: jsonSerialization['score'] as int,
      createdAt:
          _i1.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
    );
  }

  static final t = SilenceVoteTable();

  static const db = SilenceVoteRepository._();

  @override
  int? id;

  int entryId;

  /// The entry being voted on.
  _i2.SilenceEntry? entry;

  /// Client-generated voter token (UUID stored on device), used to dedupe
  /// votes without requiring accounts.
  String voterToken;

  /// Score 1-5.
  int score;

  DateTime createdAt;

  @override
  _i1.Table<int?> get table => t;

  /// Returns a shallow copy of this [SilenceVote]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  SilenceVote copyWith({
    int? id,
    int? entryId,
    _i2.SilenceEntry? entry,
    String? voterToken,
    int? score,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'entryId': entryId,
      if (entry != null) 'entry': entry?.toJson(),
      'voterToken': voterToken,
      'score': score,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      if (id != null) 'id': id,
      'entryId': entryId,
      if (entry != null) 'entry': entry?.toJsonForProtocol(),
      'voterToken': voterToken,
      'score': score,
      'createdAt': createdAt.toJson(),
    };
  }

  static SilenceVoteInclude include({_i2.SilenceEntryInclude? entry}) {
    return SilenceVoteInclude._(entry: entry);
  }

  static SilenceVoteIncludeList includeList({
    _i1.WhereExpressionBuilder<SilenceVoteTable>? where,
    int? limit,
    int? offset,
    _i1.OrderByBuilder<SilenceVoteTable>? orderBy,
    bool orderDescending = false,
    _i1.OrderByListBuilder<SilenceVoteTable>? orderByList,
    SilenceVoteInclude? include,
  }) {
    return SilenceVoteIncludeList._(
      where: where,
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(SilenceVote.t),
      orderDescending: orderDescending,
      orderByList: orderByList?.call(SilenceVote.t),
      include: include,
    );
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _SilenceVoteImpl extends SilenceVote {
  _SilenceVoteImpl({
    int? id,
    required int entryId,
    _i2.SilenceEntry? entry,
    required String voterToken,
    required int score,
    required DateTime createdAt,
  }) : super._(
          id: id,
          entryId: entryId,
          entry: entry,
          voterToken: voterToken,
          score: score,
          createdAt: createdAt,
        );

  /// Returns a shallow copy of this [SilenceVote]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  SilenceVote copyWith({
    Object? id = _Undefined,
    int? entryId,
    Object? entry = _Undefined,
    String? voterToken,
    int? score,
    DateTime? createdAt,
  }) {
    return SilenceVote(
      id: id is int? ? id : this.id,
      entryId: entryId ?? this.entryId,
      entry: entry is _i2.SilenceEntry? ? entry : this.entry?.copyWith(),
      voterToken: voterToken ?? this.voterToken,
      score: score ?? this.score,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class SilenceVoteTable extends _i1.Table<int?> {
  SilenceVoteTable({super.tableRelation}) : super(tableName: 'silence_vote') {
    entryId = _i1.ColumnInt(
      'entryId',
      this,
    );
    voterToken = _i1.ColumnString(
      'voterToken',
      this,
    );
    score = _i1.ColumnInt(
      'score',
      this,
    );
    createdAt = _i1.ColumnDateTime(
      'createdAt',
      this,
    );
  }

  late final _i1.ColumnInt entryId;

  /// The entry being voted on.
  _i2.SilenceEntryTable? _entry;

  /// Client-generated voter token (UUID stored on device), used to dedupe
  /// votes without requiring accounts.
  late final _i1.ColumnString voterToken;

  /// Score 1-5.
  late final _i1.ColumnInt score;

  late final _i1.ColumnDateTime createdAt;

  _i2.SilenceEntryTable get entry {
    if (_entry != null) return _entry!;
    _entry = _i1.createRelationTable(
      relationFieldName: 'entry',
      field: SilenceVote.t.entryId,
      foreignField: _i2.SilenceEntry.t.id,
      tableRelation: tableRelation,
      createTable: (foreignTableRelation) =>
          _i2.SilenceEntryTable(tableRelation: foreignTableRelation),
    );
    return _entry!;
  }

  @override
  List<_i1.Column> get columns => [
        id,
        entryId,
        voterToken,
        score,
        createdAt,
      ];

  @override
  _i1.Table? getRelationTable(String relationField) {
    if (relationField == 'entry') {
      return entry;
    }
    return null;
  }
}

class SilenceVoteInclude extends _i1.IncludeObject {
  SilenceVoteInclude._({_i2.SilenceEntryInclude? entry}) {
    _entry = entry;
  }

  _i2.SilenceEntryInclude? _entry;

  @override
  Map<String, _i1.Include?> get includes => {'entry': _entry};

  @override
  _i1.Table<int?> get table => SilenceVote.t;
}

class SilenceVoteIncludeList extends _i1.IncludeList {
  SilenceVoteIncludeList._({
    _i1.WhereExpressionBuilder<SilenceVoteTable>? where,
    super.limit,
    super.offset,
    super.orderBy,
    super.orderDescending,
    super.orderByList,
    super.include,
  }) {
    super.where = where?.call(SilenceVote.t);
  }

  @override
  Map<String, _i1.Include?> get includes => include?.includes ?? {};

  @override
  _i1.Table<int?> get table => SilenceVote.t;
}

class SilenceVoteRepository {
  const SilenceVoteRepository._();

  final attachRow = const SilenceVoteAttachRowRepository._();

  /// Returns a list of [SilenceVote]s matching the given query parameters.
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
  Future<List<SilenceVote>> find(
    _i1.Session session, {
    _i1.WhereExpressionBuilder<SilenceVoteTable>? where,
    int? limit,
    int? offset,
    _i1.OrderByBuilder<SilenceVoteTable>? orderBy,
    bool orderDescending = false,
    _i1.OrderByListBuilder<SilenceVoteTable>? orderByList,
    _i1.Transaction? transaction,
    SilenceVoteInclude? include,
  }) async {
    return session.db.find<SilenceVote>(
      where: where?.call(SilenceVote.t),
      orderBy: orderBy?.call(SilenceVote.t),
      orderByList: orderByList?.call(SilenceVote.t),
      orderDescending: orderDescending,
      limit: limit,
      offset: offset,
      transaction: transaction,
      include: include,
    );
  }

  /// Returns the first matching [SilenceVote] matching the given query parameters.
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
  Future<SilenceVote?> findFirstRow(
    _i1.Session session, {
    _i1.WhereExpressionBuilder<SilenceVoteTable>? where,
    int? offset,
    _i1.OrderByBuilder<SilenceVoteTable>? orderBy,
    bool orderDescending = false,
    _i1.OrderByListBuilder<SilenceVoteTable>? orderByList,
    _i1.Transaction? transaction,
    SilenceVoteInclude? include,
  }) async {
    return session.db.findFirstRow<SilenceVote>(
      where: where?.call(SilenceVote.t),
      orderBy: orderBy?.call(SilenceVote.t),
      orderByList: orderByList?.call(SilenceVote.t),
      orderDescending: orderDescending,
      offset: offset,
      transaction: transaction,
      include: include,
    );
  }

  /// Finds a single [SilenceVote] by its [id] or null if no such row exists.
  Future<SilenceVote?> findById(
    _i1.Session session,
    int id, {
    _i1.Transaction? transaction,
    SilenceVoteInclude? include,
  }) async {
    return session.db.findById<SilenceVote>(
      id,
      transaction: transaction,
      include: include,
    );
  }

  /// Inserts all [SilenceVote]s in the list and returns the inserted rows.
  ///
  /// The returned [SilenceVote]s will have their `id` fields set.
  ///
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// insert, none of the rows will be inserted.
  Future<List<SilenceVote>> insert(
    _i1.Session session,
    List<SilenceVote> rows, {
    _i1.Transaction? transaction,
  }) async {
    return session.db.insert<SilenceVote>(
      rows,
      transaction: transaction,
    );
  }

  /// Inserts a single [SilenceVote] and returns the inserted row.
  ///
  /// The returned [SilenceVote] will have its `id` field set.
  Future<SilenceVote> insertRow(
    _i1.Session session,
    SilenceVote row, {
    _i1.Transaction? transaction,
  }) async {
    return session.db.insertRow<SilenceVote>(
      row,
      transaction: transaction,
    );
  }

  /// Updates all [SilenceVote]s in the list and returns the updated rows. If
  /// [columns] is provided, only those columns will be updated. Defaults to
  /// all columns.
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// update, none of the rows will be updated.
  Future<List<SilenceVote>> update(
    _i1.Session session,
    List<SilenceVote> rows, {
    _i1.ColumnSelections<SilenceVoteTable>? columns,
    _i1.Transaction? transaction,
  }) async {
    return session.db.update<SilenceVote>(
      rows,
      columns: columns?.call(SilenceVote.t),
      transaction: transaction,
    );
  }

  /// Updates a single [SilenceVote]. The row needs to have its id set.
  /// Optionally, a list of [columns] can be provided to only update those
  /// columns. Defaults to all columns.
  Future<SilenceVote> updateRow(
    _i1.Session session,
    SilenceVote row, {
    _i1.ColumnSelections<SilenceVoteTable>? columns,
    _i1.Transaction? transaction,
  }) async {
    return session.db.updateRow<SilenceVote>(
      row,
      columns: columns?.call(SilenceVote.t),
      transaction: transaction,
    );
  }

  /// Deletes all [SilenceVote]s in the list and returns the deleted rows.
  /// This is an atomic operation, meaning that if one of the rows fail to
  /// be deleted, none of the rows will be deleted.
  Future<List<SilenceVote>> delete(
    _i1.Session session,
    List<SilenceVote> rows, {
    _i1.Transaction? transaction,
  }) async {
    return session.db.delete<SilenceVote>(
      rows,
      transaction: transaction,
    );
  }

  /// Deletes a single [SilenceVote].
  Future<SilenceVote> deleteRow(
    _i1.Session session,
    SilenceVote row, {
    _i1.Transaction? transaction,
  }) async {
    return session.db.deleteRow<SilenceVote>(
      row,
      transaction: transaction,
    );
  }

  /// Deletes all rows matching the [where] expression.
  Future<List<SilenceVote>> deleteWhere(
    _i1.Session session, {
    required _i1.WhereExpressionBuilder<SilenceVoteTable> where,
    _i1.Transaction? transaction,
  }) async {
    return session.db.deleteWhere<SilenceVote>(
      where: where(SilenceVote.t),
      transaction: transaction,
    );
  }

  /// Counts the number of rows matching the [where] expression. If omitted,
  /// will return the count of all rows in the table.
  Future<int> count(
    _i1.Session session, {
    _i1.WhereExpressionBuilder<SilenceVoteTable>? where,
    int? limit,
    _i1.Transaction? transaction,
  }) async {
    return session.db.count<SilenceVote>(
      where: where?.call(SilenceVote.t),
      limit: limit,
      transaction: transaction,
    );
  }
}

class SilenceVoteAttachRowRepository {
  const SilenceVoteAttachRowRepository._();

  /// Creates a relation between the given [SilenceVote] and [SilenceEntry]
  /// by setting the [SilenceVote]'s foreign key `entryId` to refer to the [SilenceEntry].
  Future<void> entry(
    _i1.Session session,
    SilenceVote silenceVote,
    _i2.SilenceEntry entry, {
    _i1.Transaction? transaction,
  }) async {
    if (silenceVote.id == null) {
      throw ArgumentError.notNull('silenceVote.id');
    }
    if (entry.id == null) {
      throw ArgumentError.notNull('entry.id');
    }

    var $silenceVote = silenceVote.copyWith(entryId: entry.id);
    await session.db.updateRow<SilenceVote>(
      $silenceVote,
      columns: [SilenceVote.t.entryId],
      transaction: transaction,
    );
  }
}
