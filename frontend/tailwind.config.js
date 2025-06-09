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
        'garage-gray': '#202020',
        'garage-dark': '#0d0d0d',
        'garage-accent': '#ff6b35',
        'garage-success': '#4ade80',
        'garage-warning': '#facc15',
        'garage-danger': '#f87171',
        'garage-bg':'linear-gradient(30deg,rgba(50, 50, 56, 1) 0%, rgba(49, 51, 49, 1) 50%, rgba(79, 69, 59, 1) 100%)',
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