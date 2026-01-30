import 'package:flutter/material.dart';

/// Quick suggestion chips for Butler
class ButlerSuggestions extends StatelessWidget {
  final List<String> suggestions;
  final Function(String) onSuggestionTap;

  const ButlerSuggestions({
    super.key,
    required this.suggestions,
    required this.onSuggestionTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: suggestions.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          return ActionChip(
            label: Text(suggestions[index]),
            labelStyle: const TextStyle(
              color: Colors.white,
              fontSize: 13,
            ),
            backgroundColor: const Color(0xFF2A2A2A),
            side: const BorderSide(color: Color(0xFF7C5DFA)),
            onPressed: () => onSuggestionTap(suggestions[index]),
          );
        },
      ),
    );
  }
}
