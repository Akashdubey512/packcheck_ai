export const API_ENDPOINTS = {
  SCAN: {
    UPLOAD: '/scan',
    GET_BY_ID: (id: string) => `/scan/${id}`,
    GET_OCR: (id: string) => `/scan/${id}/ocr`,
  },
  COMPLIANCE: {
    CHECK: (scanId: string) => `/compliance/${scanId}`,
    DECISION_TRACE: (traceId: string) => `/compliance/trace/${traceId}`,
  },
  HISTORY: {
    LIST: '/history',
    EXPORT: '/history/export',
  },
  DASHBOARD: {
    METRICS: '/dashboard',
  },
  REPORTS: {
    LIST: '/reports',
    GET_BY_ID: (id: string) => `/reports/${id}`,
    GENERATE: '/reports/generate',
  },
  VERIFICATION: {
    GET_BY_BATCH_ID: (batchId: string) => `/verify/${batchId}`,
    SUBMIT_BATCH: '/verify/batch',
  },
} as const;
