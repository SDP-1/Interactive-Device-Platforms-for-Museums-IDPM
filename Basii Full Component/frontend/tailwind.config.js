/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    // Keep Comparison's extended screen sizes
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
      '4xl': '2560px',
    },

    extend: {
      colors: {
        // ── Artifact Comparison Component ──────────────────────────────
        'warm-beige': '#FDFBF7',
        'paper': '#FAF8F5',
        'museum-gold': '#B8860B',
        'bronze': '#CD7F32',

        // ── Scenario Generation Component ──────────────────────────────
        'primary': '#8B7355',
        'primary-dark': '#6B5845',
        'beige': '#F5F0E8',
        'beige-dark': '#E8DCC8',

        // ── Craft Simulation Component ─────────────────────────────────
        gold: {
          primary: '#D4AF37',
          secondary: '#FFD700',
          accent: '#B8860B',
        },
        brown: {
          primary: '#8B4513',
          dark: '#654321',
        },
        maroon: {
          deep: '#722F37',
          temple: '#DC143C',
        },
        royal: { blue: '#1E3A8A' },
        forest: { green: '#059669' },
        ivory: '#FFFEF7',
        warm: { white: '#FAF9F6' },
        clay: { orange: '#CD853F' },
        copper: '#B87333',
        museum: {
          bg: '#FAFAF9',
          primary: '#292524',
          secondary: '#57534E',
          accent: '#F97316',
          surface: '#FFFFFF',
          gold: '#B45309',
        },
      },

      fontFamily: {
        // Craft uses these key names
        primary: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Crimson Text', 'Georgia', 'serif'],
        // Comparison / Scenario use these key names
        serif: ['Playfair Display', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },

      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0f0a05 0%, #2d1810 30%, #1a0f08 70%, #0f0a05 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(212, 175, 55, 0.08), rgba(139, 69, 19, 0.12))',
      },

      boxShadow: {
        soft: '0 8px 25px rgba(0, 0, 0, 0.4)',
        medium: '0 12px 40px rgba(0, 0, 0, 0.5)',
        strong: '0 20px 60px rgba(0, 0, 0, 0.7)',
        glow: '0 0 30px rgba(212, 175, 55, 0.6)',
      },
    },
  },

  plugins: [],
}
