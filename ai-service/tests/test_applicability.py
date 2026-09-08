"""
Unit Tests for Rule Applicability Engine
"""

import unittest
from ml.compliance.rule_schema import LegalRule
from ml.compliance.applicability import ApplicabilityEngine
from ml.compliance.types import ApplicabilityState


class TestApplicability(unittest.TestCase):

    def setUp(self):
        self.engine = ApplicabilityEngine()

    def test_always_applicable_fields(self):
        rule = LegalRule(rule_id="R1", field="mrp_inclusive_of_taxes", source="LM Rules", source_title="Title", rule_version="2011.0")
        state = self.engine.determine_applicability(rule)
        self.assertEqual(state, ApplicabilityState.APPLICABLE)

    def test_conditional_country_of_origin(self):
        rule = LegalRule(rule_id="R2", field="country_of_origin", source="LM Rules", source_title="Title", rule_version="2017.1")
        state_imp = self.engine.determine_applicability(rule, package_context={"is_imported": True})
        self.assertEqual(state_imp, ApplicabilityState.APPLICABLE)

        state_dom = self.engine.determine_applicability(rule, package_context={"is_imported": False})
        self.assertEqual(state_dom, ApplicabilityState.NOT_APPLICABLE)


if __name__ == "__main__":
    unittest.main()
