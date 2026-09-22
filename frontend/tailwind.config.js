/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Lexend', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#0B1320',
          900: '#0F1B2E',
          800: '#1A2D4A',
          700: '#2C4470',
        },
        brand: {
          teal: '#00a884',
          'teal-light': '#00c49a',
          gold: '#F2A93B',
          'gold-deep': '#D98D1E',
        },
        sage: {
          50: '#f4f9f6',
          100: '#e3efe7',
          200: '#cce3d7',
          300: '#9bb8a8',
          400: '#88aa98',
          500: '#7a9c8b',
          600: '#5c7a6b',
          700: '#4a6b5a',
        }
      }
    },
  },
  plugins: [],
}
