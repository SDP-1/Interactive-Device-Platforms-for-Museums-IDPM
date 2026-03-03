// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';

import 'package:artifact_reconstruction_app/main.dart';

void main() {
  testWidgets('Role selection screen shows Admin and Visitor',
      (WidgetTester tester) async {
    await tester.pumpWidget(const ArtifactReconstructionApp());

    expect(find.text('Select role'), findsOneWidget);
    expect(find.text('Admin'), findsOneWidget);
    expect(find.text('Visitor'), findsOneWidget);

    await tester.tap(find.text('Admin'));
    await tester.pumpAndSettle();
    expect(find.text('Admin'), findsWidgets);
    expect(
      find.text(
        'Start by capturing or uploading an image of the broken artifact.',
      ),
      findsOneWidget,
    );
  });
}
