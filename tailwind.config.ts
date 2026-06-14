import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Spotlight design system (ported from SmartSpeak) ──
        ink: {
          DEFAULT: '#0C0B10',
          800: '#141019',
          700: '#1B1622',
          600: '#241D2E',
        },
        spotlight: {
          DEFAULT: '#FFC857',
          soft: '#FFD98A',
          dim: '#C99A3E',
        },
        // Per-category accents that live on the ink/gold system
        stage: {
          DEFAULT: '#3DD68C',
          soft: '#6EE7B0',
        },
        moon: {
          DEFAULT: '#8AA2FF',
          soft: '#AEC0FF',
        },
        tier: {
          green: '#3DD68C',
          amber: '#FFB454',
          red: '#FF6B6B',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
