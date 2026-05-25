import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        brandForeground: "var(--brand-foreground)",
        brandContrast: "var(--brand-contrast)",
        accent: "var(--accent)",
        accentForeground: "var(--accent-foreground)",
        accentContrast: "var(--accent-contrast)",
        whatsapp: "var(--whatsapp)",
        whatsappContrast: "var(--whatsapp-contrast)",
        background: "var(--background)",
        surface: "var(--surface)",
        surface2: "var(--surface-2)",
        foreground: "var(--foreground)",
        text: "var(--text)",
        textMuted: "var(--text-muted)",
        border: "var(--border)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        md: 'var(--font-size-md)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
      },
      animation: {
        slideInDown: 'slideInDown 0.3s ease-out',
        fadeIn: 'fadeIn 0.4s ease forwards',
             
      },
      keyframes: {
        slideInDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },

  plugins:  [
    typography,
    function ({ addUtilities, addVariant }: { addUtilities: (utils: Record<string, any>) => void, addVariant: (name: string, def: string) => void }) {
      addUtilities({
        '.perspective': { perspective: '1000px' },
        '.preserve-3d': { transformStyle: 'preserve-3d' },
        '.backface-hidden': { backfaceVisibility: 'hidden' },
        '.rotate-y-180': { transform: 'rotateY(180deg)' },
        /* Semantic text-on-* helpers ensure correct contrast */
        '.text-on-brand': { color: 'var(--brand-contrast)' },
        '.text-on-accent': { color: 'var(--accent-contrast)' },
        '.text-on-whatsapp': { color: 'var(--whatsapp-contrast)' },
        '.text-muted-strong': { color: 'var(--text-muted)', fontWeight: '500' },
        /* Focus ring utilities (AA): use outline to avoid box shifts */
        '.focus-ring': { outline: '2px solid var(--brand)', outlineOffset: '2px' },
        '.focus-ring-accent': { outline: '2px solid var(--accent)', outlineOffset: '2px' },
        '.focus-ring-inset': { boxShadow: '0 0 0 2px var(--surface), 0 0 0 4px var(--brand)' },
      })
      addVariant('focus-visible', '&:focus-visible')
    }
    ],



  
} satisfies Config;
