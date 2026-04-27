import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5faff",
          500: "#2563eb",
          900: "#0b1e3f",
        },
      },
      spacing: {
        gutter: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
