/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3E0F8D',
        secondary: '#9564DD',
        accent: '#E4DA72',
        bgLight: '#EEEEEE'
      }
    },
  },
  plugins: [],
}
