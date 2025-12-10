/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                dark: "#0e1117",
                secondary: "#161b22",
                accent: "#38bdf8",
            }
        },
    },
    plugins: [],
}
