"""
Reading Order Reconstruction Module
Sorts detected text regions into deterministic top-to-bottom, left-to-right reading order.
"""

from typing import List
from .types import TextRegion

def sort_reading_order(
    regions: List[TextRegion],
    line_tolerance_px: int = 12
) -> List[TextRegion]:
    """
    Sort text regions into deterministic reading order.
    
    Groups boxes into horizontal lines using y1 tolerance band, then sorts each line left-to-right (x1).
    """
    if not regions or len(regions) <= 1:
        return regions or []

    # Copy list to avoid mutating input reference
    sorted_input = sorted(regions, key=lambda r: r.bbox.y1)

    lines: List[List[TextRegion]] = []
    
    for reg in sorted_input:
        placed = False
        for line in lines:
            # Check vertical overlap with existing line
            avg_y = sum(r.bbox.y1 for r in line) / len(line)
            if abs(reg.bbox.y1 - avg_y) <= line_tolerance_px:
                line.append(reg)
                placed = True
                break
        if not placed:
            lines.append([reg])

    # Sort each line left-to-right (x1)
    final_ordered_regions: List[TextRegion] = []
    for line in lines:
        sorted_line = sorted(line, key=lambda r: r.bbox.x1)
        final_ordered_regions.extend(sorted_line)

    # Re-assign sequential region IDs
    for idx, reg in enumerate(final_ordered_regions):
        reg.region_id = idx

    return final_ordered_regions
