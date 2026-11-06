import { Playfair_Display } from "next/font/google";
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

/**
 * Playfair Display — a serifada dos títulos, da diretriz visual de 05/11/2026.
 *
 * Por que não é localFont como a DM Sans: não havia nenhuma serifada em
 * public/fonts, e o `next/font/google` resolve isso sem binário novo no
 * repositório. Ele baixa o arquivo no build e passa a servi-lo do nosso
 * próprio domínio — em runtime o visitante não faz pedido nenhum ao Google,
 * então não há terceiro no caminho crítico nem cookie de fonte.
 *
 * Só 600 e 700, só latin: a serifada aparece em títulos e preço, nunca em
 * corpo de texto. Pedir a variável inteira ou os pesos leves custaria bytes
 * que nenhuma tela usa. `display: "swap"` pela mesma razão da DM Sans — num
 * site onde 92% do acesso é celular, texto invisível esperando fonte é pior
 * que texto que troca de forma.
 */
export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-playfair",
  preload: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/**
 * A itálica da mesma Playfair, para "Filhotes Exclusivos" e "Sementinhas de
 * Amor" na home. Fica num objeto próprio e sem preload para não pesar nas outras
 * páginas: sem isso, o navegador sintetizava a itálica inclinando a romana.
 */
export const playfairItalica = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: "italic",
  display: "swap",
  variable: "--font-playfair-italica",
  preload: false,
  fallback: ["Georgia", "Times New Roman", "serif"],
});
