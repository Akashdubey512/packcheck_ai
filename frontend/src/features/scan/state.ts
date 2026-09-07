/**
 * Explicit Scan State Machine
 * Eliminates ambiguous boolean flags (isLoading, isDone, isProcessing, hasError).
 */

export type ScanStatus =
  | 'IDLE'
  | 'UPLOADING'
  | 'READY'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface ScanStateContext {
  status: ScanStatus;
  scanId: string | null;
  file: File | null;
  uploadProgress: number; // 0 - 100
  processingStep?: string;
  errorMessage?: string;
  errorCode?: string;
}

export type ScanEvent =
  | { type: 'START_UPLOAD'; file: File }
  | { type: 'UPLOAD_PROGRESS'; progress: number }
  | { type: 'UPLOAD_SUCCESS'; scanId: string }
  | { type: 'UPLOAD_FAILED'; error: string; code?: string }
  | { type: 'START_PROCESSING' }
  | { type: 'PROCESSING_STEP'; step: string }
  | { type: 'PROCESSING_SUCCESS' }
  | { type: 'PROCESSING_FAILED'; error: string; code?: string }
  | { type: 'RESET' };

export const INITIAL_SCAN_CONTEXT: ScanStateContext = {
  status: 'IDLE',
  scanId: null,
  file: null,
  uploadProgress: 0,
  processingStep: undefined,
  errorMessage: undefined,
  errorCode: undefined,
};

/**
 * Deterministic State Machine Transition Reducer
 */
export function scanStateReducer(
  state: ScanStateContext,
  event: ScanEvent
): ScanStateContext {
  switch (event.type) {
    case 'START_UPLOAD':
      if (state.status !== 'IDLE' && state.status !== 'FAILED' && state.status !== 'COMPLETED') {
        return state; // Invalid transition ignored
      }
      return {
        ...INITIAL_SCAN_CONTEXT,
        status: 'UPLOADING',
        file: event.file,
        uploadProgress: 0,
      };

    case 'UPLOAD_PROGRESS':
      if (state.status !== 'UPLOADING') return state;
      return {
        ...state,
        uploadProgress: Math.min(100, Math.max(0, event.progress)),
      };

    case 'UPLOAD_SUCCESS':
      if (state.status !== 'UPLOADING') return state;
      return {
        ...state,
        status: 'READY',
        scanId: event.scanId,
        uploadProgress: 100,
      };

    case 'UPLOAD_FAILED':
      if (state.status !== 'UPLOADING') return state;
      return {
        ...state,
        status: 'FAILED',
        errorMessage: event.error,
        errorCode: event.code,
      };

    case 'START_PROCESSING':
      if (state.status !== 'READY' && state.status !== 'FAILED') return state;
      return {
        ...state,
        status: 'PROCESSING',
        processingStep: 'Initiating compliance analysis...',
        errorMessage: undefined,
        errorCode: undefined,
      };

    case 'PROCESSING_STEP':
      if (state.status !== 'PROCESSING') return state;
      return {
        ...state,
        processingStep: event.step,
      };

    case 'PROCESSING_SUCCESS':
      if (state.status !== 'PROCESSING') return state;
      return {
        ...state,
        status: 'COMPLETED',
        processingStep: undefined,
      };

    case 'PROCESSING_FAILED':
      if (state.status !== 'PROCESSING') return state;
      return {
        ...state,
        status: 'FAILED',
        errorMessage: event.error,
        errorCode: event.code,
      };

    case 'RESET':
      return INITIAL_SCAN_CONTEXT;

    default:
      return state;
  }
}
