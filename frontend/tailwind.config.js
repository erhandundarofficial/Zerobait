/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--neon-cyan)',
        secondary: 'var(--neon-magenta)',
        ok: 'var(--neon-green)',
        'background-light': '#f6f6f8',
        'background-dark': '#0d0c1d',
        'surface-dark': '#1a1a2e',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      screens: {
        xs: '480px',
      },
      animation: {
        grid: 'grid 15s linear infinite',
      },
      keyframes: {
        grid: {
          '0%': { transform: 'translateY(-50%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}