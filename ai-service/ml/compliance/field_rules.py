"""
Field Rule Evaluator Engine
Evaluates individual LegalRule definitions against Phase 5 AuditedField objects.
"""

from typing import Dict, Any, List, Optional
from ml.compliance.types import FieldRuleOutcome, FieldValidationResult, normalize_compliance_field_name
from ml.compliance.rule_schema import LegalRule
from ml.compliance.validators import FieldValidators


class FieldRuleEvaluator:
    """Evaluates legal rules against individual audited fields."""

    def __init__(self):
        self.validators = FieldValidators()

    def evaluate_rule(
        self,
        rule: LegalRule,
        audited_field: Optional[Any]
    ) -> FieldRuleOutcome:
        """
        Evaluate a single LegalRule against the corresponding audited field.
        """
        canon_field = normalize_compliance_field_name(rule.field)

        if canon_field == "mrp_inclusive_of_taxes":
            return self.validators.validate_mrp(rule, audited_field)

        elif canon_field == "net_quantity":
            return self.validators.validate_net_quantity(rule, audited_field)

        elif canon_field in ["manufacture_or_packing_date", "expiry_or_use_by_date"]:
            return self.validators.validate_date(rule, audited_field)

        elif canon_field == "country_of_origin":
            return self.validators.validate_country_of_origin(rule, audited_field)

        else:
            return self.validators.validate_generic_field(rule, audited_field)
