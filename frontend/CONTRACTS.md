# API Contracts & Frontend Service Architecture

> **Document Status**: Established (Phase 1)  
> **Version**: 1.0.0  
> **Audience**: Frontend Team, Backend Team, ML/OCR Team, Regulatory Rule-Engine Team

This document establishes the binding interface contracts between the independent Frontend application and the backend microservices.

---

## 1. Architectural Boundary & Separation of Concerns

The frontend strictly enforces a unidirectional data flow layer:

```
┌────────────────────────────────────────────────────────┐
│ UI Components (Pages, Tables, Cards, Badges)          │
└──────────────────────────┬─────────────────────────────┘
                           │ (TanStack Query / Custom Hook)
┌──────────────────────────▼─────────────────────────────┐
│ React Hooks (`useScanState`, `useUrlState`, Query)    │
└──────────────────────────┬─────────────────────────────┘
                           │ (Strongly typed method call)
┌──────────────────────────▼─────────────────────────────┐
│ Service Layer (`ScanService`, `ComplianceService`, …) │
└──────────────────────────┬─────────────────────────────┘
                           │ (Mock in Demo Mode / ApiClient in Live)
┌──────────────────────────▼─────────────────────────────┐
│ API Client (`src/api/client.ts` - Axios/Fetch wrapper) │
└──────────────────────────┬─────────────────────────────┘
                           │ (HTTP/REST + JSON)
┌──────────────────────────▼─────────────────────────────┐
│ Backend Services (OCR, Rules Engine, Blockchain Ledger)│
└────────────────────────────────────────────────────────┘
```

> **Strict Rule**: No UI component may invoke `fetch()` or `axios()` directly. All data ingress and egress occurs via the Service Layer.

---

## 2. Global Request & Response Conventions

### Headers
All requests sent by `ApiClient` include:
```http
Accept: application/json
Content-Type: application/json (except multipart/form-data uploads)
Authorization: Bearer <token> (when authenticated)
X-Request-Id: <uuidv4>
```

