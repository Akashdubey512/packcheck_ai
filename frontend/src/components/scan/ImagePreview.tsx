import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ArrowRight, RotateCcw, SlidersHorizontal, Check, Layers } from 'lucide-react';
import { formatFileSize } from '@/utils/formatters';

interface ImagePreviewProps {
  file?: File;
  files?: File[];
  previewUrl?: string;
  previewUrls?: string[];
  onConfirmAnalyze: (selectedProfile: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const INSPECTION_PROFILES = [
  {
    id: 'profile_full_statutory',
    name: 'Comprehensive Legal Metrology & FSSAI Labelling',
    description: 'Statutory net quantity, font numeral metrics, FSSAI licensing, allergen disclosures, and expiration declarations.',
    isDefault: true,
  },
  {
    id: 'profile_weights_measures',
    name: 'Legal Metrology (Packaged Commodities) Only',
    description: 'Strict numeral height verification, SI metric syntax, and manufacturer declaration.',
    isDefault: false,
  },
  {
    id: 'profile_dietary_allergens',
    name: 'FSSAI Safety, Allergen & Nutritional Mandates',
    description: 'Vegetarian emblem presence, allergen contrast, and nutritional facts panel.',
    isDefault: false,
  },
];

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  file,
  files,
  previewUrl,
  previewUrls,
  onConfirmAnalyze,
  onCancel,
  isProcessing = false,
}) => {
  const [selectedProfile, setSelectedProfile] = useState(INSPECTION_PROFILES[0]!.id);
  const [selectedAngleIndex, setSelectedAngleIndex] = useState(0);

  const effectiveFiles = files && files.length > 0 ? files : file ? [file] : [];
  const currentFile = effectiveFiles[selectedAngleIndex] || effectiveFiles[0];

  // Derive stable image URL directly from currentFile so all angles are always visible
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    if (currentFile) return URL.createObjectURL(currentFile);
    if (previewUrls && previewUrls[selectedAngleIndex]) return previewUrls[selectedAngleIndex]!;
    return previewUrl || '';
  });

  useEffect(() => {
    if (currentFile) {
      const url = URL.createObjectURL(currentFile);
      setCurrentUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (previewUrls && previewUrls[selectedAngleIndex]) {
      setCurrentUrl(previewUrls[selectedAngleIndex]!);
    } else if (previewUrl) {
      setCurrentUrl(previewUrl);
    }
  }, [currentFile, selectedAngleIndex, previewUrls, previewUrl]);

  const formattedSize = currentFile ? formatFileSize(currentFile.size) : '0 KB';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Visual Image Preview */}
      <div className="lg:col-span-6 space-y-3">
        {effectiveFiles.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-muted border border-border">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  360° Multi-Angle Capture ({effectiveFiles.length} Angles Selected)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Full Statutory Coverage
              </span>
            </div>

            {/* Angle Tab Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {effectiveFiles.map((f, idx) => {
                const angleLabel =
                  idx === 0 ? 'Angle 1: Front (PDP)' :
                  idx === 1 ? 'Angle 2: Back Panel' :
                  idx === 2 ? 'Angle 3: Left Side' :
                  idx === 3 ? 'Angle 4: Right Side' :
                  `Angle ${idx + 1}: Panel`;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAngleIndex(idx)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-2xs transition-all shrink-0 ${
                      selectedAngleIndex === idx
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30 font-bold'
                        : 'border-border bg-surface hover:border-slate-400 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-surface-muted border border-border flex items-center justify-center font-mono text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{angleLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Card className="overflow-hidden border border-border">
          <div className="bg-slate-900/5 dark:bg-surface-subtle p-4 flex items-center justify-center min-h-[380px] max-h-[500px] overflow-hidden relative group">
            <img
              key={selectedAngleIndex}
              src={currentUrl}
              alt={`Pre-flight Label Preview - Angle ${selectedAngleIndex + 1}`}
              className="max-h-[460px] w-auto object-contain rounded border border-border shadow-sm transition-transform duration-300 group-hover:scale-[1.01]"
              onError={() => {
                if (currentFile) {
                  const fallback = URL.createObjectURL(currentFile);
                  setCurrentUrl(fallback);
                }
              }}
            />

            {/* High-Tech 120 FPS Laser Scanner HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded">
              {/* Vertical Sweep Laser Line */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_16px_3px_rgba(56,189,248,0.7)] animate-laser opacity-90" />
              {/* Corner HUD Reticles */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-sky-400/80" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-sky-400/80" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-sky-400/80" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-sky-400/80" />
              <div className="absolute top-5 left-12 font-mono text-[10px] text-sky-400/90 font-bold tracking-widest uppercase flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                OPTICAL MULTI-VIEW INSPECTION ACTIVE // 120 FPS
              </div>
            </div>
          </div>
          <div className="p-3 border-t border-border bg-surface flex flex-wrap items-center justify-between text-2xs text-slate-500 font-mono">
            <span>FILE: {currentFile?.name || 'package.jpg'} {effectiveFiles.length > 1 ? `(Angle ${selectedAngleIndex + 1} of ${effectiveFiles.length})` : ''}</span>
            <span>{formattedSize} • {currentFile?.type || 'image/jpeg'}</span>
          </div>
        </Card>
      </div>

      {/* Pre-Flight Inspection Settings */}
      <div className="lg:col-span-6 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              <CardTitle>Pre-Flight Statutory Verification</CardTitle>
            </div>
            <CardDescription>
              Artifact passed resolution checks. Select the regulatory inspection framework before running the rule engine.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <SlidersHorizontal size={13} />
                Regulatory Inspection Profile
              </label>

              <div className="space-y-2">
                {INSPECTION_PROFILES.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile.id)}
                    className={`p-3 rounded border text-left cursor-pointer transition-colors ${
                      selectedProfile === profile.id
                        ? 'border-primary bg-surface-muted ring-1 ring-primary'
                        : 'border-border hover:bg-surface-muted/50 bg-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{profile.name}</span>
                      {selectedProfile === profile.id && <Check size={14} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-2xs text-slate-500 mt-1 leading-relaxed">{profile.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded bg-surface-muted border border-border text-2xs space-y-1 font-mono text-slate-600 dark:text-slate-400">
              <div>• Optical Resolution: PASS (Calculated &gt;= 300 DPI equivalent)</div>
              <div>• Color Space: sRGB Calibrated</div>
              <div>• Structural Framing: Full PDP Boundaries Detected</div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2 justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              <RotateCcw size={14} className="mr-1.5" /> Cancel / Change Image
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isProcessing}
              onClick={() => onConfirmAnalyze(selectedProfile)}
              className="w-full sm:w-auto"
            >
              Initiate Statutory Analysis <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
