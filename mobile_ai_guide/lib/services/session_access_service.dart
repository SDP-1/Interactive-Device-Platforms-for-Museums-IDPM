import 'package:mobile_ai_guide/models/user_session.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';

class SessionAccessException implements Exception {
  SessionAccessException(this.message);

  final String message;

  @override
  String toString() => message;
}

class SessionAccessService {
  SessionAccessService._();

  static Future<UserSession> requireActiveSession() async {
    final activeSessionId = await LocalStorageService.instance
        .getActiveSessionId();
    if (activeSessionId == null || activeSessionId.isEmpty) {
      throw SessionAccessException('No active session found.');
    }

    final session = await LocalStorageService.instance.getSessionById(
      activeSessionId,
    );

    if (session == null) {
      throw SessionAccessException(
        'Session not found. Please scan session QR.',
      );
    }

    final isValid = session.isActive && session.endTime.isAfter(DateTime.now());
    if (!isValid) {
      throw SessionAccessException(
        'Session has expired. Please scan a new session QR to continue.',
      );
    }

    return session;
  }

  static Future<String> requireActiveSessionId() async {
    final session = await requireActiveSession();
    return session.sessionId;
  }
}
