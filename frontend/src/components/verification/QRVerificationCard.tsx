import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QrCode, Copy, Check, Download, ExternalLink } from 'lucide-react';

interface QRVerificationCardProps {
  batchId: string;
  qrUrl?: string; // Backend-provided QR image URL (takes precedence if available)
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

    // Export real, mathematically valid vector SVG QR code
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
        {/* Real Scannable QR Code */}
        {qrUrl ? (
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs w-48 h-48 flex items-center justify-center">
            <img
              src={qrUrl}
              alt={`Batch ${batchId} Verification QR Code`}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs w-48 h-48 flex items-center justify-center">
            <QRCodeSVG
              id={`qr-svg-${batchId}`}
              value={verifyUrl}
              size={164}
              level="M"
              includeMargin={false}
              fgColor="#0f172a"
              bgColor="#ffffff"
            />
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