### Standard Error Response Format (HTTP 4xx / 5xx)
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The uploaded file exceeds statutory resolution thresholds.",
    "details": [
      {
        "field": "file",
        "issue": "Image DPI below 300 requirement"
      }
    ],
    "timestamp": "2026-09-07T12:00:00Z",
    "requestId": "req_8f192b0c"
  }
}
```

---

## 3. Core API Endpoint Contracts

### 3.1. `POST /scan`
Initiates a new compliance verification scan from an uploaded label image or document.

- **Method**: `POST`
- **Path**: `/scan`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: Binary file (image/jpeg, image/png, application/pdf). Max size: 25MB.
  - `metadata`: Optional JSON string containing `{ batchNumber, gtin, category }`.
- **Response `201 Created` / `202 Accepted`**:
```json
{
  "scanId": "scn_98218392",
  "status": "READY",
  "fileUrl": "https://storage.regulator.internal/scans/scn_98218392.jpg",
  "message": "File uploaded and preprocessed successfully."
}
```
- **Error Codes**:
  - `400 Bad Request`: Invalid file format or missing file.
  - `413 Payload Too Large`: Exceeds 25MB.
  - `422 Unprocessable Entity`: Corrupt image data.

---

### 3.2. `GET /scan/:id`
Retrieves complete scan results including OCR regions, extracted statutory fields, and preliminary verdicts.

- **Method**: `GET`
- **Path**: `/scan/{id}`
- **Response `200 OK`**:
```json
{
  "id": "scn_98218392",
  "fileName": "label_multigrain_flakes.jpg",
  "fileSize": 2048576,
  "mimeType": "image/jpeg",
  "fileUrl": "https://storage.regulator.internal/scans/scn_98218392.jpg",
  "status": "COMPLETED",
  "uploadedAt": "2026-09-07T10:14:22Z",
  "processedAt": "2026-09-07T10:14:28Z",
  "overallScore": 92.5,
  "complianceVerdict": "compliant",
  "product": {
    "id": "prod_9082",
    "name": "Fortified Multi-Grain Breakfast Flakes",
    "gtin": "8901030829104",
    "manufacturer": "Apex Nutrition Consumer Ltd.",
    "category": "Packaged Food / Cereals",
    "batchNumber": "LOT-2026-X89",
    "mfgDate": "2026-06-15",
    "expDate": "2027-06-14",
    "netWeight": "500g",
    "fssaiLicenseNumber": "10012011000189"
  },
  "ocrRegions": [
    {
      "id": "ocr_01",
      "boundingBox": { "x": 50, "y": 120, "width": 400, "height": 80 },
      "confidence": 0.98,
      "detectedText": "NET WEIGHT: 500g (17.63 oz)",
      "orientation": 0
    }
  ],
  "extractedFields": [
    {
      "fieldName": "netWeight",
      "label": "Net Quantity",
      "rawValue": "NET WEIGHT: 500g (17.63 oz)",
      "normalizedValue": "500g",
      "confidence": 0.98,
      "status": "valid",
      "ocrRegionId": "ocr_01"
    }
  ]
}
```

---

### 3.3. `GET /history`
Retrieves paginated scan history and audit entries with comprehensive filtering.

- **Method**: `GET`
- **Path**: `/history`
- **Query Parameters**:
  - `page` (integer, default `1`)
  - `limit` (integer, default `20`)
  - `search` (string, optional - searches productName, gtin, batchNumber)
  - `status` (string, optional: `compliant` | `violation` | `review` | `info`)
  - `category` (string, optional)
  - `sortBy` (string, default `timestamp`)
  - `sortOrder` (`asc` | `desc`, default `desc`)
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "id": "hist_001",
      "scanId": "scn_20260901",
      "productName": "Organic Whole Milk 1L",
      "gtin": "8901030999011",
      "status": "compliant",
      "timestamp": "2026-09-07T10:15:00Z",
      "violationCount": 0,
      "complianceScore": 98,
      "scannedBy": "Insp. R. Sharma",
      "category": "Dairy Products",
      "batchNumber": "MLK-882-A"
    }
  ],
  "total": 48,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

### 3.4. `GET /dashboard`
Provides consolidated compliance metrics, aggregate health scores, and operational activity streams.

- **Method**: `GET`
- **Path**: `/dashboard`
- **Response `200 OK`**:
```json
{
  "totalScans": 14820,
  "complianceRate": 96.4,
  "activeViolations": 18,
  "pendingReviews": 34,
  "scansToday": 245,
  "criticalAlertsCount": 3,
  "scansByCategory": [
    { "category": "Dairy Products", "total": 4200, "compliant": 4080, "violations": 120, "rate": 97.1 }
  ],
  "scansTimeline": [
    { "date": "2026-09-07", "total": 245, "compliant": 238, "violations": 7 }
  ],
  "recentActivity": [
    {
      "id": "act_1",
      "type": "scan",
      "title": "Scan completed: Fortified Multi-Grain Flakes",
      "timestamp": "10 minutes ago",
      "status": "compliant",
      "actor": "System / Automated Pipeline"
    }
  ]
}
```

---

### 3.5. `GET /reports` & `GET /reports/:id`
Retrieves generated regulatory compliance audit reports and legal certificates.

- **Method**: `GET`
- **Path**: `/reports` or `/reports/{id}`
- **Response `200 OK`**:
```json
{
  "id": "rep_2026_001",
  "scanId": "scn_20260901",
  "generatedAt": "2026-09-07T11:00:00Z",
  "generatedBy": "Central Compliance Audit Engine",
  "overallStatus": "compliant",
  "totalChecks": 18,
  "passedChecks": 18,
  "failedChecks": 0,
  "reviewChecks": 0,
  "violations": [],
  "checks": [],
  "productInfo": {
    "id": "prod_101",
    "name": "Organic Whole Milk 1L",
    "gtin": "8901030999011",
    "manufacturer": "Apex Nutrition Consumer Ltd.",
    "category": "Dairy Products"
  },
  "summary": "All statutory labeling, allergen warnings, FSSAI licensing, and net metrology parameters conform to national regulatory requirements.",
  "digitalSignature": "SIG-RSA4096-788102919248A",
  "reportUrl": "https://storage.regulator.internal/reports/rep_2026_001.pdf"
}
```

---

### 3.6. `GET /verify/:batch_id`
Performs cryptographic proof verification for batch traceability against immutable records.

- **Method**: `GET`
- **Path**: `/verify/{batch_id}`
- **Response `200 OK`**:
```json
{
  "batch": {
    "id": "rec_LOT-2026-X89",
    "batchId": "LOT-2026-X89",
    "productGtin": "8901030829104",
    "productName": "Fortified Multi-Grain Breakfast Flakes",
    "unitCount": 12500,
    "complianceStatus": "compliant",
    "timestamp": "2026-09-07T08:00:00Z",
    "verificationHash": "4f8b2b7194f4d2f8647248e3cf75836c843075c3ef90fa96a0fcf6d649dbb184",
    "operatorId": "OPR-IND-902",
    "facilityLocation": "Manufacturing Plant 04, Greater Noida, UP"
  },
  "result": {
    "batchId": "LOT-2026-X89",
    "verifiedAt": "2026-09-07T08:02:14Z",
    "isValid": true,
    "cryptographicProof": "SHA256:4f8b2b7194f4d2f8647248e3cf75836c843075c3ef90fa96a0fcf6d649dbb184",
    "matchesRegistry": true,
    "ledgerTimestamp": "2026-09-07T08:02:14Z",
    "violationsCount": 0,
    "recordsCount": 12500,
    "issuerAuthority": "National Regulatory Electronic Compliance Registry",
    "digitalCertificateId": "CERT-REG-2026-8910",
    "qrUrl": "https://storage.regulator.internal/qr/LOT-2026-X89.png",
    "verificationUrl": "https://compliance.gov.in/verify/LOT-2026-X89"
  }
}
```

> **Strict Public Privacy Contract Rule**:
> For public presentation contexts (`/verify/:batch_id`), `operatorId`, officer credentials, and private internal audit comments MUST NEVER be exposed. Only product identification, batch parameters, facility location, issuing authority, and cryptographic ledger proofs are presented to the public.

---

## 4. Institutional User Roles & Permission Contract

Canonical internal roles are strictly enumerated as:

```typescript
export type Role =
  | 'CONSUMER'
  | 'DEALER'
  | 'ADMIN'
  | 'LEGAL_METROLOGY_OFFICER';
