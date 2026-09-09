import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, ShieldCheck, X } from 'lucide-react';
import { butterSpring, gpuAcceleratedStyle } from '@/animations/motion';

interface GenerateReportModalProps {
  onGenerate: (title: string, scanId: string) => Promise<void>;
  onClose: () => void;
}

export const GenerateReportModal: React.FC<GenerateReportModalProps> = ({ onGenerate, onClose }) => {
  const [title, setTitle] = useState('');
  const [scanId, setScanId] = useState('');
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

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={butterSpring}
        style={gpuAcceleratedStyle}
        className="max-w-md w-full relative z-10"
      >
        <Card className="w-full bg-surface border border-border shadow-modal">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-surface-muted text-primary border border-border">
                <FileText size={18} />
              </div>
              <div>
                <CardTitle className="text-sm">Issue Compliance Report</CardTitle>
                <CardDescription className="text-2xs">Request backend-generated inspection report</CardDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-foreground hover:bg-surface-muted transition-colors"
            >
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
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface-subtle text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Source Inspection Reference
                </label>
                <input
                  type="text"
                  value={scanId}
                  onChange={(e) => setScanId(e.target.value)}
                  required
                  placeholder="e.g. INSP_MTUGKQCA_E2F1D7"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface-subtle text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all font-mono"
                />
                <p className="mt-1 text-2xs text-slate-500">Paste the Inspection ID from Audit History or Scan Result page</p>
              </div>

              <div className="p-3 rounded-lg bg-surface-muted border border-border text-2xs space-y-1 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1 font-semibold text-foreground">
                  <ShieldCheck size={13} className="text-primary" />
                  Backend Verification Notice
                </div>
                <p>
                  Compliance reports reflect backend-evaluated rule checks and backend-supplied cryptographic audit ledger signatures.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2 p-3 border-t border-border bg-surface-muted/50 rounded-b-lg">
              <Button type="button" size="sm" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary" isLoading={isSubmitting}>
                Compile &amp; Issue Report
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

