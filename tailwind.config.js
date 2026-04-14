/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        secretary: {
          gold: '#C8A44E',
          navy: '#1A1A2E',
          dark: '#0F0F1A',
          accent: '#D4AF37',
        },
      },
    },
  },
  plugins: [],
};
