/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: [
    'relative', 'rounded-lg', 'z-[60]',
    'ring-2', 'ring-valorant-red', 'ring-offset-2', 'ring-offset-valorant-dark',
  ],
  theme: {
    extend: {
      colors: {
        valorant: {
          red: '#FF4655',
          dark: '#0F1923',
          card: '#1a2332',
          border: '#2a3a4a',
        },
      },
    },
  },
  plugins: [],
};
