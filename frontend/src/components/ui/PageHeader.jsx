import React from "react";
import { Shield } from "lucide-react";

export default function PageHeader({
  title,
  subtitle,
  category = "LEGAL METROLOGY INSPECTION",
  actions,
  className = "",
}) {
  return (
    <div
      className={`border-b border-slate-200 bg-white px-6 py-5 shadow-subtle ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {category && (
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mb-1">
              <Shield className="w-3.5 h-3.5 text-slate-700" />
              <span>{category}</span>
            </div>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
