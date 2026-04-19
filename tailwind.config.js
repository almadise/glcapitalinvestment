/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        navy: {
          950: '#1E2D4A',
          900: '#1E2D4A',
          800: '#1E2D4A',
          700: '#2A3D5C',
          600: '#3A4F6E',
          500: '#4A5C7A',
          400: '#6B7E9A',
          300: '#8A9BB5',
          200: '#D8E0EC',
          100: '#E8EDF5',
          DEFAULT: '#1E2D4A',
        },
        gold: {
          700: '#8A6B1E',
          600: '#B8912A',
          500: '#B8912A',
          400: '#C9A23B',
          300: '#D4B055',
          200: '#E8D090',
          100: '#F5EDD0',
          DEFAULT: '#B8912A',
        },
        steel: {
          700: '#1E2D4A',
          600: '#2A3D5C',
          500: '#4A5C7A',
          DEFAULT: '#4A5C7A',
        },
        surface: {
          DEFAULT: '#F7F8FA',
          muted: '#E8EDF5',
          card: '#FFFFFF',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 5s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(184, 145, 42, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(184, 145, 42, 0)' },
        },
      },
      boxShadow: {
        'gold': '0 0 30px rgba(184, 145, 42, 0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};