import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_ai_guide/config/proximity_constants.dart';

enum ProximityStatus { safe, warning, outOfRange }

class ProximityService {
  ProximityService._();
  static final ProximityService instance = ProximityService._();

  final ValueNotifier<ProximityStatus> statusNotifier =
      ValueNotifier<ProximityStatus>(ProximityStatus.safe);
  final ValueNotifier<double> distanceNotifier = ValueNotifier<double>(0.0);
  final ValueNotifier<String> debugNotifier = ValueNotifier<String>('');
  // Heartbeat (periodic) tracking
  Duration heartbeatInterval = Duration(seconds: HEARTBEAT_INTERVAL_SECONDS);
  Timer? _heartbeatTimer;
  // Heartbeat is enforced ON and cannot be disabled by the user UI.
  final ValueNotifier<bool> heartbeatEnabledNotifier = ValueNotifier<bool>(
    true,
  );
  final ValueNotifier<int> heartbeatIntervalSecondsNotifier =
      ValueNotifier<int>(HEARTBEAT_INTERVAL_SECONDS);

  StreamSubscription<Position>? _positionSub;
  final AudioPlayer _player = AudioPlayer();
  bool _isAlreadyOut = false;

  /// Initializes permissions and (optionally) starts continuous tracking.
  /// Returns true when tracking or at least a one-time check was started;
  /// false when location services or permissions prevent checks.
  Future<bool> initialize({bool startTracking = true}) async {
    // Ensure location services are enabled
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      // Do not start tracking if location services are off
      debugNotifier.value = 'Location services disabled';
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.deniedForever) {
      // Permissions are permanently denied, cannot request.
      debugNotifier.value = 'Location permission denied forever';
      return false;
    }

    if (permission == LocationPermission.denied) {
      // User denied permission (but not permanently), don't start tracking.
      debugNotifier.value = 'Location permission denied';
      return false;
    }

    // Permissions ok -> start tracking
    if (startTracking) startTrackingPosition();
    debugNotifier.value = 'Tracking started';
    // Start heartbeat by default while tracking (foreground). Adjust interval as needed.
    startHeartbeat(heartbeatInterval);
    return true;
  }

  /// Perform a single immediate location check and update status/distance.
  Future<void> checkOnce() async {
    try {
      debugNotifier.value = 'Checking location...';
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      debugNotifier.value =
          'Got location: ${pos.latitude.toStringAsFixed(6)}, ${pos.longitude.toStringAsFixed(6)}';
      await _handlePosition(pos);
      debugNotifier.value =
          'Distance updated: ${distanceNotifier.value.toStringAsFixed(1)} m';
    } catch (e) {
      debugNotifier.value = 'checkOnce error: $e';
    }
  }

  /// Start periodic heartbeat checks. This uses a Timer and works while the
  /// app is running in foreground. For reliable background location on
  /// Android, a foreground service (platform integration) is required.
  void startHeartbeat(Duration interval) {
    stopHeartbeat();
    heartbeatInterval = interval;
    heartbeatIntervalSecondsNotifier.value = interval.inSeconds;
    _heartbeatTimer = Timer.periodic(interval, (_) async {
      await checkOnce();
    });
    heartbeatEnabledNotifier.value = true;
    debugNotifier.value = 'Heartbeat started (${interval.inSeconds}s)';
  }

  void stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    // Internal stop allowed, but UI cannot disable heartbeat via settings.
    heartbeatEnabledNotifier.value = true;
    debugNotifier.value = 'Heartbeat stopped (enforced ON)';
  }

  /// Toggle heartbeat on/off
  void setHeartbeatEnabled(bool enabled) {
    // Heartbeat is enforced always-on; ignore attempts to disable it from UI.
    if (!enabled) {
      debugNotifier.value = 'Attempted to disable heartbeat ignored';
      return;
    }
    startHeartbeat(heartbeatInterval);
  }

  /// Update heartbeat interval (seconds). Restarts heartbeat if enabled.
  void setHeartbeatIntervalSeconds(int seconds) {
    // Interval changes from UI are ignored; heartbeat interval is fixed by policy.
    debugNotifier.value = 'Attempted to change heartbeat interval ignored';
  }

  void dispose() {
    _positionSub?.cancel();
    _player.dispose();
  }

  void startTrackingPosition() {
    _positionSub ??= Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 5,
      ),
    ).listen((pos) => _handlePosition(pos));
  }

  void stopTracking() {
    _positionSub?.cancel();
    _positionSub = null;
  }

  Future<void> _handlePosition(Position position) async {
    final distance = Geolocator.distanceBetween(
      MUSEUM_LATITUDE,
      MUSEUM_LONGITUDE,
      position.latitude,
      position.longitude,
    );

    // Update distance notifier for UI/testing
    distanceNotifier.value = distance;

    if (distance <= SAFE_RADIUS) {
      // Inside safe zone
      if (statusNotifier.value != ProximityStatus.safe) {
        statusNotifier.value = ProximityStatus.safe;
      }
      if (_isAlreadyOut) {
        _isAlreadyOut = false;
        await stopBeeping();
      }
    } else if (distance > SAFE_RADIUS && distance <= WARNING_RADIUS) {
      // Warning zone
      if (statusNotifier.value != ProximityStatus.warning) {
        statusNotifier.value = ProximityStatus.warning;
      }
      if (_isAlreadyOut) {
        _isAlreadyOut = false;
        await stopBeeping();
      }
    } else {
      // Out of range
      if (statusNotifier.value != ProximityStatus.outOfRange) {
        statusNotifier.value = ProximityStatus.outOfRange;
      }
      if (!_isAlreadyOut) {
        _isAlreadyOut = true;
        await startBeeping();
      }
    }
  }

  Future<void> startBeeping() async {
    try {
      await _player.setReleaseMode(ReleaseMode.loop);
      await _player.play(AssetSource('beep.mp3'));
    } catch (_) {}
  }

  Future<void> stopBeeping() async {
    try {
      await _player.stop();
    } catch (_) {}
  }
}
