import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Sun,
  Moon,
  Laptop,
  Bell,
  UserCheck,
  ChevronDown,
  LogOut,
  LogIn,
  Menu,
  X,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { env } from '@/app/config/env';
import { Role, ROLE_DEFINITIONS } from '@/types/user';
import { ROUTES } from '@/constants/routes';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, isMobileMenuOpen = false }) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, role, switchRole, logout, isAuthenticated } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roleDef = ROLE_DEFINITIONS[role];

  return (
    <header className="h-14 border-b border-border bg-surface text-foreground flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 select-none">
      {/* Left: Mobile Menu Toggle & Brand Identification */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileMenuOpen}
            className="p-1.5 rounded text-slate-500 hover:text-foreground hover:bg-surface-muted transition-colors md:hidden"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        <div
          onClick={() => navigate(ROUTES.HOME)}
          className="h-8 w-8 rounded bg-institutional-900 dark:bg-sky-500/20 text-white dark:text-sky-400 flex items-center justify-center border border-institutional-800 dark:border-sky-500/30 cursor-pointer shrink-0"
        >
          <ShieldCheck size={18} strokeWidth={2.2} />
        </div>

        <div className="flex flex-col cursor-pointer" onClick={() => navigate(ROUTES.HOME)}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-institutional-900 dark:text-sky-400 truncate max-w-[150px] sm:max-w-none">
              Regulatory Compliance Platform
            </span>
            {env.VITE_DEMO_MODE ? (
              <span className="text-[10px] font-semibold px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 uppercase">
                Demo
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 uppercase">
                Live
              </span>
            )}
          </div>
          <span className="hidden sm:inline text-2xs text-slate-500 dark:text-slate-400 font-mono">
            SEC-SYS // AUT-VER: 2026.09.2
          </span>
        </div>
      </div>

      {/* Right: Utilities, Theme & Role-Aware Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Interactive Role Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-2xs font-mono font-bold uppercase border transition-colors ${roleDef.badgeClass}`}
            title="Click to switch test user role"
            aria-label={`Current Role: ${roleDef.title}. Click to switch.`}
            aria-expanded={showRoleDropdown}
          >
            <UserCheck size={12} />
            <span className="hidden sm:inline">{roleDef.title}</span>
            <span className="sm:hidden">{role.slice(0, 3)}</span>
            <ChevronDown size={11} className="opacity-70" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-1 w-64 rounded bg-surface border border-border shadow-modal p-1 z-50 text-xs text-foreground space-y-0.5">
              <div className="px-2 py-1 text-2xs font-semibold text-slate-400 uppercase tracking-wider">
                Select Active User Role
              </div>
              {(Object.keys(ROLE_DEFINITIONS) as Role[]).map((rKey) => {
                const rItem = ROLE_DEFINITIONS[rKey];
                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => {
                      switchRole(rKey);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex flex-col transition-colors ${
                      role === rKey ? 'bg-surface-muted font-bold text-primary' : 'hover:bg-surface-muted/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{rItem.title}</span>
                      {role === rKey && <span className="text-2xs text-primary font-mono font-normal">Active</span>}
                    </div>
                    <span className="text-2xs text-slate-500 font-normal line-clamp-1">{rItem.description}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* System Notification Bell */}
        <button
          type="button"
          aria-label="System Notifications"
          className="p-1.5 rounded text-slate-500 hover:text-foreground hover:bg-surface-muted transition-colors"
        >
          <Bell size={15} />
        </button>

        {/* Theme Mode Selector */}
        <div className="flex items-center border border-border rounded bg-surface-muted p-0.5 text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setTheme('light')}
            title="Light theme"
            aria-label="Light theme"
            className={`p-1 rounded ${theme === 'light' ? 'bg-surface text-foreground shadow-subtle' : 'hover:text-foreground'}`}
          >
            <Sun size={13} />
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            title="Dark theme"
            aria-label="Dark theme"
            className={`p-1 rounded ${theme === 'dark' ? 'bg-surface text-foreground shadow-subtle' : 'hover:text-foreground'}`}
          >
            <Moon size={13} />
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            title="System theme"
            aria-label="System theme"
            className={`p-1 rounded ${theme === 'system' ? 'bg-surface text-foreground shadow-subtle' : 'hover:text-foreground'}`}
          >
            <Laptop size={13} />
          </button>
        </div>

        {/* User / Authentication Status */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-border text-xs">
            <div className="w-7 h-7 rounded bg-institutional-900 dark:bg-sky-500/20 text-white dark:text-sky-300 flex items-center justify-center font-bold text-2xs shrink-0">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="font-semibold text-foreground leading-tight">{user.name}</span>
              <span className="text-2xs text-slate-500 font-mono truncate max-w-[120px]">{user.department}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign out of session"
              className="p-1.5 rounded text-slate-400 hover:text-violation hover:bg-surface-muted transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate(ROUTES.LOGIN)}
            aria-label="Sign in to platform"
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded text-xs font-semibold bg-institutional-900 text-white hover:bg-institutional-800 transition-colors"
          >
            <LogIn size={13} />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
