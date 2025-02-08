/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B3D',
        secondary: '#8B5CF6',
        dark: {
          DEFAULT: '#000000',
          lighter: '#1A1A1A',
        }
      },
    },
  },
  plugins: [],
}