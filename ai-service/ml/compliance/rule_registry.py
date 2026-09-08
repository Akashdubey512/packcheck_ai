"""
Legal Metrology Rule Registry
Versioned registry for managing, indexing, and querying legal compliance rules.
"""

from typing import Dict, Any, List, Optional
from ml.compliance.rule_schema import LegalRule
from ml.compliance.rule_loader import RuleLoader
from ml.compliance.types import normalize_compliance_field_name
from ml.compliance.exceptions import RuleRegistryError


class RuleRegistry:
    """Thread-safe versioned rule registry."""

    def __init__(self, registry_version: str = "2022.1"):
        self.registry_version = registry_version
        self._rules: Dict[str, LegalRule] = {}
        self._field_map: Dict[str, List[LegalRule]] = {}
        self.load_default_rules()

    def load_default_rules(self, json_path: str = "raw_data/legal_metrology/legal_metrology_rules.json"):
        """Load default rules from JSON using RuleLoader."""
        loader = RuleLoader(json_path=json_path)
        rules = loader.load_rules()
        for r in rules:
            self.register_rule(r)

    def register_rule(self, rule: LegalRule):
        """Register a new or updated LegalRule object."""
        self._rules[rule.rule_id] = rule

        canon_field = normalize_compliance_field_name(rule.field)
        if canon_field not in self._field_map:
            self._field_map[canon_field] = []
        
        # Replace if rule_id already present, else append
        existing_idx = next((i for i, r in enumerate(self._field_map[canon_field]) if r.rule_id == rule.rule_id), None)
        if existing_idx is not None:
            self._field_map[canon_field][existing_idx] = rule
        else:
            self._field_map[canon_field].append(rule)

    def get_rule_by_id(self, rule_id: str) -> Optional[LegalRule]:
        """Retrieve rule by rule_id."""
        return self._rules.get(rule_id.upper())

    def get_rules_for_field(self, field_name: str) -> List[LegalRule]:
        """Retrieve active rules applicable to a specific field."""
        canon = normalize_compliance_field_name(field_name)
        rules = self._field_map.get(canon, [])
        return [r for r in rules if not r.is_deprecated]

    def list_all_active_rules(self) -> List[LegalRule]:
        """List all non-deprecated active rules."""
        return [r for r in self._rules.values() if not r.is_deprecated]
