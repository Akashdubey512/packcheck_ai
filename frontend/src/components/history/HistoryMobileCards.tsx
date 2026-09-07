import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { HistoryItem } from '@/types/history';
import { buildRoute } from '@/constants/routes';
import { formatGTIN } from '@/utils/formatters';
import { ExternalLink, Calendar, User } from 'lucide-react';

interface HistoryMobileCardsProps {
  items: HistoryItem[];
  loading?: boolean;
}

export const HistoryMobileCards: React.FC<HistoryMobileCardsProps> = ({ items, loading = false }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="md:hidden py-10 text-center text-xs text-slate-500 font-mono">
        Loading historical records...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="md:hidden py-10 text-center text-xs text-slate-500">
        No matching historical audit records found.
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="border border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <StatusBadge status={item.status} size="sm" />
              <span className="text-2xs font-mono text-slate-400">{item.scanId}</span>
            </div>
            <CardTitle className="text-sm mt-1.5">{item.productName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs pt-0">
            <div className="flex justify-between py-1 border-b border-border/50 text-2xs">
              <span className="text-slate-500">GTIN:</span>
              <span className="font-mono font-semibold">{formatGTIN(item.gtin)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50 text-2xs">
              <span className="text-slate-500">Compliance Score:</span>
              <span className="font-mono font-bold text-primary">{item.complianceScore.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50 text-2xs">
              <span className="text-slate-500 flex items-center gap-1"><User size={11} /> Auditor:</span>
              <span className="text-slate-600 dark:text-slate-400">{item.scannedBy}</span>
            </div>
            <div className="flex justify-between py-1 text-2xs">
              <span className="text-slate-500 flex items-center gap-1"><Calendar size={11} /> Timestamp:</span>
              <span className="font-mono text-slate-500">{new Date(item.timestamp).toLocaleString()}</span>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => navigate(buildRoute.scanDetail(item.scanId))}
            >
              <ExternalLink size={12} className="mr-1" /> View Full Inspection Result
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
