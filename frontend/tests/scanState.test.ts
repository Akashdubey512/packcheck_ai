import { describe, it, expect } from 'vitest';
import {
  scanStateReducer,
  INITIAL_SCAN_CONTEXT,
} from '../src/features/scan/state';

describe('Scan State Machine Architecture', () => {
  it('should initialize with IDLE status and empty context', () => {
    expect(INITIAL_SCAN_CONTEXT.status).toBe('IDLE');
    expect(INITIAL_SCAN_CONTEXT.scanId).toBeNull();
    expect(INITIAL_SCAN_CONTEXT.file).toBeNull();
    expect(INITIAL_SCAN_CONTEXT.uploadProgress).toBe(0);
  });

  it('should transition from IDLE to UPLOADING on START_UPLOAD', () => {
    const dummyFile = new File(['content'], 'label.png', { type: 'image/png' });
    const nextState = scanStateReducer(INITIAL_SCAN_CONTEXT, {
      type: 'START_UPLOAD',
      file: dummyFile,
    });

    expect(nextState.status).toBe('UPLOADING');
    expect(nextState.file).toBe(dummyFile);
    expect(nextState.uploadProgress).toBe(0);
  });

  it('should update progress monotonically during UPLOADING', () => {
    const dummyFile = new File(['content'], 'label.png', { type: 'image/png' });
    let state = scanStateReducer(INITIAL_SCAN_CONTEXT, {
      type: 'START_UPLOAD',
      file: dummyFile,
    });

    state = scanStateReducer(state, { type: 'UPLOAD_PROGRESS', progress: 45 });
    expect(state.uploadProgress).toBe(45);
    expect(state.status).toBe('UPLOADING');

    state = scanStateReducer(state, { type: 'UPLOAD_PROGRESS', progress: 90 });
    expect(state.uploadProgress).toBe(90);
  });

  it('should transition to READY upon UPLOAD_SUCCESS', () => {
    const dummyFile = new File(['content'], 'label.png', { type: 'image/png' });
    let state = scanStateReducer(INITIAL_SCAN_CONTEXT, {
      type: 'START_UPLOAD',
      file: dummyFile,
    });

    state = scanStateReducer(state, {
      type: 'UPLOAD_SUCCESS',
      scanId: 'scn_test_123',
    });

    expect(state.status).toBe('READY');
    expect(state.scanId).toBe('scn_test_123');
    expect(state.uploadProgress).toBe(100);
  });

  it('should transition to PROCESSING when START_PROCESSING is dispatched from READY', () => {
    const readyState = {
      ...INITIAL_SCAN_CONTEXT,
      status: 'READY' as const,
      scanId: 'scn_test_123',
    };

    const processingState = scanStateReducer(readyState, { type: 'START_PROCESSING' });
    expect(processingState.status).toBe('PROCESSING');
    expect(processingState.processingStep).toBeDefined();
  });

  it('should transition to COMPLETED upon PROCESSING_SUCCESS', () => {
    const processingState = {
      ...INITIAL_SCAN_CONTEXT,
      status: 'PROCESSING' as const,
      scanId: 'scn_test_123',
    };

    const completedState = scanStateReducer(processingState, { type: 'PROCESSING_SUCCESS' });
    expect(completedState.status).toBe('COMPLETED');
  });

  it('should transition to FAILED when error occurs and preserve error context', () => {
    const processingState = {
      ...INITIAL_SCAN_CONTEXT,
      status: 'PROCESSING' as const,
      scanId: 'scn_test_123',
    };

    const failedState = scanStateReducer(processingState, {
      type: 'PROCESSING_FAILED',
      error: 'OCR text recognition resolution below statutory threshold',
      code: 'ERR_OCR_LOW_RES',
    });

    expect(failedState.status).toBe('FAILED');
    expect(failedState.errorMessage).toBe('OCR text recognition resolution below statutory threshold');
    expect(failedState.errorCode).toBe('ERR_OCR_LOW_RES');
  });

  it('should reset cleanly to INITIAL_SCAN_CONTEXT', () => {
    const failedState = {
      status: 'FAILED' as const,
      scanId: 'scn_test_123',
      file: null,
      uploadProgress: 100,
      errorMessage: 'Fatal failure',
    };

    const resetState = scanStateReducer(failedState, { type: 'RESET' });
    expect(resetState).toEqual(INITIAL_SCAN_CONTEXT);
  });
});
