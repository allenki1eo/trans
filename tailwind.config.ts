import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(220 15% 6%)",
        surface: "hsl(220 13% 9%)",
        "surface-raised": "hsl(220 12% 12%)",
        border: "hsl(220 10% 18%)",
        foreground: "hsl(40 20% 92%)",
        muted: "hsl(220 8% 55%)",
        accent: {
          DEFAULT: "hsl(42 88% 55%)",
          hover: "hsl(42 88% 62%)",
          foreground: "hsl(220 15% 6%)",
        },
        success: "hsl(150 60% 45%)",
        info: "hsl(210 80% 60%)",
        warning: "hsl(38 92% 55%)",
        danger: "hsl(0 72% 55%)",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
