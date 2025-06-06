/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '1920px',
        md: '1920px',
        lg: '1920px', // custom
        xl: '1920px', // custom
        '2xl': '1920px', // custom
      },
    },
    extend: {
      colors: {
        'garage-gray': '#1a1a1a',
        'garage-dark': '#0d0d0d',
        'garage-accent': '#ff6b35',
        'garage-success': '#4ade80',
        'garage-warning': '#facc15',
        'garage-danger': '#f87171',
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      }
    },
  },
  plugins: [],
}