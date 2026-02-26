import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';

class AppFontScale {
  AppFontScale._();

  static final AppFontScale instance = AppFontScale._();

  final ValueNotifier<double> notifier = ValueNotifier<double>(1.0);

  double get value => notifier.value;

  Future<void> loadForActiveSession() async {
    final stored = await LocalStorageService.instance.getSetting('font_scale');
    if (stored == null || stored.isEmpty) return;
    final parsed = double.tryParse(stored);
    if (parsed == null) return;
    notifier.value = parsed.clamp(0.85, 1.3);
  }

  void setScale(double scale) {
    final normalized = scale.clamp(0.85, 1.3);
    notifier.value = normalized;
    LocalStorageService.instance.setSetting(
      'font_scale',
      normalized.toString(),
    );
  }
}
