# Machine Learning Interface Contract: Preprocessing → OCR → Extraction → Audited Facts

**Project**: Legal Metrology (Packaged Commodities) Automated Compliance Auditor  
**Version**: `1.3.0` (Phase 5 Extended)  
**Scope**: Unified Pipeline Interface Specification (Preprocessing, Text Detection/OCR, Mandatory Field Extraction & Confidence/Audit Traceability)  

---

## 1. Preprocessing Payload Schema

```json
{
  "image_id": "string (Unique image sample identifier)",
  
  "validation": {
    "valid": "boolean (True if image passed structural validation)",
    "width": "integer (Pixel width)",
    "height": "integer (Pixel height)",
    "channels": "integer (1 for grayscale, 3 for RGB, 4 for RGBA)",
    "color_mode": "string (RGB, L, RGBA, etc.)",
    "aspect_ratio": "float (width / height)",
    "pixel_count": "integer (width * height)",
    "format": "string (JPEG, PNG, BMP, WEBP, TIFF)",
    "warnings": ["array of warning strings"],
    "errors": [
      {
        "code": "IMAGE_NOT_FOUND | IMAGE_UNREADABLE | INVALID_IMAGE_FORMAT | IMAGE_TOO_SMALL | IMAGE_TOO_LARGE | UNSUPPORTED_CHANNELS",
        "message": "string"
      }
    ]
  },

  "quality": {
    "status": "string (GOOD | ACCEPTABLE | POOR | UNREADABLE)",
    "metrics": {
      "blur_score_laplacian": "float (Variance of Laplacian)",
      "brightness": "float (Mean luminance 0-255)",
      "contrast": "float (RMS contrast / intensity std dev)",
      "sharpness": "float (Sobel gradient magnitude mean)",
      "noise_estimate": "float (Median residual std dev)",
      "entropy": "float (Shannon entropy)",
      "underexposed_ratio": "float (Proportion of pixels < 5)",
      "overexposed_ratio": "float (Proportion of pixels > 250)"
    },
    "thresholds": {
      "blur_threshold": "float",
      "brightness_min": "float",
      "brightness_max": "float",
      "contrast_threshold": "float",
      "threshold_type": "Heuristic OCR baseline thresholds"
    },
    "warnings": ["array of heuristic warning strings"]
  },

  "orientation": {
    "angle": "integer (0, 90, 180, 270)",
    "method": "string (EXIF | VISUAL | NONE)",
    "confidence": "float or null (Explicit null when uncomputed; NEVER fake confidence)",
    "applied": "boolean (True if rotation was applied)"
  },

  "deskew": {
    "applied": "boolean (True if deskew rotation was applied)",
    "reason": "string (SKEW_CORRECTED | SKEW_NOT_RELIABLY_DETECTED | SKEW_BELOW_THRESHOLD | SKEW_EXCEEDS_MAX_THRESHOLD)",
    "estimated_angle": "float or null"
  },

  "perspective": {
    "applied": "boolean (True if 4-point homography transform was applied)",
    "reason": "string (PERSPECTIVE_RECTIFIED | NO_RELIABLE_BOUNDARY | RECTIFICATION_FAILED)"
  },

  "variants": {
    "ocr_primary": "PIL.Image or numpy.ndarray (Standard contrast-normalized grayscale image)",
    "ocr_secondary": "PIL.Image or numpy.ndarray (High-contrast binarized/sharpened image for noisy backgrounds)"
  },

  "variant_metadata": [
    {
      "name": "ocr_primary",
      "operations": ["rgb_to_gray", "resize", "clahe"]
    },
    {
      "name": "ocr_secondary",
      "operations": ["rgb_to_gray", "resize", "clahe", "sharpen"]
    }
  ],

  "execution_time_ms": "float (Total preprocessing latency in milliseconds)"
}
```

---

## 2. Phase 3 OCR Payload Schema

