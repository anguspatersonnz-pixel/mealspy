import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        malt: {
          50: "#fff8e8",
          100: "#ffedbf",
          300: "#f7c35d",
          500: "#d99021",
          700: "#8f4e12",
          900: "#3a2416"
        },
        hop: {
          50: "#edf8ef",
          100: "#d3efd9",
          500: "#2f8f4e",
          700: "#1f6539",
          900: "#153d29"
        },
        night: "#161512"
      },
      boxShadow: {
        soft: "0 18px 55px rgba(34, 28, 18, 0.14)"
      }
    },
  },
  plugins: [],
};

export default config;
