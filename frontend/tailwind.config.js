/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
  plugins: [],
} 