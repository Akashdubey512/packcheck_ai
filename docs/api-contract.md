# API Contract — Single Source of Truth

**Rule:** if you need to change any shape below, edit this file first and post in the group chat, before changing code. Do not let contract drift happen silently.

---

## 1. Frontend → Backend

### POST `/api/auth/register`
**Request**
```json
{ "name": "Officer Name", "email": "officer@example.com", "password": "plaintext-from-form" }
```
**Response** `201`
```json
{ "token": "jwt-token-string", "user": { "id": "...", "name": "...", "email": "...", "role": "officer" } }
```

### POST `/api/auth/login`
**Request**
```json
{ "email": "officer@example.com", "password": "plaintext-from-form" }
```
**Response** `200`
```json
{ "token": "jwt-token-string", "user": { "id": "...", "name": "...", "email": "...", "role": "officer" } }
```
**Error** `401`
```json
{ "error": "Invalid email or password" }
```

---

### POST `/api/scans`
Multipart form-data upload.

**Request (multipart fields)**
| field | type | notes |
|---|---|---|
| `image` | file | required |
| `panelWidthCm` | number | optional, only if attempting font-size stretch goal |
| `panelHeightCm` | number | optional, same as above |

**Response** `201`
```json
{
  "scanId": "665f1a2b3c4d5e6f7a8b9c0d",
  "imageUrl": "/uploads/665f1a2b.jpg",
  "overallStatus": "NON_COMPLIANT",
  "declarations": {
    "manufacturer_name_address": { "found": true, "value": "ABC Foods Pvt Ltd, Nagpur", "confidence": 0.91 },
    "net_quantity": { "found": true, "value": "500 g", "confidence": 0.88 },
    "mrp": { "found": true, "value": "₹120 (incl. of all taxes)", "confidence": 0.95 },
    "mfg_date": { "found": false, "value": null, "confidence": 0.0 },
    "consumer_care": { "found": true, "value": "care@abcfoods.com, 1800-XXX-XXXX", "confidence": 0.80 },
    "country_of_origin": { "found": false, "value": null, "confidence": 0.0 },
    "generic_name": { "found": true, "value": "Refined Sunflower Oil", "confidence": 0.93 },
    "unit_sale_price": { "found": false, "value": null, "confidence": 0.0 }
  },
  "violations": [
    "Month and Year of manufacture/packing not found",
    "Country of origin not declared"
  ],
  "createdAt": "2026-09-06T10:00:00.000Z"
}
```
**Error** `502` (AI service unreachable or failed)
```json
{ "error": "Analysis service unavailable. Please try again." }
```

### GET `/api/scans`
Query params: `?status=NON_COMPLIANT&page=1&limit=20`

**Response** `200`
```json
{
  "total": 42,
  "page": 1,
  "limit": 20,
  "scans": [
    { "scanId": "...", "imageUrl": "...", "overallStatus": "NON_COMPLIANT", "createdAt": "..." }
  ]
}
```

### GET `/api/scans/:id`
**Response** `200` — same shape as the POST `/api/scans` response above.

### GET `/api/scans/:id/report`
**Response** `200` — binary PDF, `Content-Type: application/pdf`

### GET `/api/dashboard/stats`
**Response** `200`
```json
{
  "totalScans": 42,
  "compliantCount": 18,
  "nonCompliantCount": 24,
  "compliantPercent": 42.9,
  "recentScans": [ { "scanId": "...", "overallStatus": "...", "createdAt": "..." } ]
}
```

---

## 2. Backend → AI Service

### POST `{AI_SERVICE_URL}/analyze`

**Request**
```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "panel_width_cm": 8.5,
  "panel_height_cm": 12.0
}
```
`panel_width_cm` / `panel_height_cm` are optional — omit if not doing the font-size stretch goal.

**Response** `200`
```json
{
  "extracted_text": "raw OCR dump for debugging",
  "declarations": {
    "manufacturer_name_address": { "found": true, "value": "ABC Foods Pvt Ltd, Nagpur", "confidence": 0.91 },
    "net_quantity": { "found": true, "value": "500 g", "confidence": 0.88 },
    "mrp": { "found": true, "value": "₹120 (incl. of all taxes)", "confidence": 0.95 },
    "mfg_date": { "found": false, "value": null, "confidence": 0.0 },
    "consumer_care": { "found": true, "value": "care@abcfoods.com, 1800-XXX-XXXX", "confidence": 0.80 },
    "country_of_origin": { "found": false, "value": null, "confidence": 0.0 },
    "generic_name": { "found": true, "value": "Refined Sunflower Oil", "confidence": 0.93 },
    "unit_sale_price": { "found": false, "value": null, "confidence": 0.0 }
  },
  "overall_status": "NON_COMPLIANT",
  "violations": [
    "Month and Year of manufacture/packing not found",
    "Country of origin not declared"
  ]
}
```

**Error** `422` — image unreadable / OCR produced nothing usable
```json
{ "error": "Could not extract readable text from image" }
```

**Notes for both sides:**
- Node sends the image as base64 in the JSON body (simpler than multipart between services) — Node has already received it as multipart from the frontend and just re-encodes it.
- The `declarations` object key set is FIXED at these 8 keys. Don't add/remove/rename keys without updating this file and telling Node's side.
- `confidence` is always a float 0.0–1.0. `value` is `null` when `found` is `false`.
- Node does zero re-validation of `declarations` — whatever the AI service says is final. Node's job is only to persist and serve this JSON.
