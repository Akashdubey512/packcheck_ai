"""
Audit Traceability & Cryptographic Provenance Engine
Computes SHA-256 input provenance hashes and tracks component version manifests.
"""

import hashlib
from pathlib import Path
from typing import Union, Optional
import numpy as np
from PIL import Image

from ml.confidence.types import InputProvenance


class ProvenanceTracker:
    """Computes cryptographic SHA-256 hashes and tracks version metadata for input samples."""

    def __init__(self, confidence_version: str = "1.0.0"):
        self.confidence_version = confidence_version

    def generate_provenance(
        self,
        image_input: Optional[Union[str, Path, np.ndarray, Image.Image]],
        dataset_version: str = "1.0.0",
        preprocessing_version: str = "1.0.0",
        ocr_engine: str = "rapidocr",
        ocr_version: str = "1.2.3",
        extraction_version: str = "1.0.0"
    ) -> InputProvenance:
        """
        Generate InputProvenance containing cryptographic SHA-256 hash of input image.
        """
        sha256_hash = self.compute_image_sha256(image_input)

        return InputProvenance(
            input_sha256=sha256_hash,
            dataset_version=dataset_version,
            preprocessing_version=preprocessing_version,
            ocr_engine=ocr_engine,
            ocr_version=ocr_version,
            extraction_version=extraction_version,
            confidence_version=self.confidence_version
        )

    @staticmethod
    def compute_image_sha256(
        image_input: Optional[Union[str, Path, np.ndarray, Image.Image]]
    ) -> str:
        """Compute SHA-256 hex digest of file path, raw bytes, or image array."""
        if image_input is None:
            return "UNAVAILABLE"

        if isinstance(image_input, (str, Path)):
            p = Path(image_input)
            if p.exists():
                with open(p, "rb") as f:
                    return hashlib.sha256(f.read()).hexdigest()
            else:
                return hashlib.sha256(str(p).encode("utf-8")).hexdigest()

        if isinstance(image_input, Image.Image):
            return hashlib.sha256(image_input.tobytes()).hexdigest()

        if isinstance(image_input, np.ndarray):
            return hashlib.sha256(image_input.tobytes()).hexdigest()

        return "UNKNOWN_HASH"
