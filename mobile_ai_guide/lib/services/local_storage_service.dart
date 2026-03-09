import 'dart:convert';

import 'package:mobile_ai_guide/models/artifact.dart';
import 'package:mobile_ai_guide/models/persona.dart';
import 'package:mobile_ai_guide/models/tour.dart';
import 'package:mobile_ai_guide/models/user_session.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

class LocalChatMessageRecord {
  const LocalChatMessageRecord({
    required this.artifactId,
    required this.sender,
    required this.text,
    required this.isWarning,
    required this.time,
  });

  final String artifactId;
  final String sender;
  final String text;
  final bool isWarning;
  final DateTime time;
}

class SessionUsageSummary {
  const SessionUsageSummary({
    required this.exhibitsVisited,
    required this.conversations,
  });

  final int exhibitsVisited;
  final int conversations;
}

class LocalStorageService {
  LocalStorageService._();

  static final LocalStorageService instance = LocalStorageService._();

  static const String _dbName = 'mobile_ai_guide.db';
  static const int _dbVersion = 4;

  static const String _tableMeta = 'app_meta';
  static const String _tableSessions = 'sessions';
  static const String _tableArtifactList = 'artifact_list_cache';
  static const String _tableArtifacts = 'artifacts';
  static const String _tablePersonaList = 'persona_list_cache';
  static const String _tablePersonas = 'personas';
  static const String _tableVisitedArtifacts = 'visited_artifacts';
  static const String _tableTours = 'tours_cache';
  static const String _tableTourProgress = 'tour_progress';
  static const String _tableChatMessages = 'chat_messages';
  static const String _tableSettings = 'app_settings';

  static const String _activeSessionKey = 'active_session_id';

  Database? _database;

