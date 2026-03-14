import type { Config } from "tailwindcss";
import vivanceTailwindPreset from "@vivancedata/ui/tailwind";

const config: Config = {
  presets: [vivanceTailwindPreset],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../ui/src/**/*.{ts,tsx}",
    "./node_modules/@vivancedata/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
