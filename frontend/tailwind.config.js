/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                income: {
                    light: '#dcfce7',
                    DEFAULT: '#22c55e',
                    dark: '#15803d',
                },
                expense: {
                    light: '#fef3c7',
                    DEFAULT: '#f59e0b',
                    dark: '#b45309',
                },
                negative: {
                    light: '#fee2e2',
                    DEFAULT: '#ef4444',
                    dark: '#b91c1c',
                },
                positive: {
                    light: '#dcfce7',
                    DEFAULT: '#22c55e',
                    dark: '#15803d',
                },
            },
        },
    },
    plugins: [],
}
