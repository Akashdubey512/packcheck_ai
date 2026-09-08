# Operational Limitations & Legal Safety Boundaries

**Project**: Software System to Check Compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 (SIH 2026 PS ID 26034)  

---

## 1. Legal Safety Boundaries
- **Decision-Support Tool**: This software system functions strictly as an automated decision-support and regulatory inspection tool.
- **No Authority to Impose Fines**: The system does **not** claim to issue legally binding penalties or government-certified sanctions without human legal metrology officer review.
- **Uncertainty Policy**: Extraction ambiguity, OCR unreadability, or incomplete package face views translate to `REVIEW_REQUIRED` or `INSUFFICIENT_EVIDENCE`.

---

## 2. Technical Limitations
1. **Physical Font Height Measurement**: Numeral height verification (e.g. 1.5mm vs 2.5mm font height) requires physical DPI scaling calibration. Marked as `UNSUPPORTED_AUTOMATION` without hardware camera calibration.
2. **Physical Weight Scale**: Verification of actual net contents vs declared net quantity requires a physical weighing balance (`UNSUPPORTED_AUTOMATION`).
