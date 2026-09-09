import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { PublicVerificationView, QRVerificationCard } from '@/components/verification';
import { VerificationService, BatchVerificationResponse } from '@/services/verificationService';
import { ROUTES } from '@/constants/routes';
import { ArrowLeft, RotateCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { staggerContainer, staggerItem, gpuAcceleratedStyle } from '@/animations/motion';

export const VerifyBatchPage: React.FC = () => {
  const { batch_id = 'LOT-2026-X89' } = useParams<{ batch_id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<BatchVerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBatch = useCallback(() => {
    if (!batch_id) return;
    setLoading(true);
    setError(null);
    VerificationService.verifyBatch(batch_id)
      .then((res) => {
        setData(res);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : `Unable to query electronic ledger for "${batch_id}".`;
        setError(msg);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [batch_id]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  return (
    <PageShell
      title={`Batch Verification: ${batch_id}`}
      description="Public compliance verification record against National Regulatory Electronic Registry."
      badge={
        data ? (
          <StatusBadge
            status={
              data.batch.complianceStatus === 'compliant'
                ? 'compliant'
                : data.batch.complianceStatus === 'review'
                ? 'review'
                : 'violation'
            }
            customText={
              data.batch.complianceStatus === 'compliant'
                ? 'Verified Authentic'
                : data.batch.complianceStatus === 'review'
                ? 'Review Required'
                : 'Flagged Non-Compliant'
            }
            size="sm"
          />
        ) : null
      }
      actions={
        <div className="flex items-center gap-2">
          {data?.batch?.id && (
            <Button size="sm" variant="primary" onClick={() => navigate(`/scan/${data.batch.id}`)}>
              <ShieldCheck size={13} className="mr-1" /> Open Inspection Workspace
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.VERIFY)}>
            <ArrowLeft size={13} className="mr-1" /> New Verification
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
          <RotateCw size={15} className="animate-spin text-primary" />
          <span>Querying National Regulatory Electronic Ledger...</span>
        </div>
      ) : error || !data ? (
        <div className="p-12 text-center rounded border border-violation-border bg-violation-surface text-violation-foreground space-y-3 max-w-lg mx-auto">
          <AlertTriangle size={28} className="mx-auto text-violation" />
          <div className="font-semibold text-sm">Batch verification record could not be retrieved.</div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {error || `Unable to locate compliance ledger record for batch identifier "${batch_id}". Please check that the identifier is correct.`}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.VERIFY)}>
              <ArrowLeft size={13} className="mr-1" /> Return to Lookup
            </Button>
            <Button size="sm" variant="primary" onClick={fetchBatch}>
              <RotateCw size={13} className="mr-1" /> Retry Query
            </Button>
          </div>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={gpuAcceleratedStyle}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Main Column: Public Verification Details */}
          <motion.div variants={staggerItem} className="lg:col-span-8">
            <PublicVerificationView data={data} />
          </motion.div>

          {/* Sidebar Column: Visual QR Verification Card */}
          <motion.div variants={staggerItem} className="lg:col-span-4 space-y-4">
            <QRVerificationCard
              batchId={batch_id}
              qrUrl={data?.result.qrUrl}
              verificationUrl={data?.result.verificationUrl}
            />
          </motion.div>
        </motion.div>
      )}
    </PageShell>
  );
};
