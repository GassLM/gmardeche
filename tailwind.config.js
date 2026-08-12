/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night:   '#0B1F3A', // nuit mediterraneenne (fond)
        night2:  '#0E274A',
        azur:    '#17C3B2', // turquoise
        wave:    '#1FB6D6',
        sun:     '#F7B733', // or / soleil
        sun2:    '#FFD166',
        coral:   '#FF5A5F', // Reste du Monde
        marseille:'#2E86FF', // Les Marseillais
        cream:   '#FFF7E8',
      },
      fontFamily: {
        display: ['Anton', 'Archivo Black', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        livepulse: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%':     { opacity: '.55', transform: 'scale(1.08)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        popin: {
          '0%':   { transform: 'scale(.7)', opacity: '0' },
          '100%': { transform: 'scale(1)',  opacity: '1' },
        },
      },
      animation: {
        livepulse: 'livepulse 1.2s ease-in-out infinite',
        floaty:    'floaty 4s ease-in-out infinite',
        shimmer:   'shimmer 2.5s linear infinite',
        popin:     'popin .45s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
}
