"""
Text Region Merging Module
Combines nearby horizontal text region bounding boxes on the same line into line blocks.
Preserves original individual text regions.
"""

from typing import List, Tuple
from .types import TextRegion, BoundingBox

def is_same_line(reg1: TextRegion, reg2: TextRegion, vertical_threshold_ratio: float = 0.5) -> bool:
    """Check if two bounding boxes belong to the same horizontal text line."""
    h1 = reg1.bbox.height
    h2 = reg2.bbox.height
    avg_h = max(1.0, (h1 + h2) / 2.0)

    # Vertical overlap / center distance check
    center_y1 = reg1.bbox.center[1]
    center_y2 = reg2.bbox.center[1]
    
    return abs(center_y1 - center_y2) < (avg_h * vertical_threshold_ratio)

def merge_line_group(line_regions: List[TextRegion]) -> TextRegion:
    """Merge a sorted group of TextRegions on the same line into a single line TextRegion."""
    if len(line_regions) == 1:
        return line_regions[0]

    min_x1 = min(r.bbox.x1 for r in line_regions)
    min_y1 = min(r.bbox.y1 for r in line_regions)
    max_x2 = max(r.bbox.x2 for r in line_regions)
    max_y2 = max(r.bbox.y2 for r in line_regions)

    merged_bbox = BoundingBox(x1=min_x1, y1=min_y1, x2=max_x2, y2=max_y2)
    
    raw_texts = [r.text for r in line_regions if r.text]
    norm_texts = [r.normalized_text or r.text for r in line_regions if r.text]
    
    confidences = [r.confidence for r in line_regions if r.confidence is not None]
    avg_confidence = float(sum(confidences) / len(confidences)) if confidences else None

    return TextRegion(
        region_id=line_regions[0].region_id,
        bbox=merged_bbox,
        text=" ".join(raw_texts),
        normalized_text=" ".join(norm_texts),
        confidence=avg_confidence,
        polygon=None,
        language=line_regions[0].language,
        rotation=line_regions[0].rotation
    )

def merge_nearby_regions(
    regions: List[TextRegion],
    max_horizontal_gap_px: int = 25,
    vertical_threshold_ratio: float = 0.5
) -> List[TextRegion]:
    """
    Merge horizontally adjacent word boxes into lines while preserving reading order.
    """
    if not regions:
        return []

    # Sort regions top-to-bottom, then left-to-right
    sorted_regions = sorted(regions, key=lambda r: (r.bbox.y1, r.bbox.x1))

    merged_output: List[TextRegion] = []
    current_line: List[TextRegion] = []

    for reg in sorted_regions:
        if not current_line:
            current_line.append(reg)
        else:
            prev = current_line[-1]
            # Check if same line and close horizontally
            if is_same_line(prev, reg, vertical_threshold_ratio):
                horizontal_gap = reg.bbox.x1 - prev.bbox.x2
                if horizontal_gap <= max_horizontal_gap_px:
                    current_line.append(reg)
                    continue

            # Line ended, merge current line group
            merged_output.append(merge_line_group(current_line))
            current_line = [reg]

    if current_line:
        merged_output.append(merge_line_group(current_line))

    # Re-index region IDs
    for idx, reg in enumerate(merged_output):
        reg.region_id = idx

    return merged_output
