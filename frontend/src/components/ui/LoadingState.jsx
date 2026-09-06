import React from "react";
import { Loader2, Scan } from "lucide-react";

export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded-sm ${className}`}
    />
  );
}

export function ScanLoadingState({ message = "Analyzing label image against Legal Metrology Rules, 2011..." }) {
  return (
    <div className="p-8 text-center bg-white border border-slate-200 rounded-md shadow-card space-y-4">
      <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-md bg-slate-900 text-white mx-auto">
        <Scan className="w-6 h-6 animate-pulse" />
        <Loader2 className="w-8 h-8 animate-spin absolute text-slate-300 -inset-1 m-auto" />
      </div>

      <div className="space-y-1 max-w-sm mx-auto">
        <h4 className="text-sm font-bold text-slate-900">OCR & Rule Engine Active</h4>
        <p className="text-xs text-slate-500">{message}</p>
      </div>

      <div className="max-w-md mx-auto space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5 mx-auto" />
        <Skeleton className="h-3 w-2/3 mx-auto" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <Skeleton
              key={cIdx}
              className={`h-4 ${cIdx === 0 ? "w-1/3" : "w-1/6"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