```json
{
  "image_id": "string (Unique sample identifier)",
  "ocr_version": "1.0.0",
  "engine": "string (rapidocr | easyocr | pytesseract)",
  "engine_version": "string (Installed backend library version)",
  "preprocessing_version": "1.0.0",
  "dataset_version": "1.0.0",

  "image": {
    "width": "integer (Original image pixel width)",
    "height": "integer (Original image pixel height)"
  },

  "status": "string (SUCCESS | PARTIAL | FAILED | NO_TEXT | REVIEW_REQUIRED)",

  "regions": [
    {
      "region_id": "integer (0-indexed region sequence)",
      "bbox": ["integer x1", "integer y1", "integer x2", "integer y2"],
      "polygon": [
        ["integer x1", "integer y1"],
        ["integer x2", "integer y2"],
        ["integer x3", "integer y3"],
        ["integer x4", "integer y4"]
      ],
      "text": "string (Raw recognized text)",
      "normalized_text": "string (Unicode & whitespace normalized text)",
      "confidence": "float or null (Confidence score between 0.0 and 1.0; null if unavailable)",
      "language": "string or null (e.g. 'en', 'hi', or null if unclassified)",
      "rotation": "integer (0, 90, 180, 270)",
      "detector_confidence": "float or null",
      "recognizer_confidence": "float or null"
    }
  ],

  "full_raw_text": "string (Concatenated raw OCR text in deterministic reading order)",
  "full_normalized_text": "string (Concatenated normalized text in deterministic reading order)",

  "errors": [
    {
      "code": "string (e.g. ENGINE_INIT_FAILED, DETECTION_FAILED, RECOGNITION_TIMEOUT)",
      "message": "string"
    }
  ],

  "execution_time_ms": "float (Total OCR inference time in milliseconds)"
}
```

---

## 3. Phase 4 Mandatory Field Extraction Payload Schema (ProductFacts)

```json
{
  "product_id": "string (Unique sample / image identifier)",
  "status": "string (SUCCESS | PARTIAL | FAILED)",

  "fields": {
    "manufacturer_name_and_address": {
      "field_name": "manufacturer_name_and_address",
      "raw_text": "string (Full raw matching string)",
      "raw_value": "string (Extracted manufacturer string)",
      "normalized_value": {
        "raw_text": "string",
        "normalized_value": {"text": "string"},
        "normalization_status": "SUCCESS | PARTIAL | FAILED | AMBIGUOUS | UNTOUCHED",
        "extra_info": {}
      },
      "source_region_ids": ["array of region_id strings"],
      "source_text": "string",
      "source_bbox": ["integer x1", "integer y1", "integer x2", "integer y2"],
      "extraction_confidence": "float or null",
      "status": "EXTRACTED | NOT_FOUND | AMBIGUOUS | INVALID_FORMAT | MULTIPLE_CANDIDATES | LOW_CONFIDENCE | NOT_APPLICABLE | REVIEW_REQUIRED",
      "candidates": ["array of FieldCandidate objects"]
    },

    "country_of_origin": {
      "field_name": "country_of_origin",
      "normalized_value": {
        "raw_text": "Made in India",
        "normalized_value": {"country": "India"},
        "normalization_status": "SUCCESS"
      }
    },

    "common_generic_name": {
      "field_name": "common_generic_name"
    },

    "net_quantity": {
      "field_name": "net_quantity",
      "normalized_value": {
        "raw_text": "500 g",
        "normalized_value": {
          "value": 500.0,
          "unit": "g",
          "canonical_value": 500.0,
          "canonical_unit": "g"
        },
        "normalization_status": "SUCCESS"
      }
    },

    "manufacturing_packing_date": {
      "field_name": "manufacturing_packing_date",
      "normalized_value": {
        "raw_text": "08/2026",
        "normalized_value": {"iso": "2026-08"},
        "normalization_status": "SUCCESS"
      }
    },

    "best_before_expiry": {
      "field_name": "best_before_expiry",
      "normalized_value": {
        "raw_text": "Use By 08/2027",
        "normalized_value": {"iso": "2027-08"},
        "normalization_status": "SUCCESS"
      }
    },

    "mrp": {
      "field_name": "mrp",
      "normalized_value": {
        "raw_text": "MRP ₹249.00",
        "normalized_value": {"amount": 249.00, "currency": "INR"},
        "normalization_status": "SUCCESS"
      }
    },

    "consumer_care_details": {
      "field_name": "consumer_care_details",
      "normalized_value": {
        "raw_text": "Customer Care: 1800-123-4567 email: care@brand.com",
        "normalized_value": {
          "phone": "1800-123-4567",
          "toll_free": ["1800-123-4567"],
          "email": "care@brand.com",
          "url": null,
          "raw_contact": "Customer Care: 1800-123-4567 email: care@brand.com"
        },
        "normalization_status": "SUCCESS"
      }
    },

    "unit_sale_price": {
      "field_name": "unit_sale_price",
      "normalized_value": {
        "raw_text": "₹ 10 / 100 g",
        "normalized_value": {
          "amount": 10.00,
          "currency": "INR",
          "unit_basis_quantity": 100.0,
          "unit_basis_unit": "g"
        },
        "normalization_status": "SUCCESS"
      }
    }
  },

  "source": {
    "ocr_engine": "rapidocr",
    "ocr_version": "1.2.3",
    "preprocessing_version": "1.0.0",
    "extraction_version": "1.0.0"
  },
  "execution_time_ms": "float",
  "errors": []
}
```

