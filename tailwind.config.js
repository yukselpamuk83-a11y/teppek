/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ilan': '#0097a7',
        'cv': '#fb8c00',
      }
    },
  },
  plugins: [],
}