export const API_ENDPOINTS = {
  INSPECTIONS: {
    INSPECT: '/inspect',
    LIST: '/inspections',
    GET_BY_ID: (id: string) => `/inspections/${id}`,
    REVIEW: (id: string) => `/inspections/${id}/review`,
    REPORT: (id: string) => `/inspections/${id}/report`,
  },
  SCAN: {
    UPLOAD: '/inspect',
    GET_BY_ID: (id: string) => `/inspections/${id}`,
    GET_OCR: (id: string) => `/inspections/${id}/ocr`,
  },
  COMPLIANCE: {
    CHECK: (scanId: string) => `/compliance/${scanId}`,
    DECISION_TRACE: (traceId: string) => `/compliance/${traceId}`,
  },
  HISTORY: {
    LIST: '/inspections',
    EXPORT: '/history/export',
  },
  DASHBOARD: {
    METRICS: '/dashboard/metrics',
  },
  REPORTS: {
    LIST: '/inspections',
    GET_BY_ID: (id: string) => `/inspections/${id}/report`,
    GENERATE: '/reports/generate',
  },
  VERIFICATION: {
    GET_BY_BATCH_ID: (batchId: string) => `/verify/${batchId}`,
    SUBMIT_BATCH: '/verify/batch',
  },
} as const;

