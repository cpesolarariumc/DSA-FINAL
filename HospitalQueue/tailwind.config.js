/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        portalBg: '#dce5e1',
        cardBg: '#eef2f0',
        brandPrimary: '#1b6b50',
        brandDark: '#0f3832',
      },
    },
  },
  plugins: [],
}