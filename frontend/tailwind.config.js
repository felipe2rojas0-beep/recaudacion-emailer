/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'surface': {
          'dark': '#0a0a0a',
          'card': '#111111',
          'hover': '#1a1a1a',
          'border': '#2a2a2a',
        },
        'accent': {
          'orange': '#f97316',
          'orange-hover': '#ea580c',
          'orange-light': '#fed7aa',
        },
        'text': {
          'primary': '#ffffff',
          'secondary': '#a1a1aa',
          'muted': '#71717a',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
