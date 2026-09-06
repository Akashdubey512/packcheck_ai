import React from "react";

export default function Input({
  label,
  id,
  type = "text",
  error,
  helperText,
  icon: Icon,
  className = "",
  containerClassName = "",
  required = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          {label}
          {required && <span className="text-rose-600 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative rounded-md shadow-subtle">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          className={`block w-full text-sm rounded-md border bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 transition duration-150 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 ${
            Icon ? "pl-9" : ""
          } ${
            error
              ? "border-rose-400 text-rose-900 focus:ring-rose-600 focus:border-rose-600"
              : "border-slate-300"
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
