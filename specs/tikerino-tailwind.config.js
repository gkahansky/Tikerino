/** Tikerino Tailwind config v1 - 12 Sep 2026. Mirrors tikerino-design-tokens-v1.css; keep in sync. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#10B981',
          strong: '#0B7B5C',
          ink: '#0B5643',
          soft: '#E7F8F1',
        },
        ink: { DEFAULT: '#0F2B46', 2: '#5B7186' },
        coral: '#FF6B57',
        sun: { DEFAULT: '#FFB020', soft: '#FFF4DD' },
        paper: '#FAFAF7',
        surface: '#FFFFFF',
        line: '#E8E4DB',
        // FROZEN chart data colors - never retint. Bullish=hollow body, bearish=filled body.
        data: {
          up: '#0E9F6E',
          down: '#DC2626',
          volume: '#B3BCC4',
          grid: '#EDEAE3',
        },
        focus: '#2C5677',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['1rem', { lineHeight: '1.4' }],
        sm: ['1.0625rem', { lineHeight: '1.5' }],
        base: ['1.125rem', { lineHeight: '1.6' }],
        lg: ['1.375rem', { lineHeight: '1.4' }],
        xl: ['1.75rem', { lineHeight: '1.25' }],
        '2xl': ['2.25rem', { lineHeight: '1.15' }],
      },
      borderRadius: { card: '20px', button: '16px' },
      minHeight: { target: '48px' },
      minWidth: { target: '48px' },
      transitionDuration: { reveal: '200ms' },
    },
  },
  plugins: [],
};
