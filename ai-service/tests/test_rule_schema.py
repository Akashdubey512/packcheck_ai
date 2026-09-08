"""
Unit Tests for LegalRule Schema
"""

import unittest
from ml.compliance.rule_schema import LegalRule


class TestRuleSchema(unittest.TestCase):

    def test_rule_schema_fields(self):
        rule = LegalRule(
            rule_id="RULE_6_1_A",
            field="manufacturer_name_address",
            source="Legal Metrology Rules 2011",
            source_title="The Legal Metrology Rules",
            rule_version="2011.0",
            effective_date="2011-03-01",
            requirement="Name and address of manufacturer"
        )
        d = rule.to_dict()
        self.assertEqual(d["rule_id"], "RULE_6_1_A")
        self.assertEqual(d["effective_date"], "2011-03-01")
        self.assertFalse(d["is_deprecated"])


if __name__ == "__main__":
    unittest.main()
