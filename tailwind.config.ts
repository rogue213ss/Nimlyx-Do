import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Palette C — Midnight + Coral. Applied 2026-09 after the palette
        // shootout; see /docs or commit history for the two rejected
        // alternatives (Ink+Electric, Deep Slate+Acid).
        ink: "#EEF2FF", // primary text
        paper: "#121A2B", // primary surface; also doubles as "on-accent" text
                          // (dark enough for solid contrast against the coral accent)
        surface: "#182238", // elevated surface — the raised calculator card
        line: "#29354C", // borders
        accent: "#FF795B", // coral accent — interactive/selected states only
        "accent-dark": "#E85E40", // accent hover
        result: "#6EE7B7", // mint — reserved for the calculation result only,
                            // deliberately a different hue from accent so the
                            // "answer" never gets confused with "action"
        error: "#FF5C5C",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      maxWidth: {
        prose: "40rem",
      },
    },
  },
  plugins: [],
};

export default config;
