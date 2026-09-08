"""
Evidence Linking & Visual Crop Generation Engine
Extracts visual sub-image crops corresponding to OCR region bounding boxes, computes SHA-256 crop hashes,
and generates structured EvidenceManifest objects.
"""

import io
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import numpy as np
from PIL import Image

from ml.extraction.types import ExtractedField, ProductFacts
from ml.confidence.types import EvidenceCrop, EvidenceManifest


class EvidenceLinker:
    """Links extracted fields to source OCR regions and generates cropped visual evidence."""

    def __init__(self, crop_output_dir: str = "processed_data/evidence_crops"):
        self.crop_output_dir = Path(crop_output_dir)

    def generate_evidence_manifest(
        self,
        product_facts: ProductFacts,
        image_input: Optional[Union[str, Path, np.ndarray, Image.Image]] = None,
        ocr_region_map: Optional[Dict[str, Any]] = None
    ) -> EvidenceManifest:
        """
        Generate EvidenceManifest and save visual evidence crops for all extracted fields.
        """
        product_id = product_facts.product_id
        manifest_id = f"manifest_{product_id}"

        # Prepare output directory for crops
        save_dir = self.crop_output_dir / product_id
        save_dir.mkdir(parents=True, exist_ok=True)

        # Load PIL Image if provided
        pil_image = self._load_image(image_input)

        crops: List[EvidenceCrop] = []
        source_text_map: Dict[str, str] = {}
        source_bbox_map: Dict[str, List[int]] = {}

        for field_name, field_obj in product_facts.fields.items():
            if not field_obj or not field_obj.source_bbox or field_obj.status == "NOT_FOUND":
                continue

            bbox = field_obj.source_bbox
            region_id = field_obj.source_region_ids[0] if field_obj.source_region_ids else "0"
            crop_id = f"crop_{product_id}_{field_name}_{region_id}"

            source_text_map[field_name] = field_obj.source_text or field_obj.raw_text
            source_bbox_map[field_name] = bbox

            # Extract crop if image is available
            crop_path_str = ""
            crop_hash = ""
            width, height = 0, 0

            if pil_image:
                try:
                    w, h = pil_image.size
                    x1 = max(0, min(bbox[0], w - 1))
                    y1 = max(0, min(bbox[1], h - 1))
                    x2 = max(x1 + 1, min(bbox[2], w))
                    y2 = max(y1 + 1, min(bbox[3], h))

                    crop_img = pil_image.crop((x1, y1, x2, y2))
                    width, height = crop_img.size

                    buf = io.BytesIO()
                    crop_img.save(buf, format="PNG")
                    crop_bytes = buf.getvalue()
                    crop_hash = hashlib.sha256(crop_bytes).hexdigest()

                    crop_file = save_dir / f"{crop_id}.png"
                    with open(crop_file, "wb") as f:
                        f.write(crop_bytes)

                    crop_path_str = str(crop_file).replace("\\", "/")

                except Exception as e:
                    crop_path_str = f"UNAVAILABLE ({str(e)})"
                    crop_hash = "UNAVAILABLE"

            evidence_crop = EvidenceCrop(
                crop_id=crop_id,
                field_name=field_name,
                region_id=str(region_id),
                bbox=bbox,
                image_path=crop_path_str,
                crop_sha256=crop_hash,
                width=width,
                height=height
            )
            crops.append(evidence_crop)

        return EvidenceManifest(
            manifest_id=manifest_id,
            product_id=product_id,
            crops=crops,
            source_text_map=source_text_map,
            source_bbox_map=source_bbox_map
        )

    @staticmethod
    def _load_image(
        image_input: Optional[Union[str, Path, np.ndarray, Image.Image]]
    ) -> Optional[Image.Image]:
        """Convert image input into PIL.Image object."""
        if image_input is None:
            return None

        if isinstance(image_input, Image.Image):
            return image_input.convert("RGB")

        if isinstance(image_input, (str, Path)):
            p = Path(image_input)
            if p.exists():
                return Image.open(p).convert("RGB")
            return None

        if isinstance(image_input, np.ndarray):
            return Image.fromarray(image_input).convert("RGB")

        return None
