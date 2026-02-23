/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1A56B0',
                accent: '#0EA5E9',
                success: '#059669',
                warning: '#D97706',
                danger: '#DC2626',
                background: '#0F172A',
                surface: '#1E293B',
                borderCol: '#334155',
                textPrimary: '#F8FAFC',
                textSecondary: '#94A3B8',
                textMuted: '#475569'
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            }
        },
    },
    plugins: [],
}
