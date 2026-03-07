/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
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
                royal: {
                    blue: '#1E3A8A',
                },
                forest: {
                    green: '#059669',
                },
                ivory: '#FFFEF7',
                warm: {
                    white: '#FAF9F6',
                },
                clay: {
                    orange: '#CD853F',
                },
                copper: '#B87333',
                'museum': {
                    bg: '#FAFAF9',       // warm-white/stone-50
                    primary: '#292524',  // stone-800 (charcoal)
                    secondary: '#57534E',// stone-600 (neutral grey)
                    accent: '#F97316',   // orange-500 (terracotta-bright)
                    surface: '#FFFFFF',  // white
                    gold: '#B45309',     // amber-700 (antique gold for legacy support/accents)
                }
            },
            fontFamily: {
                primary: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Playfair Display', 'Georgia', 'serif'],
                body: ['Crimson Text', 'Georgia', 'serif'],
                serif: ['"Playfair Display"', 'serif'],
                sans: ['Inter', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #0f0a05 0%, #2d1810 30%, #1a0f08 70%, #0f0a05 100%)',
                'gradient-card': 'linear-gradient(145deg, rgba(212, 175, 55, 0.08), rgba(139, 69, 19, 0.12))',
                'paper-texture': "url('/assets/textures/paper-texture.png')",
            },
            boxShadow: {
                soft: '0 8px 25px rgba(0, 0, 0, 0.4)',
                medium: '0 12px 40px rgba(0, 0, 0, 0.5)',
                strong: '0 20px 60px rgba(0, 0, 0, 0.7)',
                glow: '0 0 30px rgba(212, 175, 55, 0.6)',
            }
        },
    },
    plugins: [],
}
