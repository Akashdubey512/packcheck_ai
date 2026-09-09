import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Camera, Hash, FileCheck2 } from 'lucide-react';

interface BatchInputProps {
  onVerifyBatch: (batchId: string) => void;
  initialBatchId?: string;
  isLoading?: boolean;
}

export const BatchInput: React.FC<BatchInputProps> = ({
  onVerifyBatch,
  initialBatchId = 'LOT-2026-X89',
  isLoading = false,
}) => {
  const [batchId, setBatchId] = useState(initialBatchId);
  const [isScanningQR, setIsScanningQR] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchId.trim()) {
      onVerifyBatch(batchId.trim().toUpperCase());
    }
  };

  const handleSimulateScan = () => {
    setIsScanningQR(true);
    setTimeout(() => {
      setIsScanningQR(false);
      const scannedId = 'LOT-2026-X89';
      setBatchId(scannedId);
      onVerifyBatch(scannedId);
    }, 1200);
  };

  return (
    <Card className="border border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileCheck2 size={18} className="text-primary" />
          <CardTitle className="text-sm">Query Manufactured Batch Registry</CardTitle>
        </div>
        <CardDescription>
          Enter product batch / lot number printed on package or scan physical QR code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="batchInput" className="block text-xs font-semibold text-foreground">
                Manufactured Batch / Lot or Inspection ID
              </label>
              <span className="text-[11px] text-slate-400">Real Scans &amp; Presets</span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                id="batchInput"
                type="text"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="e.g. LOT-2026-X89, MLK-882-A, or any INSP_ ID"
                required
                className="w-full pl-9 pr-3 py-2 text-xs rounded border border-border bg-surface-subtle text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono uppercase"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Enter any real uploaded inspection ID / Lot No. to verify live scan records, or choose a mock preset below.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="submit"
              size="sm"
              variant="primary"
              className="flex-1"
              isLoading={isLoading}
            >
              Verify Batch Authenticity
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSimulateScan}
              disabled={isScanningQR || isLoading}
              title="Simulates optical scanning of packaging QR in demo environment"
              aria-label="Simulate QR scan via camera"
            >
              <Camera size={13} className="mr-1.5" />
              {isScanningQR ? 'Simulating Optical QR Scan...' : 'DEMO Camera Simulator'}
            </Button>
          </div>
        </form>

        {/* 1-Click Test Presets */}
        <div className="pt-2 border-t border-border/60 text-2xs space-y-1.5">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <Hash size={11} className="text-primary" /> DEMO Batch Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setBatchId('LOT-2026-X89');
                onVerifyBatch('LOT-2026-X89');
              }}
              className="px-2 py-1 rounded bg-violation-surface border border-violation-border text-violation text-2xs font-mono font-bold hover:underline"
            >
              DEMO: LOT-2026-X89 (Infraction Sample)
            </button>
            <button
              type="button"
              onClick={() => {
                setBatchId('MLK-882-A');
                onVerifyBatch('MLK-882-A');
              }}
              className="px-2 py-1 rounded bg-compliant-surface border border-compliant-border text-compliant text-2xs font-mono font-bold hover:underline"
            >
              DEMO: MLK-882-A (Compliant Dairy)
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
