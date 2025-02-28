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
      scale: {
        '102': '1.02',
        '105': '1.05',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #FF9700 0%, #A700B9 100%)',
        'gradient-brand-reverse': 'linear-gradient(135deg, #A700B9 0%, #FF9700 100%)',
        'gradient-brand-yellow': 'linear-gradient(135deg, #FF9700 0%, #FFCE00 100%)',
        'gradient-brand-full': 'linear-gradient(135deg, #FF9700 0%, #A700B9 50%, #FFCE00 100%)',
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in forwards',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
} 