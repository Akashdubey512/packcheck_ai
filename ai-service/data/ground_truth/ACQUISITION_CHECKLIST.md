# Ground Truth Dataset Acquisition Checklist

**Project**: Legal Metrology Packaged Commodity Automated Compliance Auditor (SIH 2026 PS ID 26034)  

---

## 1. Physical Product Sampling Checklist
- [ ] Sample at least 100–250 distinct Indian retail products across food, cosmetics, electronics, household commodities, and imported goods.
- [ ] Capture all available physical packaging faces for each product: Front, Back, Side-Left, Side-Right, Top, Bottom.
- [ ] Ensure clear high-resolution images ($>1024 \times 768$ pixels) with minimal glare and blur.

---

## 2. Annotation Workflow & Guidelines
- [ ] Annotate each image according to `data/ground_truth/annotation_schema.json`.
- [ ] Record exact bounding boxes `[x1, y1, x2, y2]` for all 9 mandatory declarations.
- [ ] Distinguish `PRESENT`, `ABSENT`, `UNCLEAR`, `NOT_APPLICABLE`, and `NOT_VISIBLE`.
- [ ] Record ground-truth legal compliance verdicts (`COMPLIANT` vs `NON_COMPLIANT`).

---

## 3. Dataset Validation Command
Run the validation script to count real annotated samples and verify schema compliance:
```bash
python scripts/validate_gt_dataset.py
```
If no annotations exist, the command reports:
`REAL_GROUND_TRUTH_SAMPLES = 0` and `STATUS = GROUND_TRUTH_DATASET_NOT_AVAILABLE`.
