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

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [activeFiles, setActiveFiles] = useState<File[]>([]);
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
            setActiveFiles([file]);
            setPreviewUrls([sample.imageUrl]);
            setActiveScanId(`scn_${sample.id}`);
            startUpload(file);
            uploadSuccess(`scn_${sample.id}`);
          })
          .catch(() => {});
      }
    }
  }, [searchParams, startUpload, uploadSuccess]);

  const handleFileSelected = async (files: File[], sampleId?: string) => {
    setActiveFiles(files);
    const localUrls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(localUrls);
    startUpload(files[0] || ({} as File));

    try {
      const response = await ScanService.uploadScan(files, sampleId);
      const finalScanId = response.scanId || (sampleId ? `scn_${sampleId}` : `scn_sample_cereal_violations`);
      setActiveScanId(finalScanId);
      uploadSuccess(finalScanId);
    } catch (err: any) {
      console.error('Packaging artifact upload error:', err);
      const errorMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'An error occurred while uploading or parsing packaging label images.';
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

  // Clean up object URLs only when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const handleCancelPreview = () => {
    previewUrls.forEach((url) => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setPreviewUrls([]);
    setActiveFiles([]);
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
        {state.status === 'READY' && activeFiles.length > 0 && (
          <ImagePreview
            files={activeFiles}
            previewUrls={previewUrls}
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
