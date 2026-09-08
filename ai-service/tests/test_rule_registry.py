"""
Unit Tests for Rule Loader and Rule Registry
"""

import unittest
from ml.compliance.rule_loader import RuleLoader
from ml.compliance.rule_registry import RuleRegistry


class TestRuleRegistry(unittest.TestCase):

    def setUp(self):
        self.registry = RuleRegistry()

    def test_load_default_rules(self):
        active_rules = self.registry.list_all_active_rules()
        self.assertGreaterEqual(len(active_rules), 9)

    def test_query_rule_by_id(self):
        rule = self.registry.get_rule_by_id("RULE_6_1_A")
        self.assertIsNotNone(rule)
        self.assertEqual(rule.field, "manufacturer_name_address")

    def test_query_rules_by_field(self):
        rules = self.registry.get_rules_for_field("mrp_inclusive_of_taxes")
        self.assertGreaterEqual(len(rules), 1)
        self.assertEqual(rules[0].rule_id, "RULE_6_1_G")


if __name__ == "__main__":
    unittest.main()
