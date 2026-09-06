import React from "react";
import { CheckCircle2, AlertOctagon, Clock, AlertTriangle, XCircle, Check } from "lucide-react";

/**
 * Official Legal Metrology Enforcement Status Badge
 * Handles COMPLIANT | NON_COMPLIANT | PENDING | WARNING | FOUND | MISSING
 */
export default function StatusBadge({ status, size = "md", className = "" }) {
  const normalized = (status || "").toUpperCase();

  const configs = {
    COMPLIANT: {
      label: "COMPLIANT",
      bg: "bg-emerald-50 text-emerald-800 border-emerald-300",
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
    },
    NON_COMPLIANT: {
      label: "NON-COMPLIANT",
      bg: "bg-rose-50 text-rose-800 border-rose-300",
      icon: AlertOctagon,
      iconColor: "text-rose-600",
    },
    PENDING: {
      label: "PENDING",
      bg: "bg-slate-100 text-slate-700 border-slate-300",
      icon: Clock,
      iconColor: "text-slate-500",
    },
    WARNING: {
      label: "ATTENTION",
      bg: "bg-amber-50 text-amber-800 border-amber-300",
      icon: AlertTriangle,
      iconColor: "text-amber-600",
    },
    FOUND: {
      label: "FOUND",
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: Check,
      iconColor: "text-emerald-600",
    },
    MISSING: {
      label: "MISSING",
      bg: "bg-rose-50 text-rose-800 border-rose-200",
      icon: XCircle,
      iconColor: "text-rose-600",
    },
  };

  const config = configs[normalized] || {
    label: status || "UNKNOWN",
    bg: "bg-slate-100 text-slate-700 border-slate-300",
    icon: Clock,
    iconColor: "text-slate-500",
  };

  const IconComponent = config.icon;

  const sizes = {
    sm: "text-xs px-2 py-0.5 gap-1 font-semibold tracking-wide",
    md: "text-xs px-2.5 py-1 gap-1.5 font-bold tracking-wider",
    lg: "text-sm px-3.5 py-1.5 gap-2 font-bold tracking-widest",
  };

  return (
    <span
      className={`inline-flex items-center rounded-sm border uppercase font-mono ${config.bg} ${sizes[size] || sizes.md} ${className}`}
    >
      <IconComponent className={`w-3.5 h-3.5 ${config.iconColor} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
}
