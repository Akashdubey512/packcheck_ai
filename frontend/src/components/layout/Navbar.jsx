import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Upload, LayoutDashboard, User } from "lucide-react";

/**
 * NIRIKSHAN Reusable Navigation Bar Header
 * Strictly unauthenticated / neutral profile slot — no fake officer names or IDs.
 */
export default function Navbar({ userSlot, className = "" }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { label: "New Scan", path: "/", icon: Upload },
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <header className={`bg-slate-900 text-white border-b border-slate-800 shadow-md ${className}`}>
      {/* Top micro-bar: Government of India / Enforcement context */}
      <div className="bg-slate-950 text-slate-400 text-[11px] font-mono px-6 py-1 border-b border-slate-900 flex justify-between items-center tracking-wider">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>LEGAL METROLOGY (PACKAGED COMMODITIES) COMPLIANCE SYSTEM</span>
        </div>
        <div className="hidden sm:block text-slate-500">
          INDIAN ENFORCEMENT PORTAL
        </div>
      </div>

      {/* Main navigation container */}
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Brand logo & tagline */}
        <Link to="/" className="flex items-center gap-3 group focus-visible:ring-offset-slate-900 rounded-sm">
          <div className="w-9 h-9 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:border-slate-600 transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider text-white font-mono leading-none">
                NIRIKSHAN
              </span>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans tracking-tight mt-0.5 hidden sm:block">
              Compliance Intelligence for Packaged Commodities
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors focus-visible:ring-offset-slate-900 ${
                  active
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile / Auth slot (Neutral placeholder) */}
        <div className="flex items-center gap-3">
          {userSlot || (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs text-slate-400">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <span className="hidden md:inline font-mono text-[11px] text-slate-400">
                Officer Portal
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
