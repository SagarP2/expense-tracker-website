/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        screens: {
            'xs': '480px',
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1440px',
        },
        extend: {
            colors: {
                // Primary Brand Colors (Blue)
                primary: {
                    DEFAULT: "rgb(var(--primary) / <alpha-value>)",
                    foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
                    50: "#eff6ff",
                    100: "#dbeafe",
                    200: "#bfdbfe",
                    300: "#93c5fd",
                    400: "#60a5fa",
                    500: "#3b82f6",
                    600: "#2563eb",
                    700: "#1d4ed8",
                    800: "#1e40af",
                    900: "#1e3a8a",
                    950: "#172554",
                },
                // Neutral / Grays (Slate)
                neutral: {
                    50: "#f8fafc",
                    100: "#f1f5f9",
                    200: "#e2e8f0",
                    300: "#cbd5e1",
                    400: "#94a3b8",
                    500: "#64748b",
                    600: "#475569",
                    700: "#334155",
                    800: "#1e293b",
                    900: "#0f172a",
                    950: "#020617",
                },
                // Semantic Colors
                success: {
                    DEFAULT: "rgb(var(--success) / <alpha-value>)",
                    light: "#dcfce7", // green-100
                    dark: "#15803d", // green-700
                },
                warning: {
                    DEFAULT: "rgb(var(--warning) / <alpha-value>)",
                    light: "#fef3c7", // amber-100
                    dark: "#b45309", // amber-700
                },
                danger: {
                    DEFAULT: "rgb(var(--danger) / <alpha-value>)",
                    light: "#fee2e2", // red-100
                    dark: "#b91c1c", // red-700
                },
                info: {
                    DEFAULT: "rgb(var(--info) / <alpha-value>)",
                    light: "#dbeafe", // blue-100
                    dark: "#1d4ed8", // blue-700
                },
                // Digital Dark Accents
                'neon-cyan': '#00F0D9',
                'neon-indigo': '#7C6CFF',
                'neon-magenta': '#FF4D9E',
                'metallic': '#BFC7D6',

                // Brand Colors
                accent: "rgb(var(--accent) / <alpha-value>)",
                muted: "rgb(var(--muted) / <alpha-value>)",

                // Surface & Backgrounds
                background: "rgb(var(--background) / <alpha-value>)",
                surface: "rgb(var(--surface) / <alpha-value>)",
                "surface-highlight": "rgb(var(--surface-highlight) / <alpha-value>)",

                // Text Colors
                text: {
                    DEFAULT: "rgb(var(--text-primary) / <alpha-value>)",
                    secondary: "rgb(var(--text-secondary) / <alpha-value>)",
                    muted: "rgb(var(--text-muted) / <alpha-value>)",
                    inverted: "rgb(var(--text-inverted) / <alpha-value>)",
                },

                border: "rgb(var(--border) / <alpha-value>)",
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
            },
            fontSize: {
                // Responsive clamp typography
                'display': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
                'h1': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.2' }],
                'h2': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.2' }],
                'h3': ['clamp(1.25rem, 2.5vw, 1.875rem)', { lineHeight: '1.3' }],
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
                'pill': '9999px',
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'glow': '0 0 20px rgba(37, 99, 235, 0.15)',
                'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
                'card-hover': '0 0 0 1px rgba(0,0,0,0.03), 0 12px 24px -4px rgba(0,0,0,0.08)',
                'modal': '0 20px 40px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0,0,0,0.05)',
            },
            animation: {
                'fade-in': 'fadeIn 0.4s ease-out',
                'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                'scale-in': 'scaleIn 0.2s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                }
            },
        },
    },
    plugins: [],
}