---

## 4. Phase 5 Confidence, Evidence & Audit Payload Schema (AuditedProductFacts)

```json
{
  "product_id": "string (Unique sample identifier)",
  "status": "string (SUCCESS | PARTIAL | FAILED)",

  "fields": {
    "mrp": {
      "field_name": "mrp",
      "raw_text": "MRP ₹249.00",
      "raw_value": "₹249.00",
      "normalized_value": {
        "raw_text": "MRP ₹249.00",
        "normalized_value": {"amount": 249.0, "currency": "INR"},
        "normalization_status": "SUCCESS"
      },
      "status": "CONFIDENT | UNCERTAIN | AMBIGUOUS | CONTRADICTORY | LOW_QUALITY_EVIDENCE | REVIEW_REQUIRED | UNAVAILABLE",
      "confidence": {
        "ocr_confidence": "float or null",
        "candidate_score": "float",
        "normalization_score": "float",
        "image_quality_score": "float",
        "consistency_score": "float",
        "raw_composite_score": "float",
        "calibrated_probability": "float or null (null when ground truth calibration data is unavailable)",
        "calibration_status": "CALIBRATION_UNAVAILABLE | UNCALIBRATED | CALIBRATED_PLATT | CALIBRATED_ISOTONIC"
      },
      "evidence_crop_ids": ["crop_sample01_mrp_0"],
      "source_region_ids": ["0"],
      "source_bbox": [10, 50, 120, 80],
      "explanation": {
        "field_name": "mrp",
        "status": "CONFIDENT",
        "summary": "Field 'mrp' extracted with high confidence (0.88).",
        "reasons": [
          "Source OCR average region confidence: 0.95",
          "Primary candidate extraction score: 0.85",
          "Value normalization status: SUCCESS"
        ],
        "candidate_comparison": null
      }
    }
  },

  "evidence_manifest": {
    "manifest_id": "manifest_sample01",
    "product_id": "sample01",
    "crops": [
      {
        "crop_id": "crop_sample01_mrp_0",
        "field_name": "mrp",
        "region_id": "0",
        "bbox": [10, 50, 120, 80],
        "image_path": "processed_data/evidence_crops/sample01/crop_sample01_mrp_0.png",
        "crop_sha256": "6a8b1... (SHA-256 hash of crop image file)",
        "width": 110,
        "height": 30
      }
    ],
    "source_text_map": {"mrp": "MRP ₹249.00"},
    "source_bbox_map": {"mrp": [10, 50, 120, 80]}
  },

  "provenance": {
    "input_sha256": "8f3c... (Cryptographic SHA-256 hash of original input image)",
    "dataset_version": "1.0.0",
    "preprocessing_version": "1.0.0",
    "ocr_engine": "rapidocr",
    "ocr_version": "1.2.3",
    "extraction_version": "1.0.0",
    "confidence_version": "1.0.0"
  },

  "execution_time_ms": "float",
  "errors": []
}
```

---

## 5. Guarantees & Constraints

1. **Evidence Preservation**: Both `raw_text` and `normalized_text` are preserved. Text is never aggressively autocorrected.
2. **Explicit Confidence & Calibration**: Unavailable calibration returns `calibrated_probability: null` and `calibration_status: CALIBRATION_UNAVAILABLE`. Confidence fabrication or fake calibration curves are strictly prohibited.
3. **Cryptographic Traceability**: Input provenance records the exact SHA-256 hash of the original input file. Every evidence crop image is hashed with SHA-256.
4. **No Legal Compliance Decisions**: Phase 5 measures confidence, links visual evidence crops, and tracks provenance. Legal compliance evaluation (e.g. font height rules, tax inclusion compliance) is strictly deferred to Phase 6.
