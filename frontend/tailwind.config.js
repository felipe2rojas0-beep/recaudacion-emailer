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
        surface: 'var(--bg-card)',
        'surface-alt': 'var(--bg-secondary)',
        'surface-input': 'var(--bg-input)',
        'surface-hover': 'var(--bg-input-hover)',
        'border-theme': 'var(--border-color)',
        'border-theme-light': 'var(--border-color-light)',
        'text-theme': 'var(--text-primary)',
        'text-theme-secondary': 'var(--text-secondary)',
        'text-theme-muted': 'var(--text-muted)',
        'text-theme-muted-light': 'var(--text-muted-light)',
        'nav-bg': 'var(--nav-bg)',
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
