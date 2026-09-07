import { useContext } from 'react';
import { ThemeContext, ThemeContextType, ThemeMode } from '@/app/providers/themeContext';

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export type { ThemeMode, ThemeContextType };
