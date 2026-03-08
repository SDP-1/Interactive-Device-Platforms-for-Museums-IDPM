import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';

class AppContentLanguage {
  AppContentLanguage._();

  static final AppContentLanguage instance = AppContentLanguage._();

  final ValueNotifier<String> notifier = ValueNotifier<String>('en');

  String get value => notifier.value;

  Future<void> loadForActiveSession() async {
    final stored = await LocalStorageService.instance.getSetting(
      'content_language',
    );
    if (stored == null || stored.isEmpty) return;
    notifier.value = stored == 'si' ? 'si' : 'en';
  }

  void setLanguage(String language) {
    final normalized = language == 'si' ? 'si' : 'en';
    notifier.value = normalized;
    LocalStorageService.instance.setSetting('content_language', normalized);
  }

  static String labelFor(String language) {
    return language == 'si' ? 'Sinhala' : 'English';
  }
}
