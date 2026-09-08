# Security & Privacy Policy Architecture

**Project**: Software System to Check Compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 (SIH 2026 PS ID 26034)  
**Version**: `1.0.0`  

---

## 1. File Upload & Input Safeguards

1. **Max File Size Limit**: Restricted to **20 MB** per image file to prevent resource exhaustion attacks.
2. **Decompression Bomb Guard**: Enforces `Image.MAX_IMAGE_PIXELS = 50,000,000` (50 Megapixels max). Payloads exceeding this pixel limit trigger an immediate `SecurityValidationError`.
3. **Path Traversal Sanitization**: All filenames stripped of dangerous sequences (`../`, `\\..`, control characters). Sanitized via `sanitize_filename()`.
4. **Header Structure Verification**: Images must pass `PIL.Image.verify()` and format validation.
5. **Non-Executable Processing**: Uploaded files are stored in restricted temporary data directories without execution permissions.

---

## 2. Privacy & Data Retention Policy

1. **Personal Information Handling**: Phone numbers and customer care email addresses extracted from product packaging are stored exclusively within local inspection session JSON payloads for regulatory reporting.
2. **Raw OCR Log Privacy**: Sensitive OCR text logs are sanitized; raw user images are not logged in plain text system error logs.
3. **Retention & Deletion**: Temporary evidence crop files and upload buffers are stored under configurable retention windows (default: 30 days for audit trail purposes).
