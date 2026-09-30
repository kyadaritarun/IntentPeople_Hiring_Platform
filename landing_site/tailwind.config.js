/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
        display: ['Lexend', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#FF6008', // Logo Primary Orange
          dark: '#E05200',
          deep: '#413C68', // Logo Deep Violet
          light: '#FFF7ED',
          cream: '#FAF9F6',
          footer: '#0B132B',
          border: '#FED7AA',
          teal: '#00a884',
          'teal-light': '#00c49a',
          gold: '#F2A93B',
          'gold-deep': '#D98D1E',
        },
        coral: {
          DEFAULT: '#EA580C',
          dark: '#C2410C',
          light: '#FB923C',
        },
        text: {
          main: '#0F172A',
          muted: '#526071',
        },
        navy: {
          950: '#0B1320',
          900: '#0F1B2E',
          800: '#1A2D4A',
          700: '#2C4470',
        },
      }
    },
  },
  plugins: [],
}
