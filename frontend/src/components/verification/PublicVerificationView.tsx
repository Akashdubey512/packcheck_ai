import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { BatchVerificationResponse } from '@/services/verificationService';
import { formatGTIN } from '@/utils/formatters';
import {
  ShieldCheck,
  AlertOctagon,
  Building2,
  Calendar,
  Hash,
  Share2,
  Check,
} from 'lucide-react';

interface PublicVerificationViewProps {
  data: BatchVerificationResponse;
  onShare?: () => void;
}

export const PublicVerificationView: React.FC<PublicVerificationViewProps> = ({ data }) => {
  const [copied, setCopied] = React.useState(false);
  const { batch, result } = data;
  const isAuthenticAndCompliant = result.isValid && batch.complianceStatus === 'compliant';

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="border-2 border-border shadow-card overflow-hidden">
      {/* Public Authority Header */}
      <CardHeader
        className={`p-6 text-center border-b ${
          isAuthenticAndCompliant
            ? 'bg-compliant-surface/50 border-compliant-border'
            : 'bg-violation-surface/50 border-violation-border'
        }`}
      >
        <div className="mx-auto mb-2 flex items-center justify-center">
          {isAuthenticAndCompliant ? (
            <div className="w-14 h-14 rounded-full bg-compliant-surface text-compliant border-2 border-compliant flex items-center justify-center shadow-sm">
              <ShieldCheck size={32} />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-violation-surface text-violation border-2 border-violation flex items-center justify-center shadow-sm">
              <AlertOctagon size={32} />
            </div>
          )}
        </div>

        <span className="text-2xs font-mono font-bold tracking-widest uppercase text-slate-500 block">
          National Packaging Compliance Public Verification Registry
        </span>

        <CardTitle className="text-lg font-bold text-foreground mt-1">
          {isAuthenticAndCompliant ? 'Verified Genuine & Statutory Compliant' : 'Non-Compliant / Regulatory Flag Active'}
        </CardTitle>

        <div className="pt-2 flex justify-center">
          <StatusBadge
            status={isAuthenticAndCompliant ? 'compliant' : 'violation'}
            customText={isAuthenticAndCompliant ? 'Statutory Pass' : 'Compliance Infraction Flagged'}
            size="lg"
          />
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6 text-xs">
        {/* Public Product Information Card */}
        <div className="space-y-3">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500">
            Public Product Information
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded border border-border bg-surface-subtle/50">
            <div>
              <span className="text-2xs text-slate-500 block">Commodity / Product Name:</span>
              <span className="font-bold text-sm text-foreground">{batch.productName}</span>
            </div>
            <div>
              <span className="text-2xs text-slate-500 block">GTIN / National Barcode:</span>
              <span className="font-mono font-semibold text-foreground">{formatGTIN(batch.productGtin)}</span>
            </div>
            <div>
              <span className="text-2xs text-slate-500 block">Manufactured Batch / Lot:</span>
              <span className="font-mono font-bold text-primary">{batch.batchId}</span>
            </div>
            <div>
              <span className="text-2xs text-slate-500 block">Manufacturing Plant / Facility:</span>
              <span className="text-foreground flex items-center gap-1">
                <Building2 size={12} className="text-slate-400 shrink-0" />
                {batch.facilityLocation}
              </span>
            </div>
            <div>
              <span className="text-2xs text-slate-500 block">Registration Timestamp:</span>
              <span className="font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Calendar size={12} className="text-slate-400 shrink-0" />
                {new Date(batch.timestamp).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-2xs text-slate-500 block">Verified Batch Units:</span>
              <span className="font-mono text-foreground font-semibold">{batch.unitCount.toLocaleString()} units</span>
            </div>
          </div>
        </div>

        {/* Public Cryptographic & Registry Verification Facts */}
        <div className="space-y-2">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500">
            Registry Attestation Details
          </h4>

          <div className="p-4 rounded border border-border bg-surface space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-2xs">
              <span className="text-slate-500">Issuing Statutory Authority:</span>
              <span className="font-semibold text-foreground">{result.issuerAuthority}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-2xs border-t border-border/50 pt-2">
              <span className="text-slate-500">Digital Certificate ID:</span>
              <span className="font-mono text-foreground">{result.digitalCertificateId}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-2xs border-t border-border/50 pt-2">
              <span className="text-slate-500">Ledger Inscription Time:</span>
              <span className="font-mono text-slate-500">{new Date(result.ledgerTimestamp).toLocaleString()}</span>
            </div>

            {/* Backend-Supplied SHA-256 Digest */}
            <div className="border-t border-border/50 pt-2.5 space-y-1">
              <span className="text-2xs text-slate-500 block">
                Backend-Supplied Cryptographic Proof Digest:
              </span>
              <div className="p-2 rounded bg-surface-muted font-mono text-2xs text-slate-600 dark:text-slate-300 break-all flex items-start gap-1">
                <Hash size={11} className="shrink-0 mt-0.5" />
                <span>{result.cryptographicProof}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Public Citizen Advisory Notice */}
        <div
          className={`p-3.5 rounded border text-2xs leading-relaxed ${
            isAuthenticAndCompliant
              ? 'bg-compliant-surface text-compliant-foreground border-compliant-border'
              : 'bg-violation-surface text-violation-foreground border-violation-border'
          }`}
        >
          {isAuthenticAndCompliant ? (
            <p>
              <strong>Consumer Notice:</strong> This product lot is authenticated by the National Regulatory Electronic Registry. Packaging declarations conform to metric and statutory standards.
            </p>
          ) : (
            <p>
              <strong>Consumer Warning:</strong> This product lot has been flagged for statutory non-compliance under Legal Metrology Rules. If purchased, please retain receipt and contact customer grievance or your regional Legal Metrology enforcement wing.
            </p>
          )}
        </div>

        {/* Privacy Enforcement Notice (Explicitly confirms no private inspector information) */}
        <div className="text-[11px] text-slate-400 font-mono text-center border-t border-border/40 pt-2">
          Statutory Privacy Guard: Confidential inspector logs and enforcement officer credentials are restricted to authorized regulatory sessions and redacted from public verification.
        </div>
      </CardContent>

      <CardFooter className="p-3 bg-surface-muted/50 border-t border-border flex justify-between items-center">
        <span className="text-2xs font-mono text-slate-400">
          Ref: {batch.id}
        </span>
        <Button size="sm" variant="outline" className="text-2xs h-7" onClick={handleShare}>
          {copied ? <Check size={12} className="mr-1 text-compliant" /> : <Share2 size={12} className="mr-1" />}
          {copied ? 'Link Copied' : 'Share Verification Record'}
        </Button>
      </CardFooter>
    </Card>
  );
};
