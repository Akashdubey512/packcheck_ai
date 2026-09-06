import React from "react";

export default function SectionHeader({
  title,
  subtitle,
  badge,
  actions,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2 ${className}`}
    >
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
