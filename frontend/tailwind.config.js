/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
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
        brand: {
          orange: '#FF9700',
          purple: '#A700B9',
          yellow: '#FFCE00',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #FF9700 0%, #A700B9 100%)',
        'gradient-brand-reverse': 'linear-gradient(135deg, #A700B9 0%, #FF9700 100%)',
        'gradient-brand-yellow': 'linear-gradient(135deg, #FF9700 0%, #FFCE00 100%)',
        'gradient-brand-full': 'linear-gradient(135deg, #FF9700 0%, #A700B9 50%, #FFCE00 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 