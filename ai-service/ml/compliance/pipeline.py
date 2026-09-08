"""
Phase 6 Legal Metrology Compliance Pipeline Engine
End-to-end legal compliance decision pipeline evaluating AuditedProductFacts against versioned Legal Metrology rules.
"""

import time
from typing import Dict, Any, Union, Optional, List
from ml.confidence.types import AuditedProductFacts
from ml.compliance.types import (
    ComplianceResult, FieldRuleOutcome, ApplicabilityState,
    normalize_compliance_field_name
)
from ml.compliance.rule_registry import RuleRegistry
from ml.compliance.applicability import ApplicabilityEngine
from ml.compliance.field_rules import FieldRuleEvaluator
from ml.compliance.consistency import ConsistencyChecker
from ml.compliance.decision import ComplianceDecisionEngine
from ml.compliance.explanations import ComplianceExplainer
from ml.compliance.provenance import ComplianceProvenanceTracker


class CompliancePipeline:
    """End-to-end Legal Metrology Compliance Decision Pipeline."""

    def __init__(self, rule_registry_version: str = "2022.1"):
        self.registry = RuleRegistry(registry_version=rule_registry_version)
        self.applicability_engine = ApplicabilityEngine()
        self.field_evaluator = FieldRuleEvaluator()
        self.consistency_checker = ConsistencyChecker()
        self.decision_engine = ComplianceDecisionEngine()
        self.explainer = ComplianceExplainer()
        self.provenance_tracker = ComplianceProvenanceTracker(rule_registry_version=rule_registry_version)
        self.version = "1.0.0"

    def process(
        self,
        audited_facts: AuditedProductFacts,
        package_context: Optional[Dict[str, Any]] = None
    ) -> ComplianceResult:
        """
        Process Phase 5 AuditedProductFacts into Phase 6 ComplianceResult.
        
        CRITICAL ARCHITECTURAL RULE:
        Phase 6 is the FIRST phase allowed to output legal compliance verdicts.
        Enforces strict legal safety: Extraction Uncertainty != Legal Non-Compliance.
        """
        start_time = time.perf_counter()
        product_id = audited_facts.product_id

        field_outcomes: List[FieldRuleOutcome] = []
        rule_ids_used: List[str] = []

        active_rules = self.registry.list_all_active_rules()

        # 1. Evaluate applicable rules for each canonical field
        for rule in active_rules:
            canon_field = normalize_compliance_field_name(rule.field)

            # Map audited field from Phase 5 (checking direct match or any recognized alias)
            audited_field = audited_facts.fields.get(canon_field)
            if not audited_field:
                for k, v in audited_facts.fields.items():
                    if normalize_compliance_field_name(k) == canon_field:
                        audited_field = v
                        break

            # Determine Rule Applicability
            applicability = self.applicability_engine.determine_applicability(
                rule, audited_field=audited_field, package_context=package_context
            )

            if applicability == ApplicabilityState.NOT_APPLICABLE:
                outcome = FieldRuleOutcome(
                    rule_id=rule.rule_id,
                    field_name=rule.field,
                    status="NOT_APPLICABLE",
                    reason_code="RULE_NOT_APPLICABLE",
                    explanation=f"Rule {rule.rule_id} is not applicable to this package context.",
                    severity=rule.severity
                )
                field_outcomes.append(outcome)
                rule_ids_used.append(rule.rule_id)
                continue

            elif applicability == ApplicabilityState.UNKNOWN:
                outcome = FieldRuleOutcome(
                    rule_id=rule.rule_id,
                    field_name=rule.field,
                    status="REVIEW_REQUIRED",
                    reason_code="RULE_APPLICABILITY_UNKNOWN",
                    explanation=f"Rule {rule.rule_id} applicability is unknown. Manual review required.",
                    severity=rule.severity
                )
                field_outcomes.append(outcome)
                rule_ids_used.append(rule.rule_id)
                continue

            # Evaluate rule validator
            outcome = self.field_evaluator.evaluate_rule(rule, audited_field)
            field_outcomes.append(outcome)
            rule_ids_used.append(rule.rule_id)

        # 2. Check Contradictions
        review_items = self.consistency_checker.check_contradictions(audited_facts.fields)

        # 3. Synthesize Decision
        result = self.decision_engine.make_decision(
            product_id=product_id,
            field_outcomes=field_outcomes,
            review_items=review_items,
            evidence_manifest=audited_facts.evidence_manifest,
            provenance=self.provenance_tracker.build_provenance(audited_facts, rule_ids_used),
            rule_version=self.registry.registry_version
        )

        # 4. Generate Evidence-Backed Explanations
        result.explanations = self.explainer.generate_explanations(
            field_outcomes, rule_version=self.registry.registry_version
        )

        result.execution_time_ms = (time.perf_counter() - start_time) * 1000.0
        return result

    # Alias for method name consistency
    evaluate = process
