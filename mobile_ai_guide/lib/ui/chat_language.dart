import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/services/local_storage_service.dart';

class AppChatLanguage {
  AppChatLanguage._();

  static final AppChatLanguage instance = AppChatLanguage._();

  final ValueNotifier<String> notifier = ValueNotifier<String>('en');

  String get value => notifier.value;

  Future<void> loadForActiveSession() async {
    final stored = await LocalStorageService.instance.getSetting(
      'chat_language',
    );
    if (stored == null || stored.isEmpty) return;
    notifier.value = stored == 'si' ? 'si' : 'en';
  }

  void setLanguage(String language) {
    final normalized = language == 'si' ? 'si' : 'en';
    notifier.value = normalized;
    LocalStorageService.instance.setSetting('chat_language', normalized);
  }

  static String labelFor(String language) {
    return language == 'si' ? 'Sinhala' : 'English';
  }

  static String localeFor(String language) {
    return language == 'si' ? 'si_LK' : 'en_US';
  }

  static String languageForLocale(String locale) {
    return locale.startsWith('si') ? 'si' : 'en';
  }
}
