import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Reusable Button Primitive for NIRIKSHAN
 * Variants: primary | secondary | outline | danger | ghost
 * Sizes: sm | md | lg
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  type = "button",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-subtle border border-slate-900",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 border border-slate-200",
    outline: "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-300 active:bg-slate-200",
    danger: "bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 shadow-subtle border border-rose-700",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 border border-transparent",
  };

  const sizes = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-sm px-3.5 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2.5",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
