# PackCheck AI — Security Model & Hardening Specification

**Version:** 2.2.0-Production | **Date:** September 9, 2026

---

## 1. Security Architecture Summary

PackCheck AI implements defense-in-depth security across all architectural layers.

```text
[ Client ] ──(1. OWASP Headers & Rate Limit)──> [ Gateway ] ──(2. JWT & RBAC)──> [ Input Guard ]
                                                                                      │
[ PDF Generator ] <──(4. SSRF & XSS Defenses)── [ File Security (3. Magic Bytes) ] <──┘
```

---

## 2. Layered Controls & Implementation Summary

### Layer 1: HTTP Security & Rate Limiting
- **Security Headers (`securityHeaders.js`)**:
  - `Content-Security-Policy`: Strict frame and script restrictions.
  - `X-Content-Type-Options: nosniff`: Eliminates MIME-type sniffing.
  - `X-Frame-Options: DENY`: Clickjacking prevention.
  - `Strict-Transport-Security`: HSTS enabled in production (`max-age=31536000`).
- **Rate Limiting (`rateLimiter.js`)**: Sliding-window rate limiter restricting general API requests (120 req/min), heavy inspection/report endpoints (20 req/min), and login (10 req/min).

### Layer 2: Authentication & Access Control
- **JWT Signature Verification (`auth.js`)**: Enforces `HS256` signature verification and checks expiration.
- **Fail-Fast Production Startup Guard (`envValidation.js`)**: Refuses to start in production if `JWT_SECRET` is unconfigured or set to a default development string.
- **Role-Based Access Control (`requireRole`)**: Restricts officer override endpoints to authorized roles (`officer`, `admin`).

### Layer 3: File Upload & Input Validation
- **Binary Magic Bytes Inspection (`fileSecurity.js`)**: Validates raw file signature headers on disk:
  - JPEG: `FF D8 FF`
  - PNG: `89 50 4E 47`
  - WebP: `52 49 46 46`
  - Rejects text/malicious executable files disguised as `.jpg` images with `400 INVALID_FILE_TYPE` and deletes temporary files immediately.
- **Path Traversal Defense**: Strips `../`, `..\`, null bytes (`\0`), and control characters from filenames.
- **NoSQL Injection Guard (`inputValidator.js`)**: Blocks parameters containing `$`, `.`, `__proto__`, or prototype pollution payloads.

### Layer 4: Report Generation Security (XSS & SSRF)
- **HTML Entity Sanitizer (`pdfGenerator.js`)**: Escapes all dynamic field strings, inspection IDs, timestamps, and violation text via `escapeHtml()`.
- **Puppeteer Sandbox Hardening**:
  - Disables JavaScript execution inside headless renderer (`setJavaScriptEnabled(false)`).
  - Request interception blocks external outbound HTTP/HTTPS calls (SSRF defense).

---

## 3. Secrets Scanning & Supply Chain Assurance
- **Secrets Scanner (`scripts/security_audit.js`)**: Verified zero hardcoded credentials across 293 source files.
- **Frontend Bundle Security**: Zero private API keys, JWT secrets, or DB credentials exposed in `VITE_*` variables.
