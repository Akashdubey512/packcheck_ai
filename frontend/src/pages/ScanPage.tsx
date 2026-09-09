import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import { ScanUploader } from '@/components/scan/ScanUploader';
import { ImagePreview } from '@/components/scan/ImagePreview';
import { ProcessingWorkflow } from '@/components/scan/ProcessingWorkflow';
import { useScanState } from '@/hooks/useScanState';
import { ScanService } from '@/services/scanService';
import { PRESET_LABEL_SAMPLES } from '@/utils/sampleLabels';
import { buildRoute } from '@/constants/routes';

export const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    state,
    startUpload,
    uploadSuccess,
    uploadFailed,
    startProcessing,
    processingSuccess,
    reset,
  } = useScanState();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [activeScanId, setActiveScanId] = useState<string>('scn_sample_cereal');

  // Handle URL preset query parameter (e.g. /scan?preset=sample_cereal_violations)
  useEffect(() => {
    const presetId = searchParams.get('preset');
    if (presetId) {
      const sample = PRESET_LABEL_SAMPLES.find((s) => s.id === presetId);
      if (sample) {
        fetch(sample.imageUrl)
          .then((r) => r.blob())
          .then((blob) => {
            const file = new File([blob], sample.fileName, { type: 'image/svg+xml' });
            setActiveFile(file);
            setPreviewUrl(sample.imageUrl);
            setActiveScanId(`scn_${sample.id}`);
            startUpload(file);
            uploadSuccess(`scn_${sample.id}`);
          })
          .catch(() => {});
      }
    }
  }, [searchParams, startUpload, uploadSuccess]);

  const handleFileSelected = async (file: File, sampleId?: string) => {
    setActiveFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    startUpload(file);

    try {
      const response = await ScanService.uploadScan(file, sampleId);
      const finalScanId = response.scanId || (sampleId ? `scn_${sampleId}` : `scn_sample_cereal_violations`);
      setActiveScanId(finalScanId);
      if (response.fileUrl && (response.fileUrl.startsWith('http') || response.fileUrl.startsWith('data:'))) {
        setPreviewUrl(response.fileUrl);
      }
      uploadSuccess(finalScanId);
    } catch (err: any) {
      console.error('Packaging artifact upload error:', err);
      const errorMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'An error occurred while uploading or parsing the packaging label image.';
      uploadFailed(errorMessage);
    }
  };

  const handleConfirmAnalyze = () => {
    startProcessing();
  };

  const handleProcessingComplete = () => {
    processingSuccess();
    // Smooth transition to results workspace
    navigate(buildRoute.scanDetail(activeScanId));
  };

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleCancelPreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setActiveFile(null);
    reset();
  };

  return (
    <PageShell
      title="Statutory Packaging Label Ingestion"
      description="Stage 1 Ingestion Pipeline: Upload packaging artwork for optical analysis, statutory declaration extraction, and Legal Metrology rule assessment."
      badge={<StatusBadge status="info" customText={`Status: ${state.status}`} size="sm" />}
    >
      <div className="space-y-6">
        {/* Step 1: Upload or Select Sample (active during IDLE and UPLOADING) */}
        {(state.status === 'IDLE' || state.status === 'UPLOADING') && (
          <ScanUploader onFileSelected={handleFileSelected} isUploading={state.status === 'UPLOADING'} />
        )}

        {/* Step 2: Pre-Flight Preview & Profile Selection */}
        {state.status === 'READY' && activeFile && previewUrl && (
          <ImagePreview
            file={activeFile}
            previewUrl={previewUrl}
            onConfirmAnalyze={handleConfirmAnalyze}
            onCancel={handleCancelPreview}
          />
        )}

        {/* Step 3: Multi-Stage Processing Pipeline */}
        {state.status === 'PROCESSING' && (
          <ProcessingWorkflow
            scanId={activeScanId}
            onComplete={handleProcessingComplete}
          />
        )}

        {/* Step 4: Actionable Error Recovery */}
        {state.status === 'FAILED' && (
          <div className="p-8 rounded border border-violation-border bg-violation-surface text-center space-y-4 max-w-lg mx-auto">
            <AlertTriangle size={32} className="mx-auto text-violation" />
            <div className="text-violation font-bold text-sm">Packaging Artifact Ingestion Failed</div>
            <p className="text-xs text-violation-foreground leading-relaxed">
              {state.errorMessage || 'An error occurred while uploading or parsing the packaging label image.'}
            </p>
            <Button size="sm" variant="primary" onClick={handleCancelPreview}>
              Try Again / Re-Upload
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
};
