import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
theme: {
    extend: {
      colors: {
        // O emerald-600 do Tailwind (#059669) reprova em WCAG AA nos dois
        // papeis em que este site o usa: como texto sobre fundo claro mede
        // 3,48:1 e como fundo de botao com texto branco mede 3,77:1 -- o
        // minimo e 4,5:1. Sao 77 usos como texto e mais de 40 como fundo,
        // entao corrigir na paleta e mais seguro do que em 117 lugares.
        // #047c59 e o mesmo verde um passo mais escuro: 5,21:1 com branco
        // por cima e no minimo 4,74:1 como texto sobre qualquer fundo claro
        // do site. Continua mais claro que o emerald-700 (#047857), entao
        // todo `hover:bg-emerald-700` segue visivelmente mais escuro.
        emerald: { 600: "#047c59" },

        // Mesmo problema no cinza dos textos secundarios. O zinc-500 do
        // Tailwind (#71717a) mede 4,83:1 sobre branco puro, mas o site quase
        // nunca usa branco puro: os blocos ficam sobre #faf5ef, #fdf2f8,
        // #eff6ff, #fef2f2. Sobre esses fundos ele cai para 4,41-4,45:1 e
        // reprova por uma casa decimal. #6b6b73 e o mesmo cinza quatro pontos
        // mais escuro: 4,81:1 no pior fundo claro do site.
        zinc: { 500: "#6b6b73" },
        brand: "var(--brand)",
        brandForeground: "var(--brand-foreground)",
        brandContrast: "var(--brand-contrast)",
        accent: "var(--accent)",
        accentForeground: "var(--accent-foreground)",
        accentContrast: "var(--accent-contrast)",
        whatsapp: "var(--whatsapp)",
        whatsappHover: "var(--whatsapp-hover)",
        whatsappContrast: "var(--whatsapp-contrast)",
        star: "var(--star)",
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

        // --- apelidos em kebab-case ------------------------------------
        // As chaves acima estao em camelCase e o Tailwind gera a classe com
        // o nome exato da chave: brandForeground vira .text-brandForeground.
        // O codigo, porem, sempre escreveu text-brand-foreground,
        // text-whatsapp-contrast, bg-surface-subtle. Nenhuma dessas classes
        // existia no CSS compilado -- nao eram cores erradas, eram regras que
        // nunca chegaram a ser geradas, e o elemento acabava herdando a cor
        // do pai. Foi assim que o icone do botao do WhatsApp saiu marrom
        // (#2a231f sobre #1b7d53 = 3,0:1, quando deveria ser branco a 5,1:1)
        // e os paineis do blog ficaram sem fundo nenhum. O axe nao acusa isso
        // num botao que so tem icone, porque nao ha texto para medir.
        //
        // FATO: as tres abaixo apontam para variaveis que ja existem no
        // globals.css, com exatamente o nome que a classe pede.
        "whatsapp-contrast": "var(--whatsapp-contrast)",
        "accent-foreground": "var(--accent-foreground)",
        "text-muted": "var(--text-muted)",
        //
        // INFERENCIA: para as seis abaixo nao existe variavel correspondente
        // (--text-soft, --text-primary, --text-secondary, --surface-subtle,
        // --surface-alt e --surface-hover nunca foram declaradas em lugar
        // nenhum). O destino foi deduzido do uso, nao de uma definicao:
        // text-soft e text-secondary aparecem em metadado, legenda e item
        // inativo do sumario -- papel de --text-muted; text-primary aparece
        // onde se quer o texto normal -- papel de --text; surface-subtle e
        // surface-alt aparecem em painel discreto (pilula de tag, figura,
        // aside, caixa de fontes, barra do editor) -- papel de --surface-2;
        // e surface-hover so aparece como hover sobre surface-alt, entao
        // recebe --border, um tom acima, senao o hover nao apareceria.
        // Se um dia essas variaveis forem criadas de verdade, e aqui que se
        // aponta para elas.
        "text-soft": "var(--text-muted)",
        "text-secondary": "var(--text-muted)",
        "text-primary": "var(--text)",
        "surface-subtle": "var(--surface-2)",
        "surface-alt": "var(--surface-2)",
        "surface-hover": "var(--border)",
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
