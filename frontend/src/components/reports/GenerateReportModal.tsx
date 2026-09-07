import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, ShieldCheck, X } from 'lucide-react';

interface GenerateReportModalProps {
  onGenerate: (title: string, scanId: string) => Promise<void>;
  onClose: () => void;
}

export const GenerateReportModal: React.FC<GenerateReportModalProps> = ({ onGenerate, onClose }) => {
  const [title, setTitle] = useState('Fortified Multi-Grain Flakes Packaging Compliance Report');
  const [scanId, setScanId] = useState('scn_sample_cereal_violations');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onGenerate(title, scanId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-surface border border-border shadow-modal">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-surface-muted text-primary">
              <FileText size={18} />
            </div>
            <div>
              <CardTitle className="text-sm">Issue Compliance Report</CardTitle>
              <CardDescription className="text-2xs">Request backend-generated inspection report</CardDescription>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-foreground">
            <X size={16} />
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Report Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded border border-border bg-surface-subtle text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Source Inspection Reference
              </label>
              <select
                value={scanId}
                onChange={(e) => setScanId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-border bg-surface-subtle text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="scn_sample_cereal_violations">
                  Apex Fortified Cereal (Violations Detected) - scn_sample_cereal_violations
                </option>
                <option value="scn_sample_dairy_compliant">
                  Apex Pasteurized Milk (Compliant) - scn_sample_dairy_compliant
                </option>
                <option value="scn_sample_tea_review">
                  Botanical Green Tea (Review Required) - scn_sample_tea_review
                </option>
              </select>
            </div>

            <div className="p-3 rounded bg-surface-muted border border-border text-2xs space-y-1 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1 font-semibold text-foreground">
                <ShieldCheck size={12} className="text-primary" />
                Backend Verification Notice
              </div>
              <p>
                Compliance reports reflect backend-evaluated rule checks and backend-supplied cryptographic audit ledger signatures.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 p-3 border-t border-border bg-surface-muted/50">
            <Button type="button" size="sm" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" variant="primary" isLoading={isSubmitting}>
              Compile &amp; Issue Report
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
