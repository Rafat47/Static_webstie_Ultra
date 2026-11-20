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
          dark: '#080438',      // User custom midnight navy (#080438) for buttons and primary elements
          navy: '#150D5E',      // Refined hover state midnight navy
          blue: '#1E40AF',      // Deep royal blue accent
          accent: '#080438',    // High-contrast primary action (#080438)
          light: '#F8FAFD',     // 99% white with ultra subtle bluish tint
          surface: '#F8FAFC',   // Subtle light slate background
          text: '#080438',      // Midnight navy typography
          muted: '#64748B',     // Refined slate secondary text
          border: '#E2E8F0',    // Crisp 1px borders
          red: '#DC2626',       // Discount badges
          emerald: '#16A34A',   // Stock / trust indicator
          amber: '#D97706',     // Star ratings
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'preview': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
