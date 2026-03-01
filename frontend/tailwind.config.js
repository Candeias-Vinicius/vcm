/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
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
