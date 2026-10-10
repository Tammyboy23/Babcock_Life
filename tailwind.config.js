/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b1020',
        panel: 'rgba(9, 13, 26, 0.82)',
        nepo: '#f5c451',
        lapo: '#4ade80',
        brand: '#7c3aed',
      },
      fontFamily: {
        display: ['"Trebuchet MS"', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        'scene-in': {
          '0%': { opacity: '0', transform: 'scale(1.03)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out both',
        'pop-in': 'pop-in 0.28s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
        'scene-in': 'scene-in 0.45s ease-out both',
      },
    },
  },
  plugins: [],
}
