import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        atlas: {
          navy: "#111827",
          blue: "#D62828",
          light: "#F6F4EF",
          red: "#D62828"
        }
      },
      boxShadow: {
        panel: "0 14px 34px rgba(17, 24, 39, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
