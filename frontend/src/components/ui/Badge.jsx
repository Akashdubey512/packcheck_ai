import React from "react";

/**
 * Generic Badge component for tag labels, metadata pills, and counts.
 */
export default function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}) {
  const variants = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    navy: "bg-slate-900 text-slate-100 border-slate-900",
    subtle: "bg-slate-50 text-slate-600 border-slate-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    danger: "bg-rose-50 text-rose-800 border-rose-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-1 font-medium",
    lg: "text-sm px-3 py-1 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center rounded border ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
}
