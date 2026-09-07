import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme variables (CSS-driven for light/dark switching)
        background: 'var(--color-bg)',
        foreground: 'var(--color-fg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
          muted: 'var(--color-surface-muted)',
          subtle: 'var(--color-surface-subtle)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          muted: 'var(--color-border-muted)',
          strong: 'var(--color-border-strong)',
        },
        // Institutional primary palette (Deep navy / institutional blue)
        institutional: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0b1d30',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          foreground: 'var(--color-primary-foreground)',
        },
        // Semantic status tokens (Colors must always pair with Icon + Text + Label)
        compliant: {
          DEFAULT: 'var(--color-compliant)',
          surface: 'var(--color-compliant-surface)',
          border: 'var(--color-compliant-border)',
          foreground: 'var(--color-compliant-fg)',
        },
        violation: {
          DEFAULT: 'var(--color-violation)',
          surface: 'var(--color-violation-surface)',
          border: 'var(--color-violation-border)',
          foreground: 'var(--color-violation-fg)',
        },
        review: {
          DEFAULT: 'var(--color-review)',
          surface: 'var(--color-review-surface)',
          border: 'var(--color-review-border)',
          foreground: 'var(--color-review-fg)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          surface: 'var(--color-info-surface)',
          border: 'var(--color-info-border)',
          foreground: 'var(--color-info-fg)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],   // 11px
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.005em' }],       // 12px
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],                            // 13px
        'base': ['0.875rem', { lineHeight: '1.375rem' }],                          // 14px standard body
        'md': ['0.9375rem', { lineHeight: '1.5rem' }],                             // 15px
        'lg': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],        // 16px subheadings
        'xl': ['1.125rem', { lineHeight: '1.625rem', letterSpacing: '-0.015em' }], // 18px page titles
        '2xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],   // 20px
        '3xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],      // 24px
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      borderRadius: {
        none: '0',
        xs: '2px',
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        // Pill or circular only for avatar and icons, not cards/containers
        full: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        elevated: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        modal: '0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -4px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
