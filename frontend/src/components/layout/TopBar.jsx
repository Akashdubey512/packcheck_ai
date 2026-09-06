import React from "react";
import { Menu, ShieldCheck } from "lucide-react";

/**
 * NIRIKSHAN Compact Workstation TopBar
 * Compact, persistent header that avoids duplicating individual page titles.
 * Provides system status context and mobile drawer toggle.
 */
export default function TopBar({
  onOpenMobileMenu,
  isMobileMenuOpen = false,
  className = "",
}) {
  return (
    <header
      className={`h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-subtle shrink-0 ${className}`}
    >
      {/* Mobile Toggle & Brand Indicator */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-sidebar"
          aria-label="Open navigation menu"
          className="p-2 -ml-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-bold text-sm tracking-wider text-slate-900">
            NIRIKSHAN
          </span>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
            v1.0
          </span>
        </div>
      </div>

      {/* Desktop Statutory / System Context (No duplicate page title) */}
      <div className="hidden lg:flex items-center gap-2.5 text-xs font-mono">
        <span
          className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
          aria-hidden="true"
          title="Engine Active"
        />
        <span className="font-semibold tracking-wide text-slate-800">
          LEGAL METROLOGY · PACKAGED COMMODITIES
        </span>
      </div>

      {/* Right Side: Framework Standard Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
          <span className="text-slate-400 font-sans hidden sm:inline">Statute:</span>
          <span className="font-semibold text-slate-700">PCR, 2011</span>
        </div>
      </div>
    </header>
  );
}
