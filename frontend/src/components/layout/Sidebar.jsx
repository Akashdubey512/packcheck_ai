import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  ScanLine,
  History,
  LayoutDashboard,
  User,
  Scale,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * NIRIKSHAN Left Sidebar Navigation
 * Enforcement-oriented workstation navigation for Legal Metrology compliance.
 * Strictly neutral authentication/account placeholder — no fake names or roles.
 */
export default function Sidebar({ onNavClick, className = "" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Navigation route matching
  const isNewScanActive = location.pathname === "/" || location.pathname === "";
  const isScanHistoryActive =
    location.pathname === "/dashboard" &&
    (location.search.includes("tab=history") ||
      location.search.includes("view=history") ||
      location.hash === "#history");
  const isDashboardActive =
    location.pathname === "/dashboard" && !isScanHistoryActive;

  const navItems = [
    {
      label: "New Scan",
      path: "/",
      icon: ScanLine,
      active: isNewScanActive,
      badge: null,
    },
    {
      label: "Scan History",
      path: "/dashboard?tab=history",
      icon: History,
      active: isScanHistoryActive,
      badge: null,
    },
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      active: isDashboardActive,
      badge: null,
    },
  ];

  return (
    <div className={`flex flex-col h-full bg-slate-950 text-slate-200 select-none ${className}`}>
      {/* Top Branding Section */}
      <div className="px-5 py-5 border-b border-slate-800/90">
        <Link
          to="/"
          onClick={onNavClick}
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-sm"
          aria-label="NIRIKSHAN home"
        >
          <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0 group-hover:border-slate-600 transition-colors">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base tracking-wider text-white">
                NIRIKSHAN
              </span>
              <span className="text-[10px] font-mono font-semibold bg-slate-800 text-slate-400 px-1 py-0.2 rounded border border-slate-700">
                v1.0
              </span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-0.5">
              LEGAL METROLOGY
            </p>
          </div>
        </Link>
      </div>

      {/* Primary Navigation Section */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div>
          <div className="px-3 pb-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Workstation
          </div>
          <nav aria-label="Primary navigation">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      to={item.path}
                      onClick={onNavClick}
                      aria-current={item.active ? "page" : undefined}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-sm text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 ${
                        item.active
                          ? "bg-slate-800/90 text-white font-semibold border-l-2 border-emerald-400 pl-2.5"
                          : "border-l-2 border-transparent text-slate-300 hover:text-white hover:bg-slate-900/80"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            item.active ? "text-emerald-400" : "text-slate-400"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Regulatory Scope Context Box */}
        <div className="p-3 rounded bg-slate-900/70 border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
            <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="tracking-wide uppercase">Statutory Scope</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
            Legal Metrology (Packaged Commodities) Rules, 2011 — Declaration verification and compliance assessment
          </p>
        </div>
      </div>

      {/* Bottom Sidebar Area — Authenticated Officer Account & Logout */}
      <div className="p-3 border-t border-slate-800/80 mt-auto bg-slate-950">
        <div className="flex items-center justify-between px-3 py-2 rounded text-xs font-medium bg-slate-900/60 border border-slate-800 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span
              className="truncate text-slate-200 font-medium"
              title={user?.name || user?.email || "Officer Account"}
            >
              {user?.name || "Officer"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out of session"
            aria-label="Log out of session"
            className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-rose-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400 rounded px-1.5 py-0.5 shrink-0 select-none"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
