import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';

class HtmlStyles {
  static Map<String, Style> getDefault(BuildContext context) {
    return {
      "body": Style(
        fontSize: FontSize(14),
        color: Colors.grey.shade800,
        lineHeight: const LineHeight(1.4),
        margin: Margins.zero,
        padding: HtmlPaddings.zero,
      ),
      "p": Style(margin: Margins.only(bottom: 4)),
      "ul": Style(margin: Margins.only(left: 8, bottom: 8)),
      "ol": Style(margin: Margins.only(left: 8, bottom: 8)),
      "li": Style(margin: Margins.only(bottom: 4)),
      "h1, h2, h3, h4, h5, h6": Style(
        fontWeight: FontWeight.bold,
        margin: Margins.only(top: 8, bottom: 4),
      ),
      "a": Style(color: Colors.blue, textDecoration: TextDecoration.underline),
      "br": Style(margin: Margins.zero),
    };
  }
}
