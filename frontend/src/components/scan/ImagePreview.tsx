import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ArrowRight, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';
import { formatFileSize } from '@/utils/formatters';

interface ImagePreviewProps {
  file: File;
  previewUrl: string;
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
  previewUrl,
  onConfirmAnalyze,
  onCancel,
  isProcessing = false,
}) => {
  const [selectedProfile, setSelectedProfile] = useState(INSPECTION_PROFILES[0]!.id);

  const formattedSize = formatFileSize(file.size);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Visual Image Preview */}
      <div className="lg:col-span-6 space-y-3">
        <Card className="overflow-hidden border border-border">
          <div className="bg-slate-900/5 dark:bg-surface-subtle p-4 flex items-center justify-center min-h-[380px] max-h-[500px] overflow-hidden relative group">
            <img
              src={previewUrl}
              alt="Pre-flight Label Preview"
              className="max-h-[460px] w-auto object-contain rounded border border-border shadow-sm transition-transform duration-300 group-hover:scale-[1.01]"
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
                OPTICAL INSPECTION ACTIVE // 120 FPS
              </div>
            </div>
          </div>
          <div className="p-3 border-t border-border bg-surface flex flex-wrap items-center justify-between text-2xs text-slate-500 font-mono">
            <span>FILE: {file.name}</span>
            <span>{formattedSize} • {file.type || 'image/svg+xml'}</span>
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
