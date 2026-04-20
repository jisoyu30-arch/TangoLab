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
        // 에디토리얼 팔레트 (탱고 빈티지)
        tango: {
          ink: '#0B0A09',        // 깊은 검정
          paper: '#F5F1E8',      // 앤티크 종이
          cream: '#E8DFC9',      // 크림
          burgundy: '#6B1F2E',   // 탱고 와인색
          rose: '#C9A0A0',       // 탱고 로즈
          brass: '#B8863F',      // 황동
          copper: '#A0522D',     // 구리
          sepia: '#704214',      // 세피아
          shadow: '#1F1814',     // 깊은 그림자
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.7s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
