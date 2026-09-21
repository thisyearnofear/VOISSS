/**
 * Tailwind configuration — derives from the canonical VOISSS theme.
 *
 * Single source of truth for design tokens: packages/ui/src/theme/index.ts
 *
 * NOTE: Tailwind doesn't support importing TypeScript JSON at build time,
 * so values are duplicated here. When updating the canonical theme, update
 * this file to match.
 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'spin-slow': 'spin 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'gradient-drift': 'gradientDrift 12s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        gradientDrift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      colors: {
        // VOISSS brand colors — aligned with canonical theme
        voisss: {
          primary: '#7C5DFA',
          'primary-hover': '#6D4AE8',
          'primary-light': '#9C88FF',
          secondary: '#3B82F6',
          success: '#22C55E',
          error: '#EF4444',
          warning: '#F59E0B',
        },
        surface: {
          DEFAULT: '#0A0A0A',
          secondary: '#1A1A1A',
          tertiary: '#2A2A2A',
        },
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        // Listening Room system — CSS vars defined in src/styles/tokens.css.
        // Use these (e.g. bg-lr-paper, text-lr-muted) instead of new hex values.
        lr: {
          paper: 'var(--lr-paper)',
          surface: 'var(--lr-surface)',
          ink: 'var(--lr-ink)',
          muted: 'var(--lr-muted)',
          line: 'var(--lr-line)',
          accent: 'var(--lr-accent)',
          'accent-soft': 'var(--lr-accent-soft)',
          focus: 'var(--lr-focus)',
          night: {
            DEFAULT: 'var(--lr-night)',
            raised: 'var(--lr-night-raised)',
            ink: 'var(--lr-night-ink)',
            muted: 'var(--lr-night-muted)',
            line: 'var(--lr-night-line)',
            accent: 'var(--lr-night-accent)',
          },
          error: 'var(--lr-error)',
          'error-dark': 'var(--lr-error-dark)',
        },
      },
      spacing: {
        'lr-xs': 'var(--lr-space-xs)',
        'lr-sm': 'var(--lr-space-sm)',
        'lr-md': 'var(--lr-space-md)',
        'lr-lg': 'var(--lr-space-lg)',
        'lr-xl': 'var(--lr-space-xl)',
        'lr-2xl': 'var(--lr-space-2xl)',
        'lr-3xl': 'var(--lr-space-3xl)',
      },
      borderRadius: {
        lr: 'var(--lr-radius)',
      },
      transitionTimingFunction: {
        lr: 'var(--lr-ease)',
      },
      transitionDuration: {
        lr: 'var(--lr-duration)',
      },
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-courier-prime)', 'monospace'],
        accent: ['var(--font-anton)', 'Impact', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
