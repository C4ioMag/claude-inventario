/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        apple: {
          blue:         '#0071E3',
          'blue-hover': '#0077ED',
          bg:           '#F2F2F7',
          card:         '#FFFFFF',
          sidebar:      '#111113',
          'sidebar-hover':  'rgba(255,255,255,0.07)',
          'sidebar-active': 'rgba(255,255,255,0.13)',
          text:    '#1D1D1F',
          'text-2': '#6E6E73',
          'text-3': '#AEAEB2',
          border:   '#E5E5EA',
          green:    '#34C759',
          orange:   '#FF9500',
          red:      '#FF3B30',
          yellow:   '#FFCC00',
          purple:   '#AF52DE',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'apple':    '12px',
        'apple-lg': '18px',
        'apple-xl': '24px',
      },
      boxShadow: {
        'card':       '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.10)',
        'modal':      '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        'modal-xl':   '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
        'btn':        '0 1px 3px rgba(0,113,227,0.30)',
        // legacy aliases
        'apple-sm':   '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        'apple':      '0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.10)',
        'apple-lg':   '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        'apple-xl':   '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.04em' }],
      },
    },
  },
  plugins: [],
}
