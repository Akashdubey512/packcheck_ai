"""
Compliance Provenance Tracker Engine
Captures cryptographic SHA-256 sample hashes and pipeline component version manifests.
"""

import time
from typing import Dict, Any, List, Optional
from ml.compliance.types import ComplianceProvenance


class ComplianceProvenanceTracker:
    """Tracks end-to-end provenance and component versions for legal compliance decisions."""

    def __init__(self, compliance_engine_version: str = "1.0.0", rule_registry_version: str = "2022.1"):
        self.compliance_engine_version = compliance_engine_version
        self.rule_registry_version = rule_registry_version

    def build_provenance(
        self,
        audited_product_facts: Any,
        rule_ids_used: List[str]
    ) -> ComplianceProvenance:
        """
        Build ComplianceProvenance object from AuditedProductFacts provenance metadata.
        """
        prov_meta = audited_product_facts.provenance if audited_product_facts else None

        input_sha = getattr(prov_meta, "input_sha256", "UNAVAILABLE")
        ds_ver = getattr(prov_meta, "dataset_version", "1.0.0")
        preproc_ver = getattr(prov_meta, "preprocessing_version", "1.0.0")
        ocr_engine = getattr(prov_meta, "ocr_engine", "rapidocr")
        ocr_ver = getattr(prov_meta, "ocr_version", "1.2.3")
        extract_ver = getattr(prov_meta, "extraction_version", "1.0.0")
        conf_ver = getattr(prov_meta, "confidence_version", "1.0.0")

        return ComplianceProvenance(
            input_sha256=input_sha,
            dataset_version=ds_ver,
            preprocessing_version=preproc_ver,
            ocr_engine=ocr_engine,
            ocr_version=ocr_ver,
            extraction_version=extract_ver,
            confidence_version=conf_ver,
            compliance_engine_version=self.compliance_engine_version,
            rule_registry_version=self.rule_registry_version,
            evaluated_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            rule_ids_used=rule_ids_used
        )
