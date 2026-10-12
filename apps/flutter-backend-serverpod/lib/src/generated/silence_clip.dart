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

/// A silent video clip posted for a "Voice the Silence" contest week.
abstract class SilenceClip
    implements _i1.TableRow<int?>, _i1.ProtocolSerialization {
  SilenceClip._({
    this.id,
    required this.title,
    required this.videoUrl,
    required this.durationSec,
    required this.rightsNote,
    required this.weekStart,
    required this.active,
    String? sceneGuide,
    String? storageUri,
    required this.createdAt,
  })  : sceneGuide = sceneGuide ?? '',
        storageUri = storageUri ?? '';

  factory SilenceClip({
    int? id,
    required String title,
    required String videoUrl,
    required int durationSec,
    required String rightsNote,
    required DateTime weekStart,
    required bool active,
    String? sceneGuide,
    String? storageUri,
    required DateTime createdAt,
  }) = _SilenceClipImpl;

  factory SilenceClip.fromJson(Map<String, dynamic> jsonSerialization) {
    return SilenceClip(
      id: jsonSerialization['id'] as int?,
      title: jsonSerialization['title'] as String,
      videoUrl: jsonSerialization['videoUrl'] as String,
      durationSec: jsonSerialization['durationSec'] as int,
      rightsNote: jsonSerialization['rightsNote'] as String,
      weekStart:
          _i1.DateTimeJsonExtension.fromJson(jsonSerialization['weekStart']),
      active: jsonSerialization['active'] as bool,
      sceneGuide: jsonSerialization['sceneGuide'] as String,
      storageUri: jsonSerialization['storageUri'] as String,
      createdAt:
          _i1.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
    );
  }

  static final t = SilenceClipTable();

  static const db = SilenceClipRepository._();

  @override
  int? id;

  /// Title shown in the app.
  String title;

  /// Public URL of the (muted) video, e.g. hosted on Netlify/static.
  String videoUrl;

  /// Clip length in seconds.
  int durationSec;

  /// Provenance/rights note, e.g. "Public domain (1923)".
  String rightsNote;

  /// Start of the contest week this clip belongs to.
  DateTime weekStart;

  /// Whether this clip is the currently active contest clip.
  bool active;

  /// Timestamped scene descriptions distilled from sampled frames by a
  /// vision model (seeded per clip). Powers the co-writer's on-screen context.
  String sceneGuide;

  /// Content-addressed Grove (Lens storage) URI when the source footage
  /// is hosted decentrally ('' when served from videoUrl elsewhere).
  String storageUri;

  DateTime createdAt;

  @override
  _i1.Table<int?> get table => t;

  /// Returns a shallow copy of this [SilenceClip]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  SilenceClip copyWith({
    int? id,
    String? title,
    String? videoUrl,
    int? durationSec,
    String? rightsNote,
    DateTime? weekStart,
    bool? active,
    String? sceneGuide,
    String? storageUri,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'title': title,
      'videoUrl': videoUrl,
      'durationSec': durationSec,
      'rightsNote': rightsNote,
      'weekStart': weekStart.toJson(),
      'active': active,
      'sceneGuide': sceneGuide,
      'storageUri': storageUri,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      if (id != null) 'id': id,
      'title': title,
      'videoUrl': videoUrl,
      'durationSec': durationSec,
      'rightsNote': rightsNote,
      'weekStart': weekStart.toJson(),
      'active': active,
      'sceneGuide': sceneGuide,
      'storageUri': storageUri,
      'createdAt': createdAt.toJson(),
    };
  }

  static SilenceClipInclude include() {
    return SilenceClipInclude._();
  }

  static SilenceClipIncludeList includeList({
    _i1.WhereExpressionBuilder<SilenceClipTable>? where,
    int? limit,
    int? offset,
    _i1.OrderByBuilder<SilenceClipTable>? orderBy,
    bool orderDescending = false,
    _i1.OrderByListBuilder<SilenceClipTable>? orderByList,
    SilenceClipInclude? include,
  }) {
    return SilenceClipIncludeList._(
      where: where,
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(SilenceClip.t),
      orderDescending: orderDescending,
      orderByList: orderByList?.call(SilenceClip.t),
      include: include,
    );
  }

  @override
  String toString() {
    return _i1.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _SilenceClipImpl extends SilenceClip {
  _SilenceClipImpl({
    int? id,
    required String title,
    required String videoUrl,
    required int durationSec,
    required String rightsNote,
    required DateTime weekStart,
    required bool active,
    String? sceneGuide,
    String? storageUri,
    required DateTime createdAt,
  }) : super._(
          id: id,
          title: title,
          videoUrl: videoUrl,
          durationSec: durationSec,
          rightsNote: rightsNote,
          weekStart: weekStart,
          active: active,
          sceneGuide: sceneGuide,
          storageUri: storageUri,
          createdAt: createdAt,
        );

  /// Returns a shallow copy of this [SilenceClip]
  /// with some or all fields replaced by the given arguments.
  @_i1.useResult
  @override
  SilenceClip copyWith({
    Object? id = _Undefined,
    String? title,
    String? videoUrl,
    int? durationSec,
    String? rightsNote,
    DateTime? weekStart,
    bool? active,
    String? sceneGuide,
    String? storageUri,
    DateTime? createdAt,
  }) {
    return SilenceClip(
      id: id is int? ? id : this.id,
      title: title ?? this.title,
      videoUrl: videoUrl ?? this.videoUrl,
      durationSec: durationSec ?? this.durationSec,
      rightsNote: rightsNote ?? this.rightsNote,
      weekStart: weekStart ?? this.weekStart,
      active: active ?? this.active,
      sceneGuide: sceneGuide ?? this.sceneGuide,
      storageUri: storageUri ?? this.storageUri,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class SilenceClipTable extends _i1.Table<int?> {
  SilenceClipTable({super.tableRelation}) : super(tableName: 'silence_clip') {
    title = _i1.ColumnString(
      'title',
      this,
    );
    videoUrl = _i1.ColumnString(
      'videoUrl',
      this,
    );
    durationSec = _i1.ColumnInt(
      'durationSec',
      this,
    );
    rightsNote = _i1.ColumnString(
      'rightsNote',
      this,
    );
    weekStart = _i1.ColumnDateTime(
      'weekStart',
      this,
    );
    active = _i1.ColumnBool(
      'active',
      this,
    );
    sceneGuide = _i1.ColumnString(
      'sceneGuide',
      this,
      hasDefault: true,
    );
    storageUri = _i1.ColumnString(
      'storageUri',
      this,
      hasDefault: true,
    );
    createdAt = _i1.ColumnDateTime(
      'createdAt',
      this,
    );
  }

  /// Title shown in the app.
  late final _i1.ColumnString title;

  /// Public URL of the (muted) video, e.g. hosted on Netlify/static.
  late final _i1.ColumnString videoUrl;

  /// Clip length in seconds.
  late final _i1.ColumnInt durationSec;

  /// Provenance/rights note, e.g. "Public domain (1923)".
  late final _i1.ColumnString rightsNote;

  /// Start of the contest week this clip belongs to.
  late final _i1.ColumnDateTime weekStart;

  /// Whether this clip is the currently active contest clip.
  late final _i1.ColumnBool active;

  /// Timestamped scene descriptions distilled from sampled frames by a
  /// vision model (seeded per clip). Powers the co-writer's on-screen context.
  late final _i1.ColumnString sceneGuide;

  /// Content-addressed Grove (Lens storage) URI when the source footage
  /// is hosted decentrally ('' when served from videoUrl elsewhere).
  late final _i1.ColumnString storageUri;

  late final _i1.ColumnDateTime createdAt;

  @override
  List<_i1.Column> get columns => [
        id,
        title,
        videoUrl,
        durationSec,
        rightsNote,
        weekStart,
        active,
        sceneGuide,
        storageUri,
        createdAt,
      ];
}

class SilenceClipInclude extends _i1.IncludeObject {
  SilenceClipInclude._();

  @override
  Map<String, _i1.Include?> get includes => {};

  @override
  _i1.Table<int?> get table => SilenceClip.t;
}

class SilenceClipIncludeList extends _i1.IncludeList {
  SilenceClipIncludeList._({
    _i1.WhereExpressionBuilder<SilenceClipTable>? where,
    super.limit,
    super.offset,
    super.orderBy,
    super.orderDescending,
    super.orderByList,
    super.include,
  }) {
    super.where = where?.call(SilenceClip.t);
  }

  @override
  Map<String, _i1.Include?> get includes => include?.includes ?? {};

  @override
  _i1.Table<int?> get table => SilenceClip.t;
}

class SilenceClipRepository {
  const SilenceClipRepository._();

  /// Returns a list of [SilenceClip]s matching the given query parameters.
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
  Future<List<SilenceClip>> find(
    _i1.Session session, {
    _i1.WhereExpressionBuilder<SilenceClipTable>? where,
    int? limit,
    int? offset,
    _i1.OrderByBuilder<SilenceClipTable>? orderBy,
    bool orderDescending = false,
    _i1.OrderByListBuilder<SilenceClipTable>? orderByList,
    _i1.Transaction? transaction,
  }) async {
    return session.db.find<SilenceClip>(
      where: where?.call(SilenceClip.t),
      orderBy: orderBy?.call(SilenceClip.t),
      orderByList: orderByList?.call(SilenceClip.t),
      orderDescending: orderDescending,
      limit: limit,
      offset: offset,
      transaction: transaction,
    );
  }

  /// Returns the first matching [SilenceClip] matching the given query parameters.
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
  Future<SilenceClip?> findFirstRow(
    _i1.Session session, {
    _i1.WhereExpressionBuilder<SilenceClipTable>? where,
    int? offset,
    _i1.OrderByBuilder<SilenceClipTable>? orderBy,
    bool orderDescending = false,
    _i1.OrderByListBuilder<SilenceClipTable>? orderByList,
    _i1.Transaction? transaction,
  }) async {
    return session.db.findFirstRow<SilenceClip>(
      where: where?.call(SilenceClip.t),
      orderBy: orderBy?.call(SilenceClip.t),
      orderByList: orderByList?.call(SilenceClip.t),
      orderDescending: orderDescending,
      offset: offset,
      transaction: transaction,
    );
  }

  /// Finds a single [SilenceClip] by its [id] or null if no such row exists.
  Future<SilenceClip?> findById(
    _i1.Session session,
    int id, {
    _i1.Transaction? transaction,
  }) async {
    return session.db.findById<SilenceClip>(
      id,
      transaction: transaction,
    );
  }

  /// Inserts all [SilenceClip]s in the list and returns the inserted rows.
  ///
  /// The returned [SilenceClip]s will have their `id` fields set.
  ///
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// insert, none of the rows will be inserted.
  Future<List<SilenceClip>> insert(
    _i1.Session session,
    List<SilenceClip> rows, {
    _i1.Transaction? transaction,
  }) async {
    return session.db.insert<SilenceClip>(
      rows,
      transaction: transaction,
    );
  }

  /// Inserts a single [SilenceClip] and returns the inserted row.
  ///
  /// The returned [SilenceClip] will have its `id` field set.
  Future<SilenceClip> insertRow(
    _i1.Session session,
    SilenceClip row, {
    _i1.Transaction? transaction,
  }) async {
    return session.db.insertRow<SilenceClip>(
      row,
      transaction: transaction,
    );
  }

  /// Updates all [SilenceClip]s in the list and returns the updated rows. If
  /// [columns] is provided, only those columns will be updated. Defaults to
  /// all columns.
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// update, none of the rows will be updated.
  Future<List<SilenceClip>> update(
    _i1.Session session,
    List<SilenceClip> rows, {
    _i1.ColumnSelections<SilenceClipTable>? columns,
    _i1.Transaction? transaction,
  }) async {
    return session.db.update<SilenceClip>(
      rows,
      columns: columns?.call(SilenceClip.t),
      transaction: transaction,
    );
  }

  /// Updates a single [SilenceClip]. The row needs to have its id set.
  /// Optionally, a list of [columns] can be provided to only update those
  /// columns. Defaults to all columns.
  Future<SilenceClip> updateRow(
    _i1.Session session,
    SilenceClip row, {
    _i1.ColumnSelections<SilenceClipTable>? columns,
    _i1.Transaction? transaction,
  }) async {
    return session.db.updateRow<SilenceClip>(
      row,
      columns: columns?.call(SilenceClip.t),
      transaction: transaction,
    );
  }

  /// Deletes all [SilenceClip]s in the list and returns the deleted rows.
  /// This is an atomic operation, meaning that if one of the rows fail to
  /// be deleted, none of the rows will be deleted.
  Future<List<SilenceClip>> delete(
    _i1.Session session,
    List<SilenceClip> rows, {
    _i1.Transaction? transaction,
  }) async {
    return session.db.delete<SilenceClip>(
      rows,
      transaction: transaction,
    );
  }

  /// Deletes a single [SilenceClip].
  Future<SilenceClip> deleteRow(
    _i1.Session session,
    SilenceClip row, {
    _i1.Transaction? transaction,
  }) async {
    return session.db.deleteRow<SilenceClip>(
      row,
      transaction: transaction,
    );
  }

  /// Deletes all rows matching the [where] expression.
  Future<List<SilenceClip>> deleteWhere(
    _i1.Session session, {
    required _i1.WhereExpressionBuilder<SilenceClipTable> where,
    _i1.Transaction? transaction,
  }) async {
    return session.db.deleteWhere<SilenceClip>(
      where: where(SilenceClip.t),
      transaction: transaction,
    );
  }

  /// Counts the number of rows matching the [where] expression. If omitted,
  /// will return the count of all rows in the table.
  Future<int> count(
    _i1.Session session, {
    _i1.WhereExpressionBuilder<SilenceClipTable>? where,
    int? limit,
    _i1.Transaction? transaction,
  }) async {
    return session.db.count<SilenceClip>(
      where: where?.call(SilenceClip.t),
      limit: limit,
      transaction: transaction,
    );
  }
}
