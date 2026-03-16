/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
      colors: {
        surface: {
          50:  '#f8f9fb',
          100: '#f0f2f7',
          200: '#e2e6ef',
          800: '#1a1d27',
          900: '#12141e',
          950: '#0c0e16',
        },
        accent: {
          DEFAULT: '#7c6aff',
          hover:   '#6b58f0',
          light:   '#a594ff',
        },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0M-10 10L10-10M30 50L50 30' stroke='%23ffffff08' stroke-width='1'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

