import React from "react";

export function Table({ children, className = "", ...props }) {
  return (
    <div className="w-full overflow-x-auto border border-slate-200 rounded-md bg-white shadow-subtle">
      <table className={`w-full text-left border-collapse text-xs md:text-sm ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = "", ...props }) {
  return (
    <thead className={`bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px] ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "", ...props }) {
  return (
    <tbody className={`divide-y divide-slate-200 text-slate-800 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "", hover = true, ...props }) {
  return (
    <tr
      className={`${hover ? "hover:bg-slate-50/80 transition-colors" : ""} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({ children, className = "", ...props }) {
  return (
    <th className={`px-4 py-3 font-semibold ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "", tabular = false, ...props }) {
  return (
    <td className={`px-4 py-3 align-middle ${tabular ? "tabular-nums" : ""} ${className}`} {...props}>
      {children}
    </td>
  );
}
