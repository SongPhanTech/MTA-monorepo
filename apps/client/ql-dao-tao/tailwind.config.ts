/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#028850",
        cgv: {
          "green-dark": "#004725",
          teal: "#EEF7F5", // xanh teal nhạt
          blue: "#E5F2FD", // xanh dương nhạt
          peach: "#FDEFDE", // cam/peach nhạt
          green: "#EBF6ED", // xanh lá nhạt
          purple: "#EFE8FB", // tím nhạt
        },
      },
      fontFamily: {
        "time-news-roman": '"Times New Roman", sans-serif',
      },
    },
  },
  plugins: [],
  important: true,
}
