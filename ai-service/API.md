# REST API Endpoint Contract

**Project**: Software System to Check Compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 (SIH 2026 PS ID 26034)  
**Version**: `1.0.0`  

---

## Endpoints Summary

### 1. `GET /health`
Returns system health status.

### 2. `GET /ready`
Returns system readiness status.

### 3. `POST /api/v1/inspect`
Ingests one or more packaging image files and returns unified multi-view compliance results.

### 4. `POST /api/v1/review`
Submits a human officer review override event.

### 5. `GET /api/v1/report/pdf/{inspection_id}`
Downloads official regulatory PDF compliance report.
