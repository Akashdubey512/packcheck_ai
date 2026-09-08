"""
Legal Rule Applicability Engine
Determines whether a legal declaration requirement applies to a given packaged commodity.
"""

from typing import Dict, Any, Optional
from ml.compliance.types import ApplicabilityState, normalize_compliance_field_name
from ml.compliance.rule_schema import LegalRule


class ApplicabilityEngine:
    """Evaluates rule applicability for packaged commodities."""

    def determine_applicability(
        self,
        rule: LegalRule,
        audited_field: Optional[Any] = None,
        package_context: Optional[Dict[str, Any]] = None
    ) -> ApplicabilityState:
        """
        Determine applicability state (APPLICABLE, NOT_APPLICABLE, UNKNOWN).
        
        CRITICAL RULE:
        Unknown applicability leads to REVIEW_REQUIRED downstream.
        Do NOT assume applicability without empirical evidence or explicit rule defaults.
        """
        field_name = normalize_compliance_field_name(rule.field)

        # Standard mandatory declarations applicable to all packaged commodities
        always_applicable_fields = [
            "manufacturer_name_address",
            "net_quantity",
            "manufacture_or_packing_date",
            "mrp_inclusive_of_taxes",
            "consumer_care_contact",
            "generic_name"
        ]

        if field_name in always_applicable_fields:
            return ApplicabilityState.APPLICABLE

        # Conditional declarations
        if field_name == "country_of_origin":
            # Mandatory for imported products; applicable if origin indicated or imported
            if package_context:
                is_imported = package_context.get("is_imported")
                if is_imported is False:
                    return ApplicabilityState.NOT_APPLICABLE
                elif is_imported is True:
                    return ApplicabilityState.APPLICABLE
            # If text indicates origin or imported, applicable
            if audited_field and audited_field.raw_text:
                return ApplicabilityState.APPLICABLE
            return ApplicabilityState.APPLICABLE  # Default under Rule 6(1)(b) for packaged commodities

        if field_name == "expiry_or_use_by_date":
            # Mandatory for perishable commodities, food, pharma, cosmetics
            if package_context:
                category = package_context.get("category", "").lower()
                supported_perishable_categories = {"food", "beverage", "pharma", "cosmetics", "perishable"}
                supported_non_perishable_categories = {"electronics", "household_goods", "garments_textiles", "hardware"}
                
                if category in supported_perishable_categories:
                    return ApplicabilityState.APPLICABLE
                elif category in supported_non_perishable_categories:
                    return ApplicabilityState.NOT_APPLICABLE
                elif category not in ("other", ""):
                    # Unknown category -> return UNKNOWN to trigger REVIEW_REQUIRED
                    return ApplicabilityState.UNKNOWN
            return ApplicabilityState.APPLICABLE  # Standard default declaration under Legal Metrology

        if field_name == "unit_sale_price":
            # Mandatory w.e.f. 2022 amendment for multi-unit or non-standard packages
            return ApplicabilityState.APPLICABLE

        return ApplicabilityState.UNKNOWN
