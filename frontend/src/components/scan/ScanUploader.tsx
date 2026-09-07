import React, { useState, useRef } from 'react';
import { Upload, FileImage, Camera, Layers, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PRESET_LABEL_SAMPLES, PresetLabelSample } from '@/utils/sampleLabels';

interface ScanUploaderProps {
  onFileSelected: (file: File, sampleId?: string) => void;
  isUploading?: boolean;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const ScanUploader: React.FC<ScanUploaderProps> = ({ onFileSelected, isUploading = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File, sampleId?: string) => {
    setErrorMessage(null);

    // Accept specified image formats
    const isAccepted = ACCEPTED_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isAccepted && !sampleId) {
      setErrorMessage('Unsupported file format. Please upload JPG, PNG, or WEBP packaging label images.');
      return;
    }

    onFileSelected(file, sampleId);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) {
        validateAndProcessFile(file);
      }
    }
  };

  const handlePresetSelect = async (sample: PresetLabelSample) => {
    try {
      const response = await fetch(sample.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], sample.fileName, { type: 'image/svg+xml' });
      validateAndProcessFile(file, sample.id);
    } catch {
      // Fallback file
      const file = new File(['mock'], sample.fileName, { type: 'image/svg+xml' });
      validateAndProcessFile(file, sample.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-colors select-none ${
          isDragOver
            ? 'border-primary bg-surface-muted ring-2 ring-primary/20'
            : 'border-border hover:border-slate-400 dark:hover:border-slate-600 bg-surface'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndProcessFile(e.target.files[0]);
            }
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndProcessFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-surface-muted border border-border flex items-center justify-center text-primary shadow-subtle">
            <Upload size={24} strokeWidth={2} />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Upload Packaging Label Artifact
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Drag and drop product front or back panel image, or browse local inspection files.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileImage size={14} className="mr-1.5" /> Select Image File
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera size={14} className="mr-1.5" /> Capture with Camera
            </Button>
          </div>

          <div className="text-2xs text-slate-400 font-mono pt-1">
            Supported Formats: JPG, JPEG, PNG, WEBP
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded bg-violation-surface border border-violation-border text-violation-foreground text-xs flex items-center justify-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Demonstration Datasets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Demonstration Datasets (Mock Regulatory Cases for Testing)
            </span>
          </div>
          <span className="text-2xs text-slate-500 font-mono">1-Click Test Loads</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_LABEL_SAMPLES.map((sample) => {
            const statusBadgeColors = {
              violation: 'bg-violation-surface text-violation-foreground border-violation-border',
              compliant: 'bg-compliant-surface text-compliant-foreground border-compliant-border',
              review: 'bg-review-surface text-review-foreground border-review-border',
            }[sample.status];

            const statusText = {
              violation: 'FAIL: Infractions',
              compliant: 'PASS: Compliant',
              review: 'ATTN: Needs Review',
            }[sample.status];

            return (
              <Card
                key={sample.id}
                className="cursor-pointer hover:border-primary/80 transition-all text-left flex flex-col justify-between"
                onClick={() => handlePresetSelect(sample)}
              >
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xs font-semibold px-2 py-0.5 rounded border uppercase ${statusBadgeColors}`}>
                      {statusText}
                    </span>
                    <span className="text-2xs font-mono text-slate-400">{sample.category}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground leading-snug">{sample.name}</h4>
                  <p className="text-2xs text-slate-500 line-clamp-2 leading-relaxed">{sample.description}</p>
                </div>
                <div className="p-3 border-t border-border bg-surface-subtle/60 flex items-center justify-between text-2xs text-slate-600 dark:text-slate-400">
                  <span>Load Demo Case</span>
                  <span className="font-semibold text-primary">Inspect →</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
