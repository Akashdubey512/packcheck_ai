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


class RuleLoader:
    """Loads and parses legal rules from JSON rule files."""

    def __init__(self, json_path: str = "raw_data/legal_metrology/legal_metrology_rules.json"):
        self.json_path = Path(json_path)

    def load_rules(self) -> List[LegalRule]:
        """Load and parse structured rules from JSON file."""
        if not self.json_path.exists():
            raise FileNotFoundError(f"Legal Metrology rules file missing: {self.json_path}")

        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

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
