import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { env } from '@/app/config/env';
import { storage, ALLOWED_STORAGE_KEYS } from '@/utils/storage';
import { Sun, Moon, Laptop, ShieldAlert, Check, CheckCircle2 } from 'lucide-react';
import { staggerContainer, staggerItem, butterSpring, gpuAcceleratedStyle } from '@/animations/motion';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleClearPreferences = () => {
    storage.clearPreferences();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2500);
  };

  return (
    <PageShell
      title="System & Preferences"
      description="Configure accessibility settings, theme controls, and review environment parameters."
      badge={<span className="text-2xs font-mono text-slate-500 bg-surface-muted px-2 py-0.5 rounded border border-border">Local Preferences</span>}
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={gpuAcceleratedStyle}
        className="max-w-2xl space-y-6"
      >
        {/* Theme Settings */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle>Display Theme Mode</CardTitle>
              <CardDescription>
                Select application color scheme. Automatically respects system settings or pins user choice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={butterSpring}
                  onClick={() => setTheme('light')}
                  className={`p-3.5 rounded-lg border text-center text-xs flex flex-col items-center gap-2 transition-colors relative ${
                    theme === 'light'
                      ? 'border-primary bg-surface-muted text-foreground font-semibold shadow-sm'
                      : 'border-border hover:bg-surface-muted/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sun size={20} className={theme === 'light' ? 'text-primary' : 'text-slate-400'} />
                  <span>Light</span>
                  {theme === 'light' && (
                    <motion.div
                      layoutId="settingsThemeActive"
                      transition={butterSpring}
                      className="absolute inset-0 rounded-lg border-2 border-primary pointer-events-none"
                    />
                  )}
                  {theme === 'light' && <Check size={12} className="text-primary font-bold" />}
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={butterSpring}
                  onClick={() => setTheme('dark')}
                  className={`p-3.5 rounded-lg border text-center text-xs flex flex-col items-center gap-2 transition-colors relative ${
                    theme === 'dark'
                      ? 'border-primary bg-surface-muted text-foreground font-semibold shadow-sm'
                      : 'border-border hover:bg-surface-muted/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Moon size={20} className={theme === 'dark' ? 'text-primary' : 'text-slate-400'} />
                  <span>Dark</span>
                  {theme === 'dark' && (
                    <motion.div
                      layoutId="settingsThemeActive"
                      transition={butterSpring}
                      className="absolute inset-0 rounded-lg border-2 border-primary pointer-events-none"
                    />
                  )}
                  {theme === 'dark' && <Check size={12} className="text-primary font-bold" />}
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={butterSpring}
                  onClick={() => setTheme('system')}
                  className={`p-3.5 rounded-lg border text-center text-xs flex flex-col items-center gap-2 transition-colors relative ${
                    theme === 'system'
                      ? 'border-primary bg-surface-muted text-foreground font-semibold shadow-sm'
                      : 'border-border hover:bg-surface-muted/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Laptop size={20} className={theme === 'system' ? 'text-primary' : 'text-slate-400'} />
                  <span>System</span>
                  {theme === 'system' && (
                    <motion.div
                      layoutId="settingsThemeActive"
                      transition={butterSpring}
                      className="absolute inset-0 rounded-lg border-2 border-primary pointer-events-none"
                    />
                  )}
                  {theme === 'system' && <Check size={12} className="text-primary font-bold" />}
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Browser Storage Policy Verification */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-primary" />
                <CardTitle>Storage Security Policy</CardTitle>
              </div>
              <CardDescription>
                Browser localStorage is strictly restricted to allowed non-sensitive UI preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 bg-surface-muted rounded border border-border font-mono text-2xs space-y-1">
                <div className="text-slate-500">// Permitted Storage Keys (Allowlist):</div>
                {Object.entries(ALLOWED_STORAGE_KEYS).map(([k, v]) => (
                  <div key={k} className="text-foreground">
                    • {k}: <span className="text-sky-600 dark:text-sky-400">"{v}"</span>
                  </div>
                ))}
              </div>
              <p className="text-2xs text-slate-500 leading-relaxed">
                Strict Policy: Tokens, passwords, extracted evidence, and regulatory decisions are NEVER stored in browser storage.
              </p>
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={handleClearPreferences}>
                  Clear Cached UI Preferences
                </Button>
                <AnimatePresence>
                  {clearedNotice && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="text-xs text-emerald-500 font-medium flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Preferences reset successfully
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Runtime Environment Details */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle>Environment Diagnostics</CardTitle>
              <CardDescription>Active runtime configuration verified from .env and config/env.ts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-slate-500">VITE_DEMO_MODE:</span>
                <span className="font-bold text-foreground">{String(env.VITE_DEMO_MODE)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-slate-500">VITE_API_BASE_URL:</span>
                <span className="text-foreground">{env.VITE_API_BASE_URL}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">VITE_APP_ENV:</span>
                <span className="text-foreground">{env.VITE_APP_ENV}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageShell>
  );
};

