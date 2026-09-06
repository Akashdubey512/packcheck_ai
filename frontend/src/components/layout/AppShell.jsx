import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";

/**
 * NIRIKSHAN Persistent Application Shell
 * Desktop: Persistent left sidebar workstation navigation with compact top bar.
 * Mobile/Tablet: Collapsible slide-over drawer with backdrop and touch/keyboard accessibility.
 * Main Area: Standard comfortable width container without duplicate shell titles.
 */
export default function AppShell({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Accessible skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3.5 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-emerald-400 text-xs font-mono font-semibold shadow-lg"
      >
        Skip to main content
      </a>

      {/* Desktop Persistent Left Sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-slate-950 text-white border-r border-slate-800 sticky top-0 h-screen overflow-y-auto"
        aria-label="Enforcement Workstation Sidebar"
      >
        <Sidebar />
      </aside>

      {/* Mobile/Tablet Drawer & Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-950 text-white transform transition-transform duration-200 ease-in-out lg:hidden flex flex-col shadow-2xl ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
      >
        <div className="flex justify-end p-2 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar onNavClick={() => setMobileMenuOpen(false)} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
        <TopBar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          isMobileMenuOpen={mobileMenuOpen}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
