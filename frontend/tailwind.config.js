/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF8C00',
        secondary: '#987BFF',
        tertiary: '#1A2233',
        neutral: '#000000',
      },
      fontFamily: {
        headline: ['"Hanken Grotesk"', 'sans-serif'],
        body: ['"Hanken Grotesk"', 'sans-serif'],
        label: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}