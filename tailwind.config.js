/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#059669',
                    light: '#ecfdf5',
                    dark: '#047857',
                },
                dark: {
                    bg: '#121212',
                    card: '#1e1e1e',
                    input: '#252525',
                    border: '#444',
                    text: '#e0e0e0',
                    muted: '#888'
                }
            },
            fontFamily: {
                sans: ['Roboto', 'sans-serif']
            },
            borderRadius: {
                'neo': '12px',
                'neo-lg': '16px',
            },
            boxShadow: {
                'neo-lift': '0 4px 20px -4px rgba(0,0,0,0.05), 0 -2px 10px -2px rgba(255,255,255,0.8)',
                'neo-lift-hover': '0 6px 24px -4px rgba(0,0,0,0.08), 0 -2px 12px -2px rgba(255,255,255,0.9)',
                'neo-inset': 'inset 0 2px 4px rgba(0,0,0,0.04)',
                'neo-lift-dark': '0 4px 20px -4px rgba(0,0,0,0.3), 0 -2px 10px -2px rgba(255,255,255,0.05)',
                'neo-lift-dark-hover': '0 6px 24px -4px rgba(0,0,0,0.4), 0 -2px 12px -2px rgba(255,255,255,0.08)',
            },
            animation: {
                'bounce-slow': 'bounce 2s infinite',
                'fade-in': 'fade-in 0.2s ease-out',
                'slide-up': 'slide-up 0.3s ease-out',
                'scale-in': 'scale-in 0.2s ease-out',
            },
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
        },
    },
    plugins: [],
}