  Future<void> initialize() async {
    if (_database != null) return;

    final directory = await getApplicationDocumentsDirectory();
    final dbPath = p.join(directory.path, _dbName);
    _database = await openDatabase(
      dbPath,
      version: _dbVersion,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE $_tableMeta (
            key TEXT PRIMARY KEY,
            value TEXT
          )
        ''');

        await db.execute('''
          CREATE TABLE $_tableSessions (
            session_id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        ''');

        await db.execute('''
          CREATE TABLE $_tableArtifactList (
            session_id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        ''');

        await db.execute('''
          CREATE TABLE $_tableArtifacts (
            session_id TEXT NOT NULL,
            artifact_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (session_id, artifact_id)
          )
        ''');

        await _createPersonaTables(db);
        await _createVisitedArtifactsTable(db);
        await db.execute('''
          CREATE TABLE IF NOT EXISTS $_tableTours (
            session_id TEXT NOT NULL,
            tour_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (session_id, tour_id)
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS $_tableTourProgress (
            session_id TEXT NOT NULL,
            tour_id TEXT NOT NULL,
            visited_ids TEXT NOT NULL,
            started_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (session_id, tour_id)
          )
        ''');

        await db.execute('''
          CREATE TABLE $_tableChatMessages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            artifact_id TEXT NOT NULL,
            sender TEXT NOT NULL,
            text TEXT NOT NULL,
            is_warning INTEGER NOT NULL,
            time_iso TEXT NOT NULL
          )
        ''');

        await db.execute('''
          CREATE TABLE $_tableSettings (
            session_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY (session_id, key)
          )
        ''');
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        if (oldVersion < 2) {
          await _createPersonaTables(db);
        }
        if (oldVersion < 3) {
          await _createVisitedArtifactsTable(db);
        }
        if (oldVersion < 4) {
          await db.execute('''
            CREATE TABLE IF NOT EXISTS $_tableTours (
              session_id TEXT NOT NULL,
              tour_id TEXT NOT NULL,
              payload TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              PRIMARY KEY (session_id, tour_id)
            )
          ''');

          await db.execute('''
            CREATE TABLE IF NOT EXISTS $_tableTourProgress (
              session_id TEXT NOT NULL,
              tour_id TEXT NOT NULL,
              visited_ids TEXT NOT NULL,
              started_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              PRIMARY KEY (session_id, tour_id)
            )
          ''');
        }
      },
    );
  }

  Future<void> _createPersonaTables(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS $_tablePersonaList (
        session_id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS $_tablePersonas (
        session_id TEXT NOT NULL,
        king_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (session_id, king_id)
      )
    ''');
  }

  Future<void> _createVisitedArtifactsTable(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS $_tableVisitedArtifacts (
        session_id TEXT NOT NULL,
        artifact_id TEXT NOT NULL,
        visited_at TEXT NOT NULL,
        PRIMARY KEY (session_id, artifact_id)
      )
    ''');
  }

  Future<Database> get _db async {
    await initialize();
    return _database!;
  }

  // --- Tours persistence and progress tracking ---
  Future<void> cacheTourList(List<Tour> tours) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return;
    final db = await _db;
    final batch = db.batch();
    for (final tour in tours) {
      batch.insert(_tableTours, <String, Object>{
        'session_id': sessionId,
        'tour_id': tour.id,
        'payload': jsonEncode(tour.toJson()),
        'updated_at': DateTime.now().toIso8601String(),
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<List<Tour>?> getCachedTourList() async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return null;
    final db = await _db;
    final rows = await db.query(
      _tableTours,
      where: 'session_id = ?',
      whereArgs: <Object>[sessionId],
      orderBy: 'updated_at DESC',
    );
    if (rows.isEmpty) return null;
    return rows
        .map((r) => Tour.fromJson(jsonDecode(r['payload'] as String) as Map<String, dynamic>))
        .toList();
  }

  Future<void> cacheTour(Tour tour) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return;
    final db = await _db;
    await db.insert(_tableTours, <String, Object>{
      'session_id': sessionId,
      'tour_id': tour.id,
      'payload': jsonEncode(tour.toJson()),
      'updated_at': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<Tour?> getCachedTour(String tourId) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return null;
    final db = await _db;
    final rows = await db.query(
      _tableTours,
      where: 'session_id = ? AND tour_id = ?',
      whereArgs: <Object>[sessionId, tourId],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return Tour.fromJson(jsonDecode(rows.first['payload'] as String) as Map<String, dynamic>);
  }

  Future<void> startTour(String tourId) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return;
    final db = await _db;
    final now = DateTime.now().toIso8601String();
    await db.insert(_tableTourProgress, <String, Object>{
      'session_id': sessionId,
      'tour_id': tourId,
      'visited_ids': jsonEncode(<String>[]),
      'started_at': now,
      'updated_at': now,
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<bool> isTourStarted(String tourId) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return false;
    final db = await _db;
    final rows = await db.query(
      _tableTourProgress,
      where: 'session_id = ? AND tour_id = ?',
      whereArgs: <Object>[sessionId, tourId],
      limit: 1,
    );
    return rows.isNotEmpty;
  }

  Future<List<String>> getVisitedIdsForTour(String tourId) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return <String>[];
    final db = await _db;
    final rows = await db.query(
      _tableTourProgress,
      where: 'session_id = ? AND tour_id = ?',
      whereArgs: <Object>[sessionId, tourId],
      limit: 1,
    );
    if (rows.isEmpty) return <String>[];
    final payload = rows.first['visited_ids'] as String;
    try {
      final decoded = jsonDecode(payload) as List<dynamic>;
      return decoded.map((e) => e.toString()).toList();
    } catch (_) {
      return <String>[];
    }
  }

  Future<void> setTourPointVisited(String tourId, String artifactId, bool visited) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return;
    final db = await _db;
    final rows = await db.query(
      _tableTourProgress,
      where: 'session_id = ? AND tour_id = ?',
      whereArgs: <Object>[sessionId, tourId],
      limit: 1,
    );
    if (rows.isEmpty) {
      // start automatically and then set
      await startTour(tourId);
    }

    final current = await getVisitedIdsForTour(tourId);
    final set = List<String>.from(current);
    if (visited) {
      if (!set.contains(artifactId)) set.add(artifactId);
      // also mark globally visited for session
      await markArtifactVisited(artifactId);
    } else {
      set.removeWhere((id) => id == artifactId);
    }

    final now = DateTime.now().toIso8601String();
    await db.insert(_tableTourProgress, <String, Object>{
      'session_id': sessionId,
      'tour_id': tourId,
      'visited_ids': jsonEncode(set),
      'started_at': rows.isEmpty ? now : rows.first['started_at'] as String,
      'updated_at': now,
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<String?> getActiveSessionId() async {
    final db = await _db;
    final rows = await db.query(
      _tableMeta,
      where: 'key = ?',
      whereArgs: <Object>[_activeSessionKey],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return rows.first['value'] as String?;
  }

  Future<void> activateSession(UserSession session) async {
    final db = await _db;
    final previousSessionId = await getActiveSessionId();

    if (previousSessionId != null && previousSessionId != session.sessionId) {
      await _clearSessionScopedData(db);
    }

    await db.insert(_tableMeta, <String, Object>{
      'key': _activeSessionKey,
      'value': session.sessionId,
    }, conflictAlgorithm: ConflictAlgorithm.replace);

    await db.insert(_tableSessions, <String, Object>{
      'session_id': session.sessionId,
      'payload': jsonEncode(session.toJson()),
      'updated_at': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);

    await _ensureDefaultSettings(
      db,
      sessionId: session.sessionId,
      sessionLanguage: session.language,
    );
  }

  Future<void> upsertSession(UserSession session) async {
    final db = await _db;
    await db.insert(_tableSessions, <String, Object>{
      'session_id': session.sessionId,
      'payload': jsonEncode(session.toJson()),
      'updated_at': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<UserSession?> getSessionById(String sessionId) async {
    final db = await _db;
    final rows = await db.query(
      _tableSessions,
      where: 'session_id = ?',
      whereArgs: <Object>[sessionId],
      limit: 1,
    );

    if (rows.isEmpty) return null;

    final payload = rows.first['payload'] as String;
    return UserSession.fromJson(jsonDecode(payload) as Map<String, dynamic>);
  }

  Future<List<Artifact>?> getCachedArtifactList() async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return null;

    final db = await _db;
    final rows = await db.query(
      _tableArtifactList,
      where: 'session_id = ?',
      whereArgs: <Object>[sessionId],
      limit: 1,
    );

    if (rows.isEmpty) return null;

    final payload = rows.first['payload'] as String;
    final decoded = jsonDecode(payload) as List<dynamic>;
    return decoded
        .map((item) => Artifact.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> cacheArtifactList(List<Artifact> artifacts) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return;

    final db = await _db;
    final payload = artifacts.map((item) => item.toJson()).toList();

    await db.insert(_tableArtifactList, <String, Object>{
      'session_id': sessionId,
      'payload': jsonEncode(payload),
      'updated_at': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);

    final batch = db.batch();
    for (final artifact in artifacts) {
      batch.insert(_tableArtifacts, <String, Object>{
        'session_id': sessionId,
        'artifact_id': artifact.artifactId,
        'payload': jsonEncode(artifact.toJson()),
        'updated_at': DateTime.now().toIso8601String(),
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<Artifact?> getCachedArtifact(String artifactId) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return null;

    final db = await _db;
    final rows = await db.query(
      _tableArtifacts,
      where: 'session_id = ? AND artifact_id = ?',
      whereArgs: <Object>[sessionId, artifactId],
      limit: 1,
    );

    if (rows.isEmpty) return null;

    final payload = rows.first['payload'] as String;
    return Artifact.fromJson(jsonDecode(payload) as Map<String, dynamic>);
  }

  Future<List<Persona>?> getCachedPersonaList() async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return null;

    final db = await _db;
    final rows = await db.query(
      _tablePersonaList,
      where: 'session_id = ?',
      whereArgs: <Object>[sessionId],
      limit: 1,
    );

    if (rows.isEmpty) return null;

    final payload = rows.first['payload'] as String;
    final decoded = jsonDecode(payload) as List<dynamic>;
    return decoded
        .map((item) => Persona.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> cachePersonaList(List<Persona> personas) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return;

    final db = await _db;
    final payload = personas.map((item) => item.toJson()).toList();

    await db.insert(_tablePersonaList, <String, Object>{
      'session_id': sessionId,
      'payload': jsonEncode(payload),
      'updated_at': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);

    final batch = db.batch();
    for (final persona in personas) {
      batch.insert(_tablePersonas, <String, Object>{
        'session_id': sessionId,
        'king_id': persona.kingId,
        'payload': jsonEncode(persona.toJson()),
        'updated_at': DateTime.now().toIso8601String(),
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<Persona?> getCachedPersona(String kingId) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return null;

    final db = await _db;
    final rows = await db.query(
      _tablePersonas,
      where: 'session_id = ? AND king_id = ?',
      whereArgs: <Object>[sessionId, kingId],
      limit: 1,
    );

    if (rows.isEmpty) return null;

    final payload = rows.first['payload'] as String;
    return Persona.fromJson(jsonDecode(payload) as Map<String, dynamic>);
  }

  Future<void> cachePersona(Persona persona) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return;

    final db = await _db;
    await db.insert(_tablePersonas, <String, Object>{
      'session_id': sessionId,
      'king_id': persona.kingId,
      'payload': jsonEncode(persona.toJson()),
      'updated_at': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> cacheArtifact(Artifact artifact) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return;

    final db = await _db;
    await db.insert(_tableArtifacts, <String, Object>{
      'session_id': sessionId,
      'artifact_id': artifact.artifactId,
      'payload': jsonEncode(artifact.toJson()),
      'updated_at': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<LocalChatMessageRecord>> getChatHistory({
    required String artifactId,
  }) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty)
      return <LocalChatMessageRecord>[];

    final db = await _db;
    final rows = await db.query(
      _tableChatMessages,
      where: 'session_id = ? AND artifact_id = ?',
      whereArgs: <Object>[sessionId, artifactId],
      orderBy: 'id ASC',
    );

    return rows
        .map(
          (row) => LocalChatMessageRecord(
            artifactId: row['artifact_id'] as String,
            sender: row['sender'] as String,
            text: row['text'] as String,
            isWarning: (row['is_warning'] as int) == 1,
            time:
                DateTime.tryParse(row['time_iso'] as String) ?? DateTime.now(),
          ),
        )
        .toList();
  }

  Future<void> saveChatMessage({
    required String artifactId,
    required String sender,
    required String text,
    required bool isWarning,
    required DateTime time,
  }) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return;

    final db = await _db;
    await db.insert(_tableChatMessages, <String, Object>{
      'session_id': sessionId,
      'artifact_id': artifactId,
      'sender': sender,
      'text': text,
      'is_warning': isWarning ? 1 : 0,
      'time_iso': time.toIso8601String(),
    });
  }

  Future<void> markArtifactVisited(String artifactId) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return;

    final db = await _db;
    await db.insert(_tableVisitedArtifacts, <String, Object>{
      'session_id': sessionId,
      'artifact_id': artifactId,
      'visited_at': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.ignore);
  }

  Future<String?> getSetting(String key) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return null;

    final db = await _db;
    final rows = await db.query(
      _tableSettings,
      where: 'session_id = ? AND key = ?',
      whereArgs: <Object>[sessionId, key],
      limit: 1,
    );

    if (rows.isEmpty) return null;
    return rows.first['value'] as String?;
  }

  Future<void> setSetting(String key, String value) async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) return;

    final db = await _db;
    await db.insert(_tableSettings, <String, Object>{
      'session_id': sessionId,
      'key': key,
      'value': value,
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<SessionUsageSummary> getSessionUsageSummary() async {
    final sessionId = await getActiveSessionId();
    if (sessionId == null || sessionId.isEmpty) {
      return const SessionUsageSummary(exhibitsVisited: 0, conversations: 0);
    }

    final db = await _db;

    final exhibitsRows = await db.rawQuery(
      '''
      SELECT COUNT(*) AS total
      FROM $_tableVisitedArtifacts
      WHERE session_id = ?
      ''',
      <Object>[sessionId],
    );

    final conversationRows = await db.rawQuery(
      '''
      SELECT COUNT(*) AS total
      FROM $_tableChatMessages
      WHERE session_id = ?
        AND sender = 'user'
      ''',
      <Object>[sessionId],
    );

    final exhibitsVisited = (exhibitsRows.first['total'] as int?) ?? 0;
    final conversations = (conversationRows.first['total'] as int?) ?? 0;

    return SessionUsageSummary(
      exhibitsVisited: exhibitsVisited,
      conversations: conversations,
    );
  }

  Future<void> endActiveSession() async {
    final db = await _db;
    await _clearSessionScopedData(db);
    await db.delete(
      _tableMeta,
      where: 'key = ?',
      whereArgs: <Object>[_activeSessionKey],
    );
  }

  Future<void> _ensureDefaultSettings(
    Database db, {
    required String sessionId,
    required String sessionLanguage,
  }) async {
    final normalizedLanguage = sessionLanguage == 'si' ? 'si' : 'en';
    final defaults = <String, String>{
      'chat_language': normalizedLanguage,
      'content_language': normalizedLanguage,
      'font_scale': '1.0',
    };

    for (final entry in defaults.entries) {
      await db.insert(_tableSettings, <String, Object>{
        'session_id': sessionId,
        'key': entry.key,
        'value': entry.value,
      }, conflictAlgorithm: ConflictAlgorithm.ignore);
    }
  }

  Future<void> _clearSessionScopedData(Database db) async {
    await db.delete(_tableSessions);
    await db.delete(_tableArtifactList);
    await db.delete(_tableArtifacts);
    await db.delete(_tablePersonaList);
    await db.delete(_tablePersonas);
    await db.delete(_tableVisitedArtifacts);
    await db.delete(_tableChatMessages);
    await db.delete(_tableSettings);
  }

  // Saved artifacts (bookmarks) are stored as a JSON array under settings
  // key 'saved_artifacts' scoped to the active session
  Future<List<Artifact>> getSavedArtifacts() async {
    final raw = await getSetting('saved_artifacts');
    if (raw == null || raw.isEmpty) return <Artifact>[];
    try {
      final decoded = jsonDecode(raw) as List<dynamic>;
      return decoded
          .map((item) => Artifact.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return <Artifact>[];
    }
  }

  Future<bool> isArtifactSaved(String artifactId) async {
    final list = await getSavedArtifacts();
    return list.any((a) => a.artifactId == artifactId);
  }

  Future<void> saveArtifactBookmark(Artifact artifact) async {
    final list = await getSavedArtifacts();
    final updated = List<Artifact>.from(list);
    if (!updated.any((a) => a.artifactId == artifact.artifactId)) {
      updated.insert(0, artifact);
    }
    await setSetting(
      'saved_artifacts',
      jsonEncode(updated.map((a) => a.toJson()).toList()),
    );
  }

  Future<void> removeArtifactBookmark(String artifactId) async {
    final list = await getSavedArtifacts();
    final updated = list.where((a) => a.artifactId != artifactId).toList();
    await setSetting(
      'saved_artifacts',
      jsonEncode(updated.map((a) => a.toJson()).toList()),
    );
  }

  Future<void> toggleArtifactBookmark(Artifact artifact) async {
    final saved = await isArtifactSaved(artifact.artifactId);
    if (saved) {
      await removeArtifactBookmark(artifact.artifactId);
    } else {
      await saveArtifactBookmark(artifact);
    }
  }
}
