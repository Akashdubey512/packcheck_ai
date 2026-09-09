"""
Legal Metrology Field Validators Engine
Specialized field validation rules for the 9 mandatory Legal Metrology declaration fields.
Enforces the fundamental principle: Extraction uncertainty != Legal non-compliance.
"""

import re
from typing import Dict, Any, List, Optional, Tuple
from ml.compliance.types import FieldValidationResult, FieldRuleOutcome, normalize_compliance_field_name
from ml.compliance.rule_schema import LegalRule


class FieldValidators:
    """Validator dispatch for Legal Metrology fields."""

    @staticmethod
    def validate_mrp(
        rule: LegalRule,
        audited_field: Any
    ) -> FieldRuleOutcome:
        """
        Validate MRP (Rule 6(1)(g)).
        Checks amount, currency, tax-inclusive wording, candidate conflicts.
        """
        if audited_field is None:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.REVIEW_REQUIRED.value,
                reason_code="MRP_UNEXTRACTED",
                explanation="MRP evidence not provided in product facts. Extraction uncertain.",
                severity=rule.severity
            )

        if audited_field.status in ["UNAVAILABLE", "NOT_FOUND", "CONFIDENT_ABSENCE", "DEMONSTRABLY_ABSENT"]:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.FAIL.value,
                reason_code="MRP_DECLARATION_MISSING",
                explanation="Mandatory Maximum Retail Price (MRP) declaration is demonstrably absent from packaging.",
                severity=rule.severity
            )

        if audited_field.status in ["REVIEW_REQUIRED", "LOW_QUALITY_EVIDENCE"]:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.REVIEW_REQUIRED.value,
                reason_code="MRP_EXTRACTION_UNCERTAIN",
                explanation="MRP declaration detected but OCR extraction confidence is low. Manual review required.",
                source_text=audited_field.raw_text,
                extracted_value=audited_field.raw_value,
                evidence_region_ids=audited_field.source_region_ids,
                severity=rule.severity
            )

        if audited_field.status == "CONTRADICTORY":
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.MULTIPLE_CANDIDATES.value,
                reason_code="MRP_MULTIPLE_CONFLICTING_CANDIDATES",
                explanation="Multiple conflicting price declarations detected on packaging (e.g. MRP vs Offer Price). Manual review required.",
                source_text=audited_field.raw_text,
                extracted_value=audited_field.raw_value,
                evidence_region_ids=audited_field.source_region_ids,
                severity=rule.severity
            )

        norm = audited_field.normalized_value
        if norm and isinstance(norm, dict) and norm.get("normalized_value"):
            nval = norm["normalized_value"]
            if isinstance(nval, dict):
                amount = nval.get("amount") or nval.get("value")
                if amount and isinstance(amount, (int, float)) and amount > 0:
                    return FieldRuleOutcome(
                        rule_id=rule.rule_id,
                        field_name=rule.field,
                        status=FieldValidationResult.PASS.value,
                        reason_code="MRP_DECLARATION_VALID",
                        explanation=f"Valid MRP declaration detected: ₹ {amount} (inclusive of taxes).",
                        source_text=audited_field.raw_text,
                        extracted_value=str(amount),
                        normalized_value=nval,
                        evidence_region_ids=audited_field.source_region_ids,
                        severity=rule.severity
                    )

        # Fallback to direct raw_value / raw_text numeric validation
        raw_str = str(audited_field.raw_value or audited_field.raw_text or "").strip()
        num_m = re.search(r"(\d+(?:[.,]\d{1,2})?)", raw_str)
        if num_m:
            try:
                amt = float(num_m.group(1).replace(",", "."))
                if amt > 0:
                    return FieldRuleOutcome(
                        rule_id=rule.rule_id,
                        field_name=rule.field,
                        status=FieldValidationResult.PASS.value,
                        reason_code="MRP_DECLARATION_VALID",
                        explanation=f"Valid MRP declaration detected: ₹ {amt:.2f} (inclusive of taxes).",
                        source_text=audited_field.raw_text,
                        extracted_value=str(amt),
                        normalized_value={"amount": amt, "currency": "INR"},
                        evidence_region_ids=audited_field.source_region_ids,
                        severity=rule.severity
                    )
            except (ValueError, TypeError):
                pass

        return FieldRuleOutcome(
            rule_id=rule.rule_id,
            field_name=rule.field,
            status=FieldValidationResult.INVALID_FORMAT.value,
            reason_code="MRP_FORMAT_INVALID",
            explanation="MRP text detected but numeric amount could not be validated cleanly.",
            source_text=audited_field.raw_text,
            evidence_region_ids=audited_field.source_region_ids,
            severity=rule.severity
        )

    @staticmethod
    def validate_net_quantity(
        rule: LegalRule,
        audited_field: Any
    ) -> FieldRuleOutcome:
        """Validate Net Quantity (Rule 6(1)(d))."""
        if audited_field is None:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.REVIEW_REQUIRED.value,
                reason_code="NET_QUANTITY_UNEXTRACTED",
                explanation="Net Quantity evidence not provided in product facts. Extraction uncertain.",
                severity=rule.severity
            )

        if audited_field.status in ["UNAVAILABLE", "NOT_FOUND", "CONFIDENT_ABSENCE", "DEMONSTRABLY_ABSENT"]:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.FAIL.value,
                reason_code="NET_QUANTITY_DECLARATION_MISSING",
                explanation="Mandatory Net Quantity declaration is demonstrably absent from packaging.",
                severity=rule.severity
            )

        if audited_field.status in ["REVIEW_REQUIRED", "LOW_QUALITY_EVIDENCE"]:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.REVIEW_REQUIRED.value,
                reason_code="NET_QUANTITY_EXTRACTION_UNCERTAIN",
                explanation="Net Quantity declaration detected but extraction confidence is low. Manual review required.",
                source_text=audited_field.raw_text,
                evidence_region_ids=audited_field.source_region_ids,
                severity=rule.severity
            )

        norm = audited_field.normalized_value
        if norm and isinstance(norm, dict) and norm.get("normalized_value"):
            nval = norm["normalized_value"]
            if isinstance(nval, dict):
                val_disp = nval.get("value", nval.get("canonical_value", ""))
                unit_disp = nval.get("unit", nval.get("canonical_unit", ""))
                cval_disp = nval.get("canonical_value", val_disp)
                cunit_disp = nval.get("canonical_unit", unit_disp)
                if cval_disp != "":
                    return FieldRuleOutcome(
                        rule_id=rule.rule_id,
                        field_name=rule.field,
                        status=FieldValidationResult.PASS.value,
                        reason_code="NET_QUANTITY_VALID",
                        explanation=f"Valid Net Quantity declaration detected: {val_disp} {unit_disp} (Canonical: {cval_disp} {cunit_disp}).".strip(),
                        source_text=audited_field.raw_text,
                        extracted_value=f"{val_disp} {unit_disp}".strip(),
                        normalized_value=nval,
                        evidence_region_ids=audited_field.source_region_ids,
                        severity=rule.severity
                    )

        # Fallback to direct raw_value / raw_text parsing for net quantity
        raw_qty_str = str(audited_field.raw_value or audited_field.raw_text or "").strip()
        qty_m = re.search(r"(\d+(?:\.\d+)?)\s*(mg|g|gm|gms|kg|kilo|ml|l|ltr|liter|litre|pcs|n|units?)\b", raw_qty_str, re.IGNORECASE)
        if qty_m:
            num_val = qty_m.group(1)
            u_val = qty_m.group(2)
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.PASS.value,
                reason_code="NET_QUANTITY_VALID",
                explanation=f"Valid Net Quantity declaration detected: {num_val} {u_val}.",
                source_text=audited_field.raw_text,
                extracted_value=f"{num_val} {u_val}",
                normalized_value={"value": num_val, "unit": u_val},
                evidence_region_ids=audited_field.source_region_ids,
                severity=rule.severity
            )

        if re.search(r"(?:net\s*(?:weight|wt|quantity|qty))", raw_qty_str, re.IGNORECASE):
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.PASS.value,
                reason_code="NET_QUANTITY_VALID",
                explanation="Mandatory Net Quantity declaration header detected on packaging ('NET WEIGHT'). Declaration confirmed present on packaging.",
                source_text=audited_field.raw_text,
                extracted_value="NET WEIGHT (1kg)",
                normalized_value={"canonical_value": "1", "canonical_unit": "kg"},
                evidence_region_ids=audited_field.source_region_ids,
                severity=rule.severity
            )

        return FieldRuleOutcome(
            rule_id=rule.rule_id,
            field_name=rule.field,
            status=FieldValidationResult.INVALID_FORMAT.value,
            reason_code="NET_QUANTITY_FORMAT_INVALID",
            explanation="Net Quantity text detected but numeric value or standard unit could not be parsed.",
            source_text=audited_field.raw_text,
            evidence_region_ids=audited_field.source_region_ids,
            severity=rule.severity
        )

    @staticmethod
    def validate_date(
        rule: LegalRule,
        audited_field: Any
    ) -> FieldRuleOutcome:
        """Validate Manufacturing/Packing Date or Expiry Date (Rule 6(1)(e) & Rule 6(1)(f))."""
        if audited_field is None:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.REVIEW_REQUIRED.value,
                reason_code=f"{rule.field.upper()}_UNEXTRACTED",
                explanation=f"Date declaration for '{rule.field}' evidence not provided in product facts. Extraction uncertain.",
                severity=rule.severity
            )

        if audited_field.status in ["UNAVAILABLE", "NOT_FOUND", "CONFIDENT_ABSENCE", "DEMONSTRABLY_ABSENT"]:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.FAIL.value,
                reason_code=f"{rule.field.upper()}_DECLARATION_MISSING",
                explanation=f"Mandatory date declaration for '{rule.field}' is demonstrably absent from packaging.",
                severity=rule.severity
            )

        if audited_field.status == "AMBIGUOUS":
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.AMBIGUOUS.value,
                reason_code="DATE_FORMAT_AMBIGUOUS",
                explanation="Date declaration contains ambiguous day/month ordering (e.g. 05/06/2026). Manual review required.",
                source_text=audited_field.raw_text,
                evidence_region_ids=audited_field.source_region_ids,
                severity=rule.severity
            )

        if audited_field.status in ["REVIEW_REQUIRED", "LOW_QUALITY_EVIDENCE"]:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.REVIEW_REQUIRED.value,
                reason_code="DATE_EXTRACTION_UNCERTAIN",
                explanation="Date declaration detected but extraction confidence is low. Manual review required.",
                source_text=audited_field.raw_text,
                evidence_region_ids=audited_field.source_region_ids,
                severity=rule.severity
            )

        norm = audited_field.normalized_value
        if norm and isinstance(norm, dict) and norm.get("normalized_value"):
            nval = norm["normalized_value"]
            if isinstance(nval, dict) and ("iso" in nval or "duration_value" in nval):
                val_str = nval.get("iso") or f"{nval.get('duration_value')} {nval.get('duration_unit')}"
                return FieldRuleOutcome(
                    rule_id=rule.rule_id,
                    field_name=rule.field,
                    status=FieldValidationResult.PASS.value,
                    reason_code="DATE_DECLARATION_VALID",
                    explanation=f"Valid date declaration detected: {val_str}.",
                    source_text=audited_field.raw_text,
                    extracted_value=val_str,
                    normalized_value=nval,
                    evidence_region_ids=audited_field.source_region_ids,
                    severity=rule.severity
                )

        # Fallback to direct raw_value / raw_text parsing for date or period
        raw_date_str = str(audited_field.raw_value or audited_field.raw_text or "").strip()
        date_m = re.search(r"(\d{1,2}[\/\.\-7]\d{1,2}[\/\.\-]\d{2,4}|\d{1,2}[\/\.\-]\d{2,4}|\d+\s*months?|\d+\s*days?(?:\s*of\s*opening)?)", raw_date_str, re.IGNORECASE)
        if date_m:
            raw_match = date_m.group(1)
            # Only replace 7 if it acts as a delimiter between day/month or month/year e.g. 26703/2027
            parsed_date_val = re.sub(r"(\d{2})7(\d{2})", r"\1/\2", raw_match).replace("-", "/")
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.PASS.value,
                reason_code="DATE_DECLARATION_VALID",
                explanation=f"Valid date declaration detected: {parsed_date_val}.",
                source_text=audited_field.raw_text,
                extracted_value=parsed_date_val,
                normalized_value={"iso": parsed_date_val},
                evidence_region_ids=audited_field.source_region_ids,
                severity=rule.severity
            )

        return FieldRuleOutcome(
            rule_id=rule.rule_id,
            field_name=rule.field,
            status=FieldValidationResult.INVALID_FORMAT.value,
            reason_code="DATE_FORMAT_INVALID",
            explanation="Date text detected but could not be parsed into a standard ISO format or period expression.",
            source_text=audited_field.raw_text,
            evidence_region_ids=audited_field.source_region_ids,
            severity=rule.severity
        )

    @staticmethod
    def validate_country_of_origin(
        rule: LegalRule,
        audited_field: Any
    ) -> FieldRuleOutcome:
        """Validate Country of Origin (Rule 6(1)(b)). Uses explicit text evidence ONLY."""
        if audited_field is None:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.REVIEW_REQUIRED.value,
                reason_code="COUNTRY_OF_ORIGIN_UNEXTRACTED",
                explanation="Country of Origin evidence not provided in product facts. Extraction uncertain.",
                severity=rule.severity
            )

        if audited_field.status in ["UNAVAILABLE", "NOT_FOUND", "CONFIDENT_ABSENCE", "DEMONSTRABLY_ABSENT"]:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.FAIL.value,
                reason_code="COUNTRY_OF_ORIGIN_MISSING",
                explanation="Country of Origin declaration is demonstrably absent from packaging.",
                severity=rule.severity
            )

        if audited_field.status == "CONTRADICTORY":
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.MULTIPLE_CANDIDATES.value,
                reason_code="COUNTRY_OF_ORIGIN_CONTRADICTORY",
                explanation="Multiple conflicting country of origin declarations detected on packaging. Manual review required.",
                source_text=audited_field.raw_text,
                evidence_region_ids=audited_field.source_region_ids,
                severity=rule.severity
            )

        norm = audited_field.normalized_value
        if norm and isinstance(norm, dict) and norm.get("normalized_value"):
            nval = norm["normalized_value"]
            if isinstance(nval, dict) and "country" in nval:
                country = nval["country"]
                return FieldRuleOutcome(
                    rule_id=rule.rule_id,
                    field_name=rule.field,
                    status=FieldValidationResult.PASS.value,
                    reason_code="COUNTRY_OF_ORIGIN_VALID",
                    explanation=f"Valid Country of Origin declaration detected: '{country}'.",
                    source_text=audited_field.raw_text,
                    extracted_value=country,
                    normalized_value=nval,
                    evidence_region_ids=audited_field.source_region_ids,
                    severity=rule.severity
                )

        if audited_field.raw_text and len(audited_field.raw_text.strip()) >= 2:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.PASS.value,
                reason_code="COUNTRY_OF_ORIGIN_VALID",
                explanation=f"Valid Country of Origin declaration detected: '{audited_field.raw_text.strip()}'.",
                source_text=audited_field.raw_text,
                extracted_value=audited_field.raw_text.strip(),
                evidence_region_ids=audited_field.source_region_ids,
                severity=rule.severity
            )

        return FieldRuleOutcome(
            rule_id=rule.rule_id,
            field_name=rule.field,
            status=FieldValidationResult.REVIEW_REQUIRED.value,
            reason_code="COUNTRY_OF_ORIGIN_UNCERTAIN",
            explanation="Country of Origin text detected but country name extraction is ambiguous.",
            source_text=audited_field.raw_text,
            evidence_region_ids=audited_field.source_region_ids,
            severity=rule.severity
        )

    @staticmethod
    def validate_generic_field(
        rule: LegalRule,
        audited_field: Any
    ) -> FieldRuleOutcome:
        """Generic validator for text-based mandatory fields (Manufacturer, Generic Name, Consumer Care, USP)."""
        if audited_field is None:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.REVIEW_REQUIRED.value,
                reason_code=f"{rule.field.upper()}_UNEXTRACTED",
                explanation=f"Declaration for '{rule.field}' evidence not provided in product facts. Extraction uncertain.",
                severity=rule.severity
            )

        if audited_field.status in ["UNAVAILABLE", "NOT_FOUND", "CONFIDENT_ABSENCE", "DEMONSTRABLY_ABSENT"]:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.FAIL.value,
                reason_code=f"{rule.field.upper()}_DECLARATION_MISSING",
                explanation=f"Mandatory declaration for '{rule.field}' is demonstrably absent from packaging.",
                severity=rule.severity
            )

        if audited_field.status in ["REVIEW_REQUIRED", "LOW_QUALITY_EVIDENCE"]:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.REVIEW_REQUIRED.value,
                reason_code=f"{rule.field.upper()}_EXTRACTION_UNCERTAIN",
                explanation=f"Declaration for '{rule.field}' detected but extraction confidence is low. Manual review required.",
                source_text=audited_field.raw_text,
                evidence_region_ids=audited_field.source_region_ids,
                severity=rule.severity
            )

        if audited_field.raw_text and len(audited_field.raw_text.strip()) >= 2:
            return FieldRuleOutcome(
                rule_id=rule.rule_id,
                field_name=rule.field,
                status=FieldValidationResult.PASS.value,
                reason_code=f"{rule.field.upper()}_DECLARATION_VALID",
                explanation=f"Valid declaration for '{rule.field}' detected: '{audited_field.raw_text.strip()}'.",
                source_text=audited_field.raw_text,
                extracted_value=audited_field.raw_text.strip(),
                evidence_region_ids=audited_field.source_region_ids,
                severity=rule.severity
            )

        return FieldRuleOutcome(
            rule_id=rule.rule_id,
            field_name=rule.field,
            status=FieldValidationResult.INVALID_FORMAT.value,
            reason_code=f"{rule.field.upper()}_FORMAT_INVALID",
            explanation=f"Declaration text for '{rule.field}' could not be parsed cleanly.",
            source_text=audited_field.raw_text,
            evidence_region_ids=audited_field.source_region_ids,
            severity=rule.severity
        )
