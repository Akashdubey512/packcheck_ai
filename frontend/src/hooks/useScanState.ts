import { useReducer, useCallback } from 'react';
import {
  scanStateReducer,
  INITIAL_SCAN_CONTEXT,
  ScanEvent,
  ScanStateContext,
} from '@/features/scan/state';

export function useScanState(initialState: ScanStateContext = INITIAL_SCAN_CONTEXT) {
  const [state, dispatch] = useReducer(scanStateReducer, initialState);

  const startUpload = useCallback((file: File) => {
    dispatch({ type: 'START_UPLOAD', file });
  }, []);

  const updateProgress = useCallback((progress: number) => {
    dispatch({ type: 'UPLOAD_PROGRESS', progress });
  }, []);

  const uploadSuccess = useCallback((scanId: string) => {
    dispatch({ type: 'UPLOAD_SUCCESS', scanId });
  }, []);

  const uploadFailed = useCallback((error: string, code?: string) => {
    dispatch({ type: 'UPLOAD_FAILED', error, code });
  }, []);

  const startProcessing = useCallback(() => {
    dispatch({ type: 'START_PROCESSING' });
  }, []);

  const updateProcessingStep = useCallback((step: string) => {
    dispatch({ type: 'PROCESSING_STEP', step });
  }, []);

  const processingSuccess = useCallback(() => {
    dispatch({ type: 'PROCESSING_SUCCESS' });
  }, []);

  const processingFailed = useCallback((error: string, code?: string) => {
    dispatch({ type: 'PROCESSING_FAILED', error, code });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    status: state.status,
    isIdle: state.status === 'IDLE',
    isUploading: state.status === 'UPLOADING',
    isReady: state.status === 'READY',
    isProcessing: state.status === 'PROCESSING',
    isCompleted: state.status === 'COMPLETED',
    isFailed: state.status === 'FAILED',
    startUpload,
    updateProgress,
    uploadSuccess,
    uploadFailed,
    startProcessing,
    updateProcessingStep,
    processingSuccess,
    processingFailed,
    reset,
    dispatch: (event: ScanEvent) => dispatch(event),
  };
}
