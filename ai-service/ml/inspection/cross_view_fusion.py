"""
Cross-View Candidate Fusion & Contradiction Detection Engine
Aggregates field extractions across package faces and flags contradictions.
"""

from typing import List, Dict, Any, Tuple
from .types import CrossViewFact, ContradictionItem, CoverageStatus

def fuse_cross_view_candidates(
    view_results: List[Dict[str, Any]]
) -> Tuple[Dict[str, CrossViewFact], List[ContradictionItem], str]:
    """
    Fuse extractions from multiple package views into unified facts and detect contradictions.
    """
    field_sources: Dict[str, List[Dict[str, Any]]] = {}
    contradictions: List[ContradictionItem] = []

    for v_res in view_results:
        view_type = v_res.get("view_type", "UNKNOWN")
        fields = v_res.get("extracted_fields", {})
        
        for field_name, f_data in fields.items():
            if not isinstance(f_data, dict):
                continue
            status = f_data.get("status")
            raw_val = f_data.get("raw_value") or f_data.get("raw_text")
            norm_val = f_data.get("normalized_value")
            if raw_val and str(raw_val).strip() and status != "NOT_FOUND":
                if field_name not in field_sources:
                    field_sources[field_name] = []
                field_sources[field_name].append({
                    "view_type": view_type,
                    "raw_value": raw_val,
                    "normalized_value": norm_val,
                    "confidence": f_data.get("extraction_confidence", 0.8)
                })

    unified_facts: Dict[str, CrossViewFact] = {}

    for field_name, sources in field_sources.items():
        if len(sources) == 1:
            unified_facts[field_name] = CrossViewFact(
                field_name=field_name,
                consensus_value=sources[0]["raw_value"],
                candidate_sources=sources,
                is_contradictory=False,
                confidence=sources[0]["confidence"]
            )
        else:
            # Check for value agreement/contradiction across views
            vals = set(s["raw_value"].strip().lower() for s in sources)
            if len(vals) > 1:
                # Contradiction detected!
                c_item = ContradictionItem(
                    field_name=field_name,
                    view_a=sources[0]["view_type"],
                    value_a=sources[0]["raw_value"],
                    view_b=sources[1]["view_type"],
                    value_b=sources[1]["raw_value"],
                    description=f"Contradictory values detected for '{field_name}' across views: '{sources[0]['raw_value']}' vs '{sources[1]['raw_value']}'"
                )
                contradictions.append(c_item)
                unified_facts[field_name] = CrossViewFact(
                    field_name=field_name,
                    consensus_value=sources[0]["raw_value"],
                    candidate_sources=sources,
                    is_contradictory=True,
                    confidence=0.3
                )
            else:
                unified_facts[field_name] = CrossViewFact(
                    field_name=field_name,
                    consensus_value=sources[0]["raw_value"],
                    candidate_sources=sources,
                    is_contradictory=False,
                    confidence=max(s["confidence"] for s in sources)
                )

    inspected_view_types = set(v.get("view_type", "UNKNOWN") for v in view_results)
    views_received = len(view_results)
    views_expected = 2  # Standard expected Front + Back packaging views
    views_with_text = sum(1 for v in view_results if v.get("quality_status") != "UNUSABLE")
    views_with_decls = sum(1 for v in view_results if v.get("extracted_fields"))

    if "FRONT" in inspected_view_types and "BACK" in inspected_view_types:
        coverage_status = CoverageStatus.FULL_COVERAGE.value
        coverage_score = 1.0
    elif views_received >= 1 and views_with_decls >= 1:
        coverage_status = CoverageStatus.PARTIAL_COVERAGE.value
        coverage_score = 0.6
    elif views_received >= 1:
        coverage_status = CoverageStatus.INSUFFICIENT_COVERAGE.value
        coverage_score = 0.3
    else:
        coverage_status = CoverageStatus.UNKNOWN_COVERAGE.value
        coverage_score = 0.0

    coverage_info = {
        "views_received": views_received,
        "views_expected": views_expected,
        "views_with_text": views_with_text,
        "views_with_relevant_declarations": views_with_decls,
        "coverage_score": coverage_score,
        "coverage_status": coverage_status
    }

    return unified_facts, contradictions, coverage_info
