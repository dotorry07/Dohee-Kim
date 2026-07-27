import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#23182d",
        plum: "#582f82",
        violet: "#8b5fbf",
        honey: "#d8bd5f",
        paper: "#faf9f6"
      },
      boxShadow: {
        dashboard: "0 24px 60px rgba(35, 24, 45, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
