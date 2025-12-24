import 'package:flutter/material.dart';

class AppContentLanguage {
  AppContentLanguage._();

  static final AppContentLanguage instance = AppContentLanguage._();

  final ValueNotifier<String> notifier = ValueNotifier<String>('en');

  String get value => notifier.value;

  void setLanguage(String language) {
    final normalized = language == 'si' ? 'si' : 'en';
    notifier.value = normalized;
  }

  static String labelFor(String language) {
    return language == 'si' ? 'Sinhala' : 'English';
  }
}
