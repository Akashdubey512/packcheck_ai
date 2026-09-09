"""
Field Candidate Classifier & Ranker
Scores, ranks, and classifies candidate extractions for Legal Metrology fields without silently discarding competing evidence.
"""

import re
from typing import List, Dict, Any, Tuple
from ml.extraction.types import FieldCandidate, FieldStatus


class FieldClassifier:
    """Modular rule-based candidate classifier & ranker for Legal Metrology fields."""

    def __init__(self):
        # Weighting scheme for candidate scoring
        self.weights = {
            "spatial_keyword_pair": 0.40,
            "regex_match": 0.35,
            "keyword_match": 0.15,
            "numerical_pattern": 0.10
        }

    def classify_candidates(
        self, field_name: str, candidates: List[FieldCandidate]
    ) -> Tuple[FieldCandidate, float, str, List[FieldCandidate]]:
        """
        Classify and rank a list of candidates for a specific field.
        
        Returns:
            - primary_candidate: Best ranked FieldCandidate (or empty placeholder if none)
            - confidence: Calculated extraction confidence score (0.0 to 1.0)
            - status: Explicit FieldStatus string
            - ranked_candidates: List of all candidates sorted by score descending
        """
        if not candidates:
            empty_cand = FieldCandidate(
                candidate_id=f"empty_{field_name}",
                field_name=field_name,
                raw_text="",
                raw_value="",
                source_region_ids=[]
            )
            return empty_cand, 0.0, FieldStatus.NOT_FOUND.value, []

        # 1. Score each candidate based on evidence types and value characteristics
        scored_candidates = []
        for cand in candidates:
            score = self.score_candidate(field_name, cand)
            cand.score = score
            scored_candidates.append(cand)

        # 2. Sort by score descending
        ranked_candidates = sorted(scored_candidates, key=lambda c: c.score, reverse=True)
        primary_candidate = ranked_candidates[0]
        top_score = primary_candidate.score

        # 3. Determine status & detect multiple distinct candidates
        # Competing candidates must have distinct numeric/content values or different regions
        distinct_cand_values = set()
        for c in ranked_candidates:
            if c.score >= 0.5:
                # Clean numeric or stripped representation
                val_clean = re.sub(r'[^\d.]', '', c.raw_value)
                if val_clean:
                    distinct_cand_values.add(val_clean)
                else:
                    distinct_cand_values.add(c.raw_value.lower().strip())

        if len(distinct_cand_values) > 1 and len(ranked_candidates) >= 2 and ranked_candidates[1].score >= 0.80 and abs(top_score - ranked_candidates[1].score) < 0.10:
            status = FieldStatus.MULTIPLE_CANDIDATES.value
        elif top_score >= 0.65:
            status = FieldStatus.EXTRACTED.value
        elif top_score >= 0.35:
            status = FieldStatus.LOW_CONFIDENCE.value
        else:
            status = FieldStatus.REVIEW_REQUIRED.value

        return primary_candidate, round(top_score, 4), status, ranked_candidates

    def score_candidate(self, field_name: str, candidate: FieldCandidate) -> float:
        """Calculate composite candidate score based on evidence types and domain rules."""
        base_score = candidate.score

        # Additional evidence boosts
        text = candidate.raw_text.lower()
        val = candidate.raw_value.lower()

        boost = 0.0

        # Field-specific domain scoring heuristics
        if field_name == "mrp":
            if any(sym in text for sym in ["₹", "rs", "inr"]):
                boost += 0.10
            if "mrp" in text or "maximum retail price" in text:
                boost += 0.15
            if "offer price" in text or "discount" in text:
                boost -= 0.10  # Penalize offer prices mistaken as MRP

        elif field_name == "net_quantity":
            if any(u in val for u in ["g", "kg", "mg", "ml", "l", "ltr", "pcs"]):
                boost += 0.15
            if "net" in text:
                boost += 0.10

        elif field_name in ["manufacturing_packing_date", "best_before_expiry"]:
            if re.search(r'\d{1,2}[\/\.\-]\d{2,4}', val):
                boost += 0.15

        elif field_name == "country_of_origin":
            if "india" in val or "made in" in text:
                boost += 0.15

        elif field_name == "consumer_care_details":
            if "1800" in val or "@" in val or "care" in text:
                boost += 0.15

        elif field_name == "unit_sale_price":
            if "/" in val or "per" in text:
                boost += 0.15

        final_score = min(1.0, max(0.0, base_score + boost))
        return final_score
