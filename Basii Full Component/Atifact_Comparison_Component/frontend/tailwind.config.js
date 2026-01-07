/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        'warm-beige': '#FDFBF7',
        'paper': '#FAF8F5',
        'museum-gold': '#B8860B',
        'bronze': '#CD7F32',
      },
      fontFamily: {
        'serif': ['Playfair Display', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
