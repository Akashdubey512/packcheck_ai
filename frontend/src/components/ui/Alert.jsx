import React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export default function Alert({
  type = "info",
  title,
  children,
  className = "",
}) {
  const configs = {
    info: {
      bg: "bg-slate-50 border-slate-300 text-slate-800",
      icon: Info,
      iconColor: "text-slate-600",
    },
    success: {
      bg: "bg-emerald-50 border-emerald-300 text-emerald-900",
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
    },
    warning: {
      bg: "bg-amber-50 border-amber-300 text-amber-900",
      icon: AlertTriangle,
      iconColor: "text-amber-600",
    },
    error: {
      bg: "bg-rose-50 border-rose-300 text-rose-900",
      icon: AlertCircle,
      iconColor: "text-rose-600",
    },
  };

  const config = configs[type] || configs.info;
  const IconComponent = config.icon;

  return (
    <div
      className={`p-4 rounded-md border text-sm flex gap-3 ${config.bg} ${className}`}
      role="alert"
    >
      <IconComponent className={`w-5 h-5 ${config.iconColor} shrink-0 mt-0.5`} />
      <div className="space-y-1">
        {title && <h4 className="font-semibold leading-tight">{title}</h4>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}
