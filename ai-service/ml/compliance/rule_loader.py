"""
Legal Metrology Rule Loader
Parses raw_data/legal_metrology/legal_metrology_rules.json and instantiates versioned LegalRule objects.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from ml.compliance.rule_schema import LegalRule
from ml.compliance.types import normalize_compliance_field_name
from ml.compliance.exceptions import ComplianceEngineError


DEFAULT_STATUTORY_RULES_PAYLOAD = {
    "title": "The Legal Metrology (Packaged Commodities) Rules, 2011",
    "authority": "Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India",
    "enactment_year": 2011,
    "mandatory_declarations": {
        "rule_6_1_a": {"field_name": "manufacturer_name_and_address", "description": "Name and address of the manufacturer, or packer, or importer", "required": True},
        "rule_6_1_b": {"field_name": "country_of_origin", "description": "Country of origin for imported products", "required": True},
        "rule_6_1_c": {"field_name": "common_generic_name", "description": "Common or generic name of the commodity contained in the package", "required": True},
        "rule_6_1_d": {"field_name": "net_quantity", "description": "Net quantity in terms of standard unit of weight, measure or number", "required": True},
        "rule_6_1_e": {"field_name": "manufacturing_packing_date", "description": "Month and year in which the commodity is manufactured or packed or imported", "required": True},
        "rule_6_1_f": {"field_name": "best_before_expiry", "description": "Best before or use by date, month and year for perishable items", "required": True},
        "rule_6_1_g": {"field_name": "mrp", "description": "Maximum Retail Price (MRP) inclusive of all taxes, formatted as MRP Rs. xx.xx or Maximum Retail Price Rs. xx.xx incl. of all taxes", "required": True},
        "rule_6_1_h": {"field_name": "consumer_care_details", "description": "Name, address, telephone number, email address of the person/office to contact in case of consumer complaints", "required": True},
        "rule_6_11": {"field_name": "unit_sale_price", "description": "Unit sale price rounded off to the nearest rupee or paise (mandatory w.e.f. 2022 amendment)", "required": True}
    }
}


class RuleLoader:
    """Loads and parses legal rules from JSON rule files."""

    def __init__(self, json_path: Optional[str] = None):
        base = Path(__file__).resolve().parent.parent.parent
        candidates = [
            Path(json_path) if json_path else None,
            Path("configs/legal_metrology_rules.json"),
            Path("raw_data/legal_metrology/legal_metrology_rules.json"),
            base / "configs" / "legal_metrology_rules.json",
            base / "raw_data" / "legal_metrology" / "legal_metrology_rules.json",
        ]
        self.json_path = next((p for p in candidates if p and p.exists()), Path("configs/legal_metrology_rules.json"))

    def load_rules(self) -> List[LegalRule]:
        """Load and parse structured rules from JSON file with embedded fallback."""
        data = None
        if self.json_path and self.json_path.exists():
            try:
                with open(self.json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                data = None

        if not data:
            data = DEFAULT_STATUTORY_RULES_PAYLOAD

        rules: List[LegalRule] = []
        source_title = data.get("title", "The Legal Metrology (Packaged Commodities) Rules, 2011")
        authority = data.get("authority", "Department of Consumer Affairs, Government of India")

        declarations = data.get("mandatory_declarations", {})
        for rule_key, rdict in declarations.items():
            rule_id = rule_key.upper()
            raw_field = rdict.get("field_name", "")
            canonical_field = normalize_compliance_field_name(raw_field)
            description = rdict.get("description", "")

            # Set version & effective date based on amendment rules
            if rule_key == "rule_6_11":
                rule_ver = "2022.1"
                effective = "2022-01-01"
            elif rule_key in ["rule_6_1_b"]:
                rule_ver = "2017.1"
                effective = "2017-06-23"
            else:
                rule_ver = "2011.0"
                effective = "2011-03-01"

            rule = LegalRule(
                rule_id=rule_id,
                field=canonical_field,
                source="Legal Metrology (Packaged Commodities) Rules",
                source_title=source_title,
                rule_version=rule_ver,
                effective_date=effective,
                requirement=description,
                applicability="ALL_PACKAGED_COMMODITIES",
                validation_type="MANDATORY_DECLARATION",
                severity="CRITICAL" if rule_key in ["rule_6_1_a", "rule_6_1_d", "rule_6_1_g"] else "HIGH",
                explanation=f"Rule {rule_key}: {description}",
                evidence_requirement="MANDATORY_EVIDENCE"
            )
            rules.append(rule)

        return rules
