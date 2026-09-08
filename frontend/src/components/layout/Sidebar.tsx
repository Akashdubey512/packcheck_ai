import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ScanLine,
  History,
  FileCheck2,
  FileText,
  Settings,
  HelpCircle,
  ExternalLink,
  Shield,
  X,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { butterSpring, gpuAcceleratedStyle } from '@/animations/motion';

interface NavItem {
  name: string;
  to: string;
  icon: React.ElementType;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Scan & Ingest', to: ROUTES.SCAN, icon: ScanLine },
  { name: 'Audit History', to: ROUTES.HISTORY, icon: History },
  { name: 'Batch Verification', to: ROUTES.VERIFY, icon: FileCheck2 },
  { name: 'Regulatory Reports', to: ROUTES.REPORTS, icon: FileText },
  { name: 'System Settings', to: ROUTES.SETTINGS, icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { canAccess, role } = useAuth();
  const location = useLocation();

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Filter modules permitted for the active role
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => canAccess(item.to));

  const navContent = (
    <>
      {/* Primary Navigation */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Authorized Modules</span>
          <span className="font-mono text-primary text-[10px] uppercase">[{role.slice(0, 5)}]</span>
        </div>
        <nav className="space-y-1" aria-label="Main Navigation">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                }}
                className="relative block rounded text-xs font-medium outline-none select-none"
              >
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'relative z-10 flex items-center gap-2.5 px-3 py-2 rounded transition-colors',
                    isActive
                      ? 'text-white dark:text-sky-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-surface-muted/40'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      transition={butterSpring}
                      style={gpuAcceleratedStyle}
                      className="absolute inset-0 bg-institutional-900 dark:bg-sky-500/20 rounded border border-transparent dark:border-sky-500/30 shadow-subtle -z-10"
                    />
                  )}
                  <Icon size={16} className="shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                </motion.div>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Institutional Metadata & Footer Information */}
      <div className="p-3 border-t border-border space-y-2 bg-surface-subtle/50 text-2xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span className="font-mono flex items-center gap-1">
            <Shield size={12} className="text-compliant" aria-hidden="true" />
            ROLE-BASED ACCESS
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <p className="leading-tight text-[11px]">
          Session authorized under Legal Metrology &amp; Packaging Compliance Platform.
        </p>
        <div className="pt-1 flex items-center justify-between text-slate-400 dark:text-slate-500 hover:text-foreground">
          <span className="flex items-center gap-1">
            <HelpCircle size={12} aria-hidden="true" /> Compliance Manual
          </span>
          <ExternalLink size={10} aria-hidden="true" />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className="hidden md:flex w-60 border-r border-border bg-surface text-foreground flex-col justify-between shrink-0 select-none min-h-[calc(100vh-3.5rem)]"
        aria-label="Desktop Navigation Sidebar"
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop & Slide-over Panel */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
              onClick={onCloseMobile}
              aria-hidden="true"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={butterSpring}
              style={gpuAcceleratedStyle}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col justify-between select-none shadow-2xl md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Menu"
            >
              <div className="flex items-center justify-between p-3 border-b border-border bg-surface-muted/50">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Navigation Menu
                </span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close navigation menu"
                  className="p-1 rounded text-slate-400 hover:text-foreground hover:bg-surface-muted"
                >
                  <X size={18} />
                </button>
              </div>
              {navContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
