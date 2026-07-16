/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A0F1C',
          50:  '#F0F4FF',
          100: '#D9E3FF',
          200: '#B3C6FF',
          300: '#7FA0FF',
          400: '#4B78FF',
          500: '#1A50FF',
          600: '#0A32E0',
          700: '#0826B8',
          800: '#071A8F',
          900: '#060F5C',
          950: '#0A0F1C',
        },
        azure: {
          DEFAULT: '#1A6FFF',
          light:   '#3D8BFF',
          dark:    '#0A4FCC',
        },
        cyan: {
          electric: '#00E5FF',
          glow:     '#00BFCC',
          dim:      '#007A8C',
        },
        slate: {
          platinum: '#F1F5F9',
          ash:      '#94A3B8',
          muted:    '#64748B',
          border:   '#1E2D4A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'grid-navy': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E")`,
        'radial-azure': 'radial-gradient(ellipse at center, rgba(26,111,255,0.15) 0%, transparent 70%)',
        'radial-cyan':  'radial-gradient(ellipse at center, rgba(0,229,255,0.12) 0%, transparent 65%)',
        'hero-glow':    'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(0,229,255,0.08) 0%, rgba(26,111,255,0.06) 40%, transparent 70%)',
      },
      animation: {
        'ticker':       'ticker 30s linear infinite',
        'pulse-slow':   'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':        'float 6s ease-in-out infinite',
        'float-delay':  'float 6s ease-in-out 2s infinite',
        'glow-pulse':   'glow-pulse 3s ease-in-out infinite',
        'spin-slow':    'spin 20s linear infinite',
        'orbit':        'orbit 12s linear infinite',
        'fade-in-up':   'fade-in-up 0.7s ease-out forwards',
        'fade-in':      'fade-in 0.5s ease-out forwards',
        'shimmer':      'shimmer 2s infinite linear',
        'draw-line':    'draw-line 2s ease-out forwards',
        'count-up':     'count-up 0.4s ease-out',
        'blink':        'blink 1.2s step-end infinite',
      },
      keyframes: {
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6', filter: 'blur(20px)' },
          '50%':      { opacity: '1.0', filter: 'blur(28px)' },
        },
        orbit: {
          '0%':   { transform: 'rotate(0deg) translateX(90px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(90px) rotate(-360deg)' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'draw-line': {
          '0%':   { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        'count-up': {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },
      boxShadow: {
        'azure-glow': '0 0 40px rgba(26, 111, 255, 0.35)',
        'cyan-glow':  '0 0 30px rgba(0, 229, 255, 0.30)',
        'card':       '0 4px 40px rgba(0, 0, 0, 0.40)',
        'card-hover': '0 8px 60px rgba(0, 0, 0, 0.60)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
