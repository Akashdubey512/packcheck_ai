import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans ambient-glow-bg">
      {/* Skip to Main Content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-primary focus:text-white focus:rounded focus:shadow-md text-xs font-semibold"
      >
        Skip to main content
      </a>

      <Header
        onToggleMobileMenu={isLandingPage ? undefined : () => setMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={mobileMenuOpen}
        isLandingPage={isLandingPage}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {!isLandingPage && (
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 overflow-y-auto bg-background outline-none ${
            isLandingPage ? 'w-full' : ''
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

