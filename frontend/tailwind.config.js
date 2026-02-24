/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#2b4bee',
                accent: '#8b5cf6',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                background: '#09090b',
                surface: '#18181b',
                surfaceHover: '#27272a',
                borderCol: '#27272a',
                textPrimary: '#fafafa',
                textSecondary: '#a1a1aa',
                textMuted: '#52525b'
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            boxShadow: {
                'neon-primary': '0 0 15px rgba(43, 75, 238, 0.4)',
                'neon-accent': '0 0 15px rgba(139, 92, 246, 0.4)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.36)'
            }
        },
    },
    plugins: [],
}
