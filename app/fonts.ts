import localFont from "next/font/local";

/**
 * DM Sans - Primary font for body text
 * Variable axes: wght 400-700
 * @see https://fonts.google.com/specimen/DM+Sans
 */
export const dmSans = localFont({
  src: [
    {
      path: "../public/fonts/dm-sans-latin.woff2",
      weight: "400 700",
      style: "normal",
    },
  ],
  display: "swap", // Evita FOIT (Flash of Invisible Text)
  variable: "--font-dm-sans",
  preload: true,
  fallback: ["Inter", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
});
