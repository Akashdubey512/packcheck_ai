import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { HistoryItem } from '@/types/history';
import { buildRoute } from '@/constants/routes';
import { formatGTIN } from '@/utils/formatters';
import { ExternalLink } from 'lucide-react';

interface HistoryTableProps {
  items: HistoryItem[];
  loading?: boolean;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ items, loading = false }) => {
  const navigate = useNavigate();

  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Inspection ID</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>GTIN / Barcode</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Auditor / Inspector</TableHead>
            <TableHead>Date / Timestamp</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-10 text-slate-500 font-mono">
                Loading packaging inspection records...
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-10 text-slate-500">
                No matching historical audit records found for current criteria.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-2xs font-semibold text-foreground">
                  {item.scanId}
                </TableCell>
                <TableCell className="font-medium text-foreground max-w-xs truncate">
                  {item.productName}
                </TableCell>
                <TableCell className="font-mono text-2xs text-slate-600 dark:text-slate-300">
                  {formatGTIN(item.gtin)}
                </TableCell>
                <TableCell className="text-2xs text-slate-500">
                  {item.category}
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status} size="sm" />
                </TableCell>
                <TableCell>
                  <span
                    className={`font-mono font-bold text-2xs px-2 py-0.5 rounded border ${
                      item.status === 'compliant'
                        ? 'bg-compliant-surface text-compliant-foreground border-compliant-border'
                        : item.status === 'violation'
                        ? 'bg-violation-surface text-violation-foreground border-violation-border'
                        : 'bg-review-surface text-review-foreground border-review-border'
                    }`}
                  >
                    {item.complianceScore.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-2xs text-slate-600 dark:text-slate-400">
                  {item.scannedBy}
                </TableCell>
                <TableCell className="text-2xs text-slate-500 font-mono whitespace-nowrap">
                  {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-2xs h-7"
                    onClick={() => navigate(buildRoute.scanDetail(item.scanId))}
                  >
                    <ExternalLink size={11} className="mr-1" /> Inspect Result
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
