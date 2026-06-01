import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        atlas: {
          navy: "#10194A",
          blue: "#0A63B0",
          light: "#F3F5F8",
          red: "#DC2626"
        }
      },
      boxShadow: {
        panel: "0 12px 30px rgba(16, 25, 74, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
