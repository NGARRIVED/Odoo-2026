/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "../../entry/main-frontend/**/*.{js,ts,jsx,tsx,html}",
    "../../features/**/*.{js,ts,jsx,tsx}",
    "../../shared/ui-components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: { 900: '#2C3E50', 800: '#34495E', 500: '#3B82F6' },
        alert: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    },
  },
  plugins: [],
}
