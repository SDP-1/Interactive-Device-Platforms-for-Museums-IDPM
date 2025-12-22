import 'package:flutter/material.dart';

class AppFontScale {
  AppFontScale._();

  static final AppFontScale instance = AppFontScale._();

  final ValueNotifier<double> notifier = ValueNotifier<double>(1.0);

  double get value => notifier.value;

  void setScale(double scale) {
    notifier.value = scale.clamp(0.85, 1.3);
  }
}
