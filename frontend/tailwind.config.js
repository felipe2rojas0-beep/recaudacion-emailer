/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#D9C562',
        secondary: '#7A8D6E',
        tertiary: '#8A8A8A',
        neutral: '#1A1A1B',
      },
      fontFamily: {
        headline: ['"Hanken Grotesk"', 'sans-serif'],
        body: ['"Hanken Grotesk"', 'sans-serif'],
        label: ['"Hanken Grotesk"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}