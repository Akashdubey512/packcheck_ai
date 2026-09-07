# PackCheck — Institutional Regulatory Compliance Platform

> **PackCheck Frontend Platform (Phases 1–5 Complete & SIH Demo Ready)**  
> An institutional, high-precision regulatory compliance platform built for automated packaging label inspection, optical telemetry field verification, statutory infraction analysis, and cryptographic batch traceability under national Legal Metrology and packaging rules.

---

## 1. Architectural Foundation & Core Principles

This platform adheres strictly to national regulatory enterprise design standards:
- **Tone & Aesthetics**: Institutional, authoritative, precise, calm, and data-dense. Free from flashy neon gradients, AI sparkles, glassmorphism, or consumer SaaS tropes.
- **Strict Separation of Concerns**:
  `UI Component -> React Hook -> Service Layer -> API Client -> Backend API`
- **Dual-Mode Execution**:
  - `VITE_DEMO_MODE=true`: Exercises deterministic local mock data with realistic latencies, edge cases, and demonstration datasets.
  - `VITE_DEMO_MODE=false`: Direct integration with live regulatory backend microservices.
  - The UI layer remains completely identical in both modes; components never call `fetch`/`axios` directly.
- **Explicit Scan State Machine**:
  Deterministic lifecycle (`IDLE` → `UPLOADING` → `READY` → `PROCESSING` → `COMPLETED` / `FAILED`) eliminating ambiguous boolean flag combinations.
- **8px Spacing Rhythm**: Centralized design tokens enforcing 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px increments.
- **Accessibility & Status Design**:
  - Status badges never rely on color alone; every indicator combines an explicit **Icon + Status Prefix + Descriptive Text**.
  - System-wide `prefers-reduced-motion` support disabling animations and transitions for sensitive users.
  - Full keyboard navigation with visible focus rings (`:focus-visible`), skip-to-content links, and `Escape` key dialog dismissal.
- **Performance & Code Splitting**:
  - `manualChunks` in `vite.config.ts` separating `vendor-react` and `vendor-icons`.
  - Zero chunk-size warnings; production build compiled in ~3s.
- **Browser Storage Policy**: Browser `localStorage` is restricted to user UI preferences only (`theme`, `sidebar_collapsed`, `reduced_motion`). Sensitive tokens or compliance data are strictly blocked.

---

## 2. Canonical User Roles & Permissions

The platform adheres to the canonical role enum defined in the master specification:

```typescript
export type Role =
  | 'CONSUMER'
  | 'DEALER'
  | 'ADMIN'
  | 'LEGAL_METROLOGY_OFFICER';
```

- **Legal Metrology Officer (`LEGAL_METROLOGY_OFFICER`)**: Full statutory inspection, decision trace analysis, audit history, and compliance report issuance privileges (`/dashboard`, `/scan`, `/history`, `/reports`, `/verify`, `/settings`).
- **System Administrator (`ADMIN`)**: Central platform telemetry, audit log monitoring, and system configuration oversight.
- **Dealer / Manufacturer (`DEALER`)**: Packaging batch integrity validation, lot verification, and compliance report review (`/dashboard`, `/verify`, `/reports`).
- **Consumer / Public Citizen (`CONSUMER`)**: Public verification desk and published statutory compliance records (`/verify`, `/reports`).

> **Security Boundary**: Frontend role checks govern user experience and module presentation. Backend APIs remain strictly authoritative for session validation and data authorization.

---

## 3. Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── router/          # Declarative React Router v6 setup & routes
│   │   ├── providers/       # ThemeProvider, AuthProvider, QueryProvider, AppProviders
│   │   └── config/          # Zod-validated environment config (env.ts)
│   ├── components/
│   │   ├── ui/              # Button, Card, Table, StatusBadge primitives
│   │   ├── layout/          # AppLayout, Header, Sidebar, PageShell
│   │   ├── scan/            # ScanUploader, ImagePreview, ProcessingWorkflow
│   │   ├── compliance/      # ComplianceAssessment, ViolationCard, ChecklistItem, DecisionTracePanel
│   │   ├── evidence/        # EvidenceViewer, EvidenceOverlay, EvidencePanel
│   │   ├── dashboard/       # ComplianceOverview, ComplianceTrend, ViolationDistribution, RecentInspections
│   │   ├── history/         # HistoryTable, HistoryFilters, HistoryMobileCards
│   │   ├── reports/         # ReportView, ReportList, GenerateReportModal
│   │   └── verification/    # BatchInput, QRVerificationCard, PublicVerificationView
│   ├── pages/               # Home, Scan, ScanDetail, Dashboard, History, Reports, Verify, VerifyBatch, Settings, Login, 404
│   ├── features/
│   │   └── scan/            # Deterministic scan state machine & reducer
│   ├── hooks/               # useTheme, useAuth, useUrlState, useScanState
│   ├── services/            # ScanService, ComplianceService, HistoryService, DashboardService, VerificationService, ReportService
│   ├── api/                 # apiClient, endpoints constants
│   ├── types/               # Strict TypeScript domain interfaces
│   ├── schemas/             # Runtime Zod validation schemas
│   ├── utils/               # cn, storage policy, formatters, sampleLabels
│   ├── animations/          # Restrained transition tokens
│   ├── constants/           # routes, designTokens
│   └── styles/              # tokens.css, index.css
├── tests/                   # Vitest unit test suite (63 automated tests across 11 suites)
├── CONTRACTS.md             # Formal backend microservice interface contract
├── README.md                # Project documentation
└── .env.example             # Environment variable template
```

---

## 4. Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local development server on `http://localhost:3000` |
| `npm run build` | `tsc -b && vite build` | Strict typecheck and production bundle compilation |
| `npm run lint` | `eslint .` | Runs strict ESLint analysis on all TypeScript & React files |
| `npm run typecheck`| `tsc --noEmit` | Validates TypeScript types across the entire project |
| `npm run test` | `vitest run` | Runs complete Vitest automated unit test suite |
| `node tests/smokeTest.cjs` | `node tests/smokeTest.cjs` | HTTP route verification across all 13 application routes |

---

## 5. API Contracts & Verification Endpoints

Review [CONTRACTS.md](CONTRACTS.md) for full specifications on all request/response schemas, endpoint definitions, and service layer abstractions.

Key endpoints:
- Ingestion: `POST /scan`, `GET /scan/:id`
- Metrics: `GET /dashboard`
- History: `GET /history` (supporting search, status, category, date range, and pagination)
- Reports: `GET /reports`, `GET /reports/:id`
- Verification: `GET /verify/:batch_id` (public view strictly redacting private officer IDs)
