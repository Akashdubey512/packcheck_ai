export const ROUTES = {
  HOME: '/',
  SCAN: '/scan',
  SCAN_DETAIL: '/scan/:id',
  DASHBOARD: '/dashboard',
  HISTORY: '/history',
  REPORTS: '/reports',
  VERIFY: '/verify',
  VERIFY_BATCH: '/verify/:batch_id',
  SETTINGS: '/settings',
  LOGIN: '/login',
} as const;

export const buildRoute = {
  scanDetail: (id: string) => `/scan/${id}`,
  verifyBatch: (batchId: string) => `/verify/${batchId}`,
};
