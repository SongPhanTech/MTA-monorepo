/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#005f37",
      },
      fontFamily: {
        "time-news-roman": '"Times New Roman", sans-serif',
      },
    },
  },
  plugins: [],
  important: true,
}
