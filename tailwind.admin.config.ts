import type { Config } from "tailwindcss";

import base from "./tailwind.config";

// CSS do painel admin: mesma configuração do site, varrendo também as pastas do
// admin que tailwind.config.ts deixa de fora. Usado só por
// app/(admin)/admin/admin.css.
export default {
  ...base,
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
} satisfies Config;
