import React from "react";

export default function Select({
  label,
  id,
  options = [],
  error,
  helperText,
  className = "",
  containerClassName = "",
  required = false,
  children,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          {label}
          {required && <span className="text-rose-600 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative rounded-md shadow-subtle">
        <select
          id={selectId}
          className={`block w-full text-sm rounded-md border bg-white px-3 py-2 text-slate-900 transition duration-150 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 ${
            error
              ? "border-rose-400 text-rose-900 focus:ring-rose-600 focus:border-rose-600"
              : "border-slate-300"
          } ${className}`}
          {...props}
        >
          {children ||
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
        </select>
      </div>

      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
