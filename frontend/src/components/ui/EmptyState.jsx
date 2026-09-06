import React from "react";
import { FileQuestion } from "lucide-react";

export default function EmptyState({
  title = "No records found",
  description = "No items match your criteria or no scans have been performed yet.",
  icon: Icon = FileQuestion,
  action,
  className = "",
}) {
  return (
    <div
      className={`p-8 text-center bg-white border border-slate-200 border-dashed rounded-md space-y-3 ${className}`}
    >
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-slate-100 text-slate-500 mx-auto">
        <Icon className="w-5 h-5" />
      </div>

      <div className="space-y-1 max-w-sm mx-auto">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        {description && (
          <p className="text-xs text-slate-500 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
