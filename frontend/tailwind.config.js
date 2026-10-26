/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'Segoe UI', 'sans-serif'] },
      colors: {
        navy: { 50: '#f3f6fb', 100: '#e5ebf5', 200: '#c9d5ea', 300: '#9fb3d6', 400: '#6d89bd', 500: '#4a69a3', 600: '#375083', 700: '#2a3f69', 800: '#1a2c52', 900: '#0b1f44', 950: '#071530' },
        azure: { 50: '#eef4ff', 100: '#dbe7ff', 500: '#2f6bff', 600: '#1f55e0', 700: '#1a45b8' },
      },
      boxShadow: { soft: '0 1px 2px rgba(11,31,68,.04), 0 8px 24px -8px rgba(11,31,68,.10)', lift: '0 12px 40px -12px rgba(11,31,68,.25)' },
      keyframes: {
        page: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        dot: { '0%,80%,100%': { opacity: 0.25 }, '40%': { opacity: 1 } },
        toast: { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { page: 'page .28s ease-out', toast: 'toast .2s ease-out', dot: 'dot 1.2s infinite' },
    },
  },
  plugins: [],
}
