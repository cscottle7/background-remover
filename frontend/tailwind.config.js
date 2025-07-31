/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Dark theme colors matching developer preferences
        'dark-bg': '#0f0f0f',
        'dark-surface': '#1a1a1a',
        'dark-elevated': '#262626',
        'dark-border': '#333333',
        'dark-text': '#e5e5e5',
        'dark-text-secondary': '#a3a3a3',
        'dark-text-muted': '#737373',
        'magic': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        'scanline': {
          primary: '#00ff88',
          secondary: '#0088ff',
          tertiary: '#ff0088'
        }
      },
      animation: {
        'scanline': 'scanline 3s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite'
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 136, 0.6)' }
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        dark: {
          "primary": "#00ff88",
          "secondary": "#0088ff", 
          "accent": "#ff0088",
          "neutral": "#1a1a1a",
          "base-100": "#0f0f0f",
          "base-200": "#1a1a1a",
          "base-300": "#262626",
          "info": "#0ea5e9",
          "success": "#00ff88",
          "warning": "#fbbf24",
          "error": "#f87171",
        },
      },
    ],
    darkTheme: "dark",
    base: false,
    styled: true,
    utils: true,
  },
}