import 'package:flutter/material.dart';

class StoryFeed extends StatefulWidget {
  const StoryFeed({super.key, required this.repository});

  final StoryRepository repository;

  @override
  State<StoryFeed> createState() => _StoryFeedState();
}

class _StoryFeedState extends State<StoryFeed> {
  final _scroll = ScrollController();
  final _stories = <Story>[];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_maybeLoadMore);
    _loadMore();
  }

  Future<void> _loadMore() async {
    if (_loading) return;
    setState(() => _loading = true);
    final page = await widget.repository.next(limit: 20);
    setState(() {
      _stories.addAll(page);
      _loading = false;
    });
  }

  void _maybeLoadMore() {
    final left = _scroll.position.extentAfter;
    if (left < 600) _loadMore();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      controller: _scroll,
      itemCount: _stories.length + (_loading ? 1 : 0),
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, i) => i < _stories.length
          ? StoryCard(story: _stories[i])
          : const Center(child: CircularProgressIndicator()),
    );
  }
}
