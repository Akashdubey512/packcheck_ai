import React, { useState, useRef } from 'react';
import { Upload, FileImage, Camera, Layers, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PRESET_LABEL_SAMPLES, PresetLabelSample } from '@/utils/sampleLabels';
import { CameraModal } from '@/components/scan/CameraModal';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, gpuAcceleratedStyle } from '@/animations/motion';

interface ScanUploaderProps {
  onFileSelected: (files: File[], sampleId?: string) => void;
  isUploading?: boolean;
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/svg',
  'image/gif',
  'image/bmp',
];

export const ScanUploader: React.FC<ScanUploaderProps> = ({ onFileSelected, isUploading = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFiles = (files: File[], sampleId?: string) => {
    setErrorMessage(null);
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of files) {
      const isAccepted = ACCEPTED_TYPES.includes(file.type) || /\.(jpe?g|png|webp|svg|gif|bmp)$/i.test(file.name);
      if (isAccepted || sampleId) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      setErrorMessage('Unsupported file format. Please upload JPG, PNG, WEBP, SVG, GIF, or BMP packaging images.');
      return;
    }

    onFileSelected(validFiles, sampleId);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      validateAndProcessFiles(files);
    }
  };

  const handlePresetSelect = async (sample: PresetLabelSample) => {
    try {
      const response = await fetch(sample.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], sample.fileName, { type: 'image/svg+xml' });
      validateAndProcessFiles([file], sample.id);
    } catch {
      // Fallback file
      const file = new File(['mock'], sample.fileName, { type: 'image/svg+xml' });
      validateAndProcessFiles([file], sample.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Dropzone with 120 FPS Drag Dynamics */}
      <motion.div
        animate={{
          scale: isDragOver ? 1.015 : 1,
          borderColor: isDragOver ? 'var(--color-primary)' : 'var(--color-border)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={gpuAcceleratedStyle}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-colors select-none ${
          isDragOver
            ? 'bg-surface-muted ring-2 ring-primary/20 shadow-lg'
            : 'hover:border-slate-400 dark:hover:border-slate-600 bg-surface shadow-subtle'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.svg,.bmp,.gif,image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const files = Array.from(e.target.files);
              validateAndProcessFiles(files);
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
            if (e.target.files && e.target.files.length > 0) {
              const files = Array.from(e.target.files);
              validateAndProcessFiles(files);
            }
          }}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto py-2">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-subtle">
              <Loader2 size={26} className="animate-spin text-primary" />
            </div>

            <div className="space-y-1 text-center">
              <h3 className="text-base font-semibold text-foreground">
                Uploading & Analyzing 360° Packaging Panels...
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Running multi-angle OCR, cross-view candidate fusion & Legal Metrology statutory compliance evaluation.
              </p>
            </div>

            <div className="flex items-center gap-2 text-2xs font-mono text-primary font-semibold animate-pulse pt-1">
              <span>Multi-View Fusion Pipeline Active...</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-2xs font-mono font-bold text-primary mb-1">
              <Layers size={13} />
              <span>360° MULTI-ANGLE SCAN (1 TO 6 PANELS)</span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload Packaging Label Artifacts"
              title="Click to select multiple packaging angle images"
              className="w-14 h-14 rounded-full bg-surface-muted border border-border flex items-center justify-center text-primary shadow-subtle cursor-pointer hover:bg-primary/10 hover:border-primary/40 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <Upload size={24} strokeWidth={2} />
            </button>

            <div
              className="space-y-1 cursor-pointer select-none"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              <h3 className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                Upload Packaging Panels (1 to 6 Images)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Drag and drop 2 to 4 angles (Front PDP, Back Info Panel, Sides) for 100% full statutory coverage and cross-view contradiction checks.
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
                <FileImage size={14} className="mr-1.5" /> Select Images (Hold Ctrl/Shift for multiple)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => setIsCameraOpen(true)}
              >
                <Camera size={14} className="mr-1.5" /> Capture with Camera
              </Button>
            </div>

            <div className="text-2xs text-slate-400 font-mono pt-1">
              Supported Formats: JPG, JPEG, PNG, WEBP, SVG, GIF, BMP • Up to 10 files
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded bg-violation-surface border border-violation-border text-violation-foreground text-xs flex items-center justify-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}
      </motion.div>

      {/* Demonstration Datasets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Demonstration Datasets (Mock Regulatory Cases for Testing)
            </span>
          </div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
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
              <motion.div key={sample.id} variants={staggerItem}>
                <Card
                  interactive
                  className="text-left flex flex-col justify-between h-full group"
                  onClick={() => handlePresetSelect(sample)}
                >
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-2xs font-semibold px-2 py-0.5 rounded border uppercase font-mono ${statusBadgeColors}`}>
                        {statusText}
                      </span>
                      <span className="text-2xs font-mono text-slate-400">{sample.category}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">{sample.name}</h4>
                    <p className="text-2xs text-slate-500 line-clamp-2 leading-relaxed">{sample.description}</p>
                  </div>
                  <div className="p-3 border-t border-border bg-surface-subtle/60 flex items-center justify-between text-2xs text-slate-600 dark:text-slate-400">
                    <span>Load Demo Case</span>
                    <span className="font-semibold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center">Inspect →</span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => {
          setIsCameraOpen(false);
          validateAndProcessFile(file);
        }}
        onBrowseFiles={() => fileInputRef.current?.click()}
      />
    </div>
  );
};
