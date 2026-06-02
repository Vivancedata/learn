import type { Config } from "tailwindcss";
import vivanceTailwindPreset from "./vivance-ui-preset";

const config: Config = {
  presets: [vivanceTailwindPreset],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
};

export default config;
