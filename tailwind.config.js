/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#071B35',      // Primary background
          navy: '#0D294A',      // Secondary navy
          blue: '#174A7E',      // Primary blue
          accent: '#3C83C5',    // Accent blue
          light: '#F4F7FA',     // Light background
          text: '#142235',      // Primary text
          muted: '#64748B',     // Secondary text
          border: '#DCE4ED',    // Borders
          gold: '#F59E0B',      // Accent rating/badges
          emerald: '#10B981',   // Success/Stock badge
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(7, 27, 53, 0.08), 0 2px 6px -1px rgba(7, 27, 53, 0.04)',
        'card-hover': '0 12px 30px -4px rgba(7, 27, 53, 0.14), 0 4px 10px -2px rgba(7, 27, 53, 0.06)',
        'float': '0 10px 25px -3px rgba(60, 131, 197, 0.25)',
      }
    },
  },
  plugins: [],
}

