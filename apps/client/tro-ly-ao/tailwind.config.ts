/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#028850",
        warning: {
          "600": "#EA580C",
          "100": "#FFF7ED",
        },
        danger: {
          "600": "#DC2626",
          "100": "#FEF2F2",
        },
      },
    },
  },
  plugins: [],
  important: true,
}
