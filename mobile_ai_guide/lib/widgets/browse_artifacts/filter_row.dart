import 'package:flutter/material.dart';
import 'package:mobile_ai_guide/ui/colors.dart';

class FilterRow extends StatelessWidget {
  const FilterRow({
    required this.filters,
    this.selected,
    this.onSelected,
    super.key,
  });

  final List<String> filters;
  final String? selected;
  final ValueChanged<String>? onSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          for (var i = 0; i < filters.length; i++) ...[
            _FilterChip(
              label: filters[i],
              selected: filters[i] == selected,
              onTap: onSelected == null ? null : () => onSelected!(filters[i]),
            ),
            if (i != filters.length - 1) const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, this.selected = false, this.onTap});

  final String label;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? kGold : kCream;
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 13,
            color: selected ? Colors.black : Colors.black87,
          ),
        ),
      ),
    );
  }
}
