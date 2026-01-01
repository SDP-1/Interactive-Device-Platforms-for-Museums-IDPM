import 'package:flutter/material.dart';

class AppChatLanguage {
  AppChatLanguage._();

  static final AppChatLanguage instance = AppChatLanguage._();

  final ValueNotifier<String> notifier = ValueNotifier<String>('en');

  String get value => notifier.value;

  void setLanguage(String language) {
    final normalized = language == 'si' ? 'si' : 'en';
    notifier.value = normalized;
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
