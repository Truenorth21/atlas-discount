import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        atlas: {
          navy: "#062B5C",
          blue: "#0B63CE",
          light: "#F5F8FC",
          red: "#D81E2F"
        }
      },
      boxShadow: {
        panel: "0 14px 38px rgba(6, 43, 92, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
