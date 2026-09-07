import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BatchInput, QRVerificationCard } from '@/components/verification';
import { buildRoute } from '@/constants/routes';

export const VerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBatchId, setSelectedBatchId] = useState('LOT-2026-X89');

  const handleVerifyBatch = (batchId: string) => {
    setSelectedBatchId(batchId);
    navigate(buildRoute.verifyBatch(batchId));
  };

  return (
    <PageShell
      title="Statutory Batch &amp; QR Verification Gateway"
      description="Cryptographic proof validation and public packaging authenticity check against national electronic compliance registries."
      badge={<StatusBadge status="info" customText="Public &amp; Trade Gateway" size="sm" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input & Presets */}
        <div className="lg:col-span-7 space-y-4">
          <BatchInput
            initialBatchId={selectedBatchId}
            onVerifyBatch={handleVerifyBatch}
          />

          <div className="p-4 rounded border border-border bg-surface-muted/60 text-2xs text-slate-500 space-y-1.5 leading-relaxed">
            <div className="font-bold text-foreground">Statutory Verification Notice:</div>
            <p>
              Consumers and retail dealers can verify manufactured food lots against the national compliance registry ledger. Batch numbers can be located stamped near the expiration date or on the bottom panel of packaging.
            </p>
          </div>
        </div>

        {/* Right: Interactive Visual QR Card */}
        <div className="lg:col-span-5 space-y-4">
          <QRVerificationCard
            batchId={selectedBatchId}
            onOpenPublicVerification={() => navigate(buildRoute.verifyBatch(selectedBatchId))}
          />
        </div>
      </div>
    </PageShell>
  );
};