```

| Canonical Role | Display Label | Permitted Routes | Primary Scope |
| :--- | :--- | :--- | :--- |
| `LEGAL_METROLOGY_OFFICER` | Legal Metrology Officer | `/`, `/dashboard`, `/scan`, `/history`, `/reports`, `/verify`, `/settings` | Full statutory inspection, decision trace analysis, dossier generation |
| `ADMIN` | System Administrator | `/`, `/dashboard`, `/scan`, `/history`, `/reports`, `/verify`, `/settings` | Platform telemetry, audit monitoring, user session management |
| `DEALER` | Dealer / Manufacturer | `/`, `/dashboard`, `/verify`, `/reports` | Batch authenticity validation, lot compliance verification, report review |
| `CONSUMER` | Consumer / Public Citizen | `/`, `/verify`, `/reports` | Public lot authenticity check, statutory compliance lookup |

> **Security Reminder**: Frontend role checking is exclusively for user experience and navigation filtering. Backend microservice APIs remain authoritative for authorization and token validation.

---

## 5. Frontend Service Layer Specifications

| Service Interface | Location | Primary Responsibilities |
| :--- | :--- | :--- |
| `ScanService` | `src/services/scanService.ts` | Uploads label files, manages progress polling, retrieves scan entities and OCR extraction data. |
| `ComplianceService` | `src/services/complianceService.ts` | Fetches rule evaluation results, violations list, and detailed decision traces with statutory legal citations. |
| `HistoryService` | `src/services/historyService.ts` | Fetches paginated history records, handles multi-field filtering (including date ranges), and exports audit records. |
| `DashboardService` | `src/services/dashboardService.ts` | Gathers high-level compliance metrics, categorization charts, and real-time operational feeds. |
| `VerificationService` | `src/services/verificationService.ts` | Interrogates batch cryptographic proofs and verifies integrity against ledger registers. |
| `ReportService` | `src/services/reportService.ts` | Coordinates generation, viewing, and signed PDF downloads of formal audit reports. |

---

## 6. Dual-Mode Operation (`VITE_DEMO_MODE`)

All services automatically adapt based on `env.VITE_DEMO_MODE`:
- When `VITE_DEMO_MODE=true`: Requests are fulfilled via high-fidelity, deterministic mock data matching these contracts.
- When `VITE_DEMO_MODE=false`: Requests execute live network calls via `apiClient`.
- The UI layer is completely decoupled from whether demo mode or live mode is active.
