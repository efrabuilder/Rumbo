/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0b0f1c",
        surface: "#121a2e",
        surface2: "#182444",
        line: "#243158",
        ink: "#eef1fb",
        inkSoft: "#8d97bb",
        sky: "#3fc3ea",
        amber: "#f5a83c",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
