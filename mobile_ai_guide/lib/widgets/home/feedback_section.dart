import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart' as app;
import 'package:mobile_ai_guide/services/session_service.dart';
import 'package:mobile_ai_guide/services/session_access_service.dart';
import 'package:mobile_ai_guide/models/user_session.dart';

class FeedbackSection extends StatefulWidget {
  const FeedbackSection({super.key});

  @override
  State<FeedbackSection> createState() => _FeedbackSectionState();
}

class FeedbackItem {
  String text;
  bool isSaved;
  FeedbackItem(this.text, {this.isSaved = false});
}

class _FeedbackSectionState extends State<FeedbackSection> {
  int _rating = 0;
  final TextEditingController _controller = TextEditingController();
  final FocusNode _inputFocusNode = FocusNode();
  final List<FeedbackItem> _items = [];
  bool _loading = false;
  String? _sessionId;

  @override
  void initState() {
    super.initState();
    _loadSession();
  }

  Future<void> _loadSession() async {
    try {
      final session = await SessionAccessService.requireActiveSession();
      setState(() {
        _sessionId = session.sessionId;
        _items.clear();
        _items.addAll(
          session.feedbacks.map((f) => FeedbackItem(f, isSaved: true)),
        );
        _rating = session.starRating?.round() ?? 0;
      });
    } catch (e) {
      // ignore: use_build_context_synchronously
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Unable to load session: $e')));
    }
  }

  void _setRating(int val) => setState(() => _rating = val);

  Future<void> _saveRatingImmediately(int val) async {
    if (_sessionId == null) return;
    setState(() => _loading = true);
    try {
      final session = await SessionService.updateStarRating(
        sessionId: _sessionId!,
        starRating: val.toDouble(),
      );
      setState(() {
        _rating = session.starRating?.round() ?? val;
      });
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to save rating: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _persist() async {
    if (_sessionId == null) return;
    setState(() => _loading = true);
    try {
      final payload = _items.map((i) => i.text).toList();
      final session = await SessionService.updateFeedbacks(
        sessionId: _sessionId!,
        feedbacks: payload,
        starRating: _rating.toDouble(),
      );

      // Mark items as saved based on returned session
      setState(() {
        _items.clear();
        _items.addAll(
          session.feedbacks.map((f) => FeedbackItem(f, isSaved: true)),
        );
        _rating = session.starRating?.round() ?? _rating;
      });

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Feedback saved')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to save feedback: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addFeedback() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _items.add(FeedbackItem(text, isSaved: false));
      _controller.clear();
    });
  }

  Future<void> _editFeedback(int index) async {
    final current = _items[index].text;
    final controller = TextEditingController(text: current);
    final result = await showDialog<String?>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit feedback'),
        content: TextField(
          controller: controller,
          minLines: 1,
          maxLines: 4,
          decoration: const InputDecoration(hintText: 'Update your note'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(null),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (result == null) return;
    if (result.isEmpty) return;
    setState(() {
      _items[index].text = result;
      _items[index].isSaved = false;
    });
  }

  Future<void> _removeFeedback(int index) async {
    setState(() => _items.removeAt(index));
  }

  Future<void> _submit() async {
    // If user has typed text but didn't press the + button, include it.
    final pendingText = _controller.text.trim();
    if (pendingText.isNotEmpty) {
      setState(() {
        _items.add(FeedbackItem(pendingText, isSaved: false));
        _controller.clear();
      });
    }

    if (_rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide a star rating')),
      );
      return;
    }

    await _persist();
  }

  @override
  void dispose() {
    _controller.dispose();
    _inputFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: app.kCardShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Feedback',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  Text(
                    'We value your thoughts',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                'Rate your experience',
                style: TextStyle(
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: List.generate(5, (i) {
                  final idx = i + 1;
                  return GestureDetector(
                    onTap: () {
                      _setRating(idx);
                      _saveRatingImmediately(idx);
                    },
                    child: Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: Icon(
                        Icons.star,
                        size: 28,
                        color: idx <= _rating
                            ? app.kGold
                            : Colors.grey.shade300,
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 12),
              Text(
                'Add notes (you can add multiple)',
                style: TextStyle(
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      focusNode: _inputFocusNode,
                      autofocus: false,
                      controller: _controller,
                      decoration: InputDecoration(
                        hintText: 'Share a quick thought…',
                        filled: true,
                        fillColor: app.kSearchField,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 12,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      minLines: 1,
                      maxLines: 3,
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _addFeedback,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: app.kGold,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Icon(Icons.add),
                  ),
                ],
              ),
              if (_items.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: List.generate(_items.length, (i) {
                    final item = _items[i];
                    return InputChip(
                      backgroundColor: item.isSaved
                          ? app.kWarmPanel
                          : app.kInfoBadge,
                      avatar: item.isSaved
                          ? null
                          : const CircleAvatar(
                              radius: 6,
                              backgroundColor: Colors.transparent,
                              child: Icon(
                                Icons.circle,
                                size: 8,
                                color: Color(0xFFFF9500),
                              ),
                            ),
                      label: Text(item.text),
                      onPressed: () => _editFeedback(i),
                      onDeleted: () => _removeFeedback(i),
                    );
                  }),
                ),
              ],
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        // Confirm before clearing all feedbacks
                        final proceed = await showDialog<bool?>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Text('Remove all feedbacks?'),
                            content: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'This will remove all feedback notes for your session. This action cannot be undone.',
                                  style: TextStyle(color: Colors.grey.shade700),
                                ),
                                const SizedBox(height: 12),
                                if (_items.isNotEmpty)
                                  Text(
                                    'You have ${_items.length} feedback${_items.length == 1 ? '' : 's'} currently.',
                                  ),
                              ],
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.of(ctx).pop(false),
                                child: const Text('Cancel'),
                              ),
                              TextButton(
                                onPressed: () => Navigator.of(ctx).pop(true),
                                child: const Text(
                                  'Remove All',
                                  style: TextStyle(color: Colors.red),
                                ),
                              ),
                            ],
                          ),
                        );

                        if (proceed != true) return;

                        if (_sessionId == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('No active session')),
                          );
                          return;
                        }

                        setState(() => _loading = true);
                        try {
                          // First clear feedbacks on server
                          await SessionService.clearFeedbacks(
                            sessionId: _sessionId!,
                          );
                          // Then remove star rating as well by updating to 0
                          final updated = await SessionService.updateStarRating(
                            sessionId: _sessionId!,
                            starRating: 0,
                          );
                          setState(() {
                            _items.clear();
                            _items.addAll(
                              updated.feedbacks.map(
                                (f) => FeedbackItem(f, isSaved: true),
                              ),
                            );
                            _rating = updated.starRating?.round() ?? 0;
                          });
                        } catch (e) {
                          if (mounted)
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Failed to remove feedbacks: $e'),
                              ),
                            );
                        } finally {
                          if (mounted) setState(() => _loading = false);
                        }
                      },
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: app.kGoldBorder),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Clear'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: app.kGold,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Submit Feedback',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (_loading)
          Positioned.fill(
            child: Container(
              color: Colors.black26,
              child: const Center(child: CircularProgressIndicator()),
            ),
          ),
      ],
    );
  }
}
