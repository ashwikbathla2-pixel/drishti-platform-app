/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Libre Caslon Text"', 'serif'],
        serif: ['"Instrument Serif"', 'serif'],
        display: ['"Instrument Serif"', 'serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: { DEFAULT: 'var(--card)', foreground: 'var(--foreground)' },
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--foreground)' },
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: '#e6c075', foreground: '#050505' },
        beam: '#e6c075',
        destructive: { DEFAULT: '#c0392b', foreground: '#f0ece4' },
        verified: '#4ade80',
        rejected: '#f87171',
        flagged: '#fbbf24',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: '#e6c075',
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          accent: 'var(--sidebar-accent)',
          border: 'var(--sidebar-border)',
        },
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'beam-sweep': { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(400%)' } },
        'pulse-dot': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'beam-sweep': 'beam-sweep 3.5s var(--ease-cinematic) infinite',
        'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
