import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QrCode, Copy, Check, Download, ExternalLink } from 'lucide-react';

interface QRVerificationCardProps {
  batchId: string;
  qrUrl?: string; // Backend-provided QR image URL (takes precedence over demo SVG generation)
  verificationUrl?: string; // Backend-provided verification URL
  onOpenPublicVerification?: () => void;
}

export const QRVerificationCard: React.FC<QRVerificationCardProps> = ({
  batchId,
  qrUrl,
  verificationUrl,
  onOpenPublicVerification,
}) => {
  const [copied, setCopied] = useState(false);
  const verifyUrl = verificationUrl || `${window.location.origin}/verify/${batchId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(verifyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadQR = () => {
    if (qrUrl) {
      // Backend-supplied QR URL: trigger direct download/save
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = `compliance_qr_${batchId}.png`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      return;
    }

    // Demo SVG fallback download
    const svgElement = document.getElementById(`qr-svg-${batchId}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compliance_qr_${batchId}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border border-border text-center overflow-hidden">
      <CardHeader className="pb-2 border-b border-border bg-surface-muted/40">
        <div className="mx-auto p-2 rounded-full bg-surface text-primary w-fit border border-border">
          <QrCode size={20} />
        </div>
        <CardTitle className="text-sm mt-1">Batch QR Verification Code</CardTitle>
        <CardDescription className="text-2xs font-mono">
          LOT: {batchId}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 flex flex-col items-center justify-center space-y-3">
        {/* If backend-supplied QR image URL is available, render image directly; otherwise fallback to vector SVG */}
        {qrUrl ? (
          <div className="p-2 bg-white rounded-lg border-2 border-slate-900 shadow-sm w-48 h-48 flex items-center justify-center">
            <img
              src={qrUrl}
              alt={`Batch ${batchId} Verification QR Code`}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="p-3 bg-white rounded-lg border-2 border-slate-900 shadow-sm w-48 h-48 flex items-center justify-center">
            {/* Demo Fallback Vector QR Code Pattern */}
            <svg
              id={`qr-svg-${batchId}`}
              viewBox="0 0 100 100"
              width="100%"
              height="100%"
              className="shape-rendering-crispEdges"
            >
              {/* Standard QR Corner Markers */}
              <rect x="5" y="5" width="26" height="26" fill="#0f172a" />
              <rect x="8" y="8" width="20" height="20" fill="#ffffff" />
              <rect x="11" y="11" width="14" height="14" fill="#0f172a" />

              <rect x="69" y="5" width="26" height="26" fill="#0f172a" />
              <rect x="72" y="8" width="20" height="20" fill="#ffffff" />
              <rect x="75" y="11" width="14" height="14" fill="#0f172a" />

              <rect x="5" y="69" width="26" height="26" fill="#0f172a" />
              <rect x="8" y="72" width="20" height="20" fill="#ffffff" />
              <rect x="11" y="75" width="14" height="14" fill="#0f172a" />

              {/* Simulated Data Matrix Modules */}
              <rect x="36" y="8" width="6" height="6" fill="#0f172a" />
              <rect x="46" y="8" width="6" height="6" fill="#0f172a" />
              <rect x="56" y="8" width="6" height="6" fill="#0f172a" />

              <rect x="36" y="20" width="6" height="6" fill="#0f172a" />
              <rect x="50" y="20" width="6" height="6" fill="#0f172a" />

              <rect x="8" y="38" width="6" height="6" fill="#0f172a" />
              <rect x="20" y="38" width="6" height="6" fill="#0f172a" />
              <rect x="36" y="36" width="12" height="12" fill="#0f172a" />
              <rect x="54" y="38" width="6" height="6" fill="#0f172a" />
              <rect x="68" y="38" width="6" height="6" fill="#0f172a" />
              <rect x="80" y="38" width="6" height="6" fill="#0f172a" />

              <rect x="36" y="52" width="6" height="6" fill="#0f172a" />
              <rect x="48" y="52" width="14" height="6" fill="#0f172a" />
              <rect x="68" y="52" width="6" height="6" fill="#0f172a" />

              <rect x="36" y="68" width="6" height="6" fill="#0f172a" />
              <rect x="48" y="68" width="6" height="6" fill="#0f172a" />
              <rect x="60" y="68" width="14" height="6" fill="#0f172a" />
              <rect x="80" y="68" width="6" height="6" fill="#0f172a" />

              <rect x="36" y="82" width="14" height="6" fill="#0f172a" />
              <rect x="56" y="82" width="6" height="6" fill="#0f172a" />
              <rect x="68" y="82" width="14" height="6" fill="#0f172a" />
            </svg>
          </div>
        )}

        <p className="text-2xs text-slate-500 max-w-xs leading-relaxed">
          Public verification link embedded for instant statutory cross-reference against national compliance registry.
        </p>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-center gap-2 p-3 border-t border-border bg-surface-muted/50">
        <Button size="sm" variant="outline" className="text-2xs h-7" onClick={handleCopy}>
          {copied ? <Check size={12} className="mr-1 text-compliant" /> : <Copy size={12} className="mr-1" />}
          {copied ? 'Copied' : 'Copy Link'}
        </Button>
        <Button size="sm" variant="outline" className="text-2xs h-7" onClick={handleDownloadQR}>
          <Download size={12} className="mr-1" /> {qrUrl ? 'Save QR' : 'Save QR SVG'}
        </Button>
        {onOpenPublicVerification && (
          <Button size="sm" variant="primary" className="text-2xs h-7" onClick={onOpenPublicVerification}>
            <ExternalLink size={12} className="mr-1" /> Open Public View
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
