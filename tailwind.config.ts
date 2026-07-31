import type { Config } from "tailwindcss";
import vivanceTailwindPreset from "@vivancedata/ui/tailwind";

const config: Config = {
  presets: [vivanceTailwindPreset],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    // The design system's own class names must be scanned, or utilities used
    // only inside @vivancedata/ui components get tree-shaken out of the build.
    "./node_modules/@vivancedata/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
