/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        apple: {
          blue:    '#0071E3',
          'blue-hover': '#0077ED',
          'blue-light': '#E8F1FB',
          bg:      '#F5F5F7',
          card:    '#FFFFFF',
          sidebar: '#1C1C1E',
          'sidebar-hover': '#2C2C2E',
          'sidebar-active': '#3A3A3C',
          text:    '#1D1D1F',
          'text-2': '#6E6E73',
          'text-3': '#AEAEB2',
          border:  '#E5E5E7',
          'border-strong': '#C7C7CC',
          green:   '#34C759',
          orange:  '#FF9500',
          red:     '#FF3B30',
          yellow:  '#FFCC00',
          purple:  '#AF52DE',
          pink:    '#FF2D55',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'apple': '12px',
        'apple-lg': '18px',
        'apple-xl': '24px',
      },
      boxShadow: {
        'apple-sm': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'apple':    '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'apple-lg': '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
        'apple-xl': '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
