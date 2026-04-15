/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#4F46E5',   
          orange: '#FF5A36',
          light: '#F8FAFC',  
          dark: '#0F172A',   
          panel: '#1E293B',  
        }
      }
    },
  },
  plugins: [],
}