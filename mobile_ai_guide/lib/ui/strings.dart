class AppStrings {
  AppStrings._();

  static String introGreeting(String language, String title) {
    if (language == 'si') {
      return 'හෙලෝ! මම මේ $title සඳහා ඔබේ AI මාර්ගෝපදේශකයා වෙමි. එහි ඉතිහාසය, ශිල්පීය හැකියාවන් හෝ සංස්කෘතික වැදගත්කම ගැන ඕනෑම දෙයක් මගෙන් විමසීමට නිදහස් වන්න!';
    }
    return "Hello! I'm your AI guide for this $title. Feel free to ask me anything about its history, craftsmanship, or cultural significance!";
  }
}
