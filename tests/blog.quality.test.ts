import { describe, expect, it } from "vitest";

import { isPublishableSupabasePost, MIN_SUPABASE_BODY_CHARS } from "@/lib/blog/publishable";
import {
  contarLinksInternos,
  contarPalavras,
  PALAVRAS_MIN,
  reprovacoesDoPost,
} from "@/lib/blog/quality";

/**
 * O que estes testes protegem
 * ---------------------------
 * Um artigo em content/posts/*.mdx nao chega ao ar sem passar por
 * scripts/quality-gate.mjs no prebuild. Uma linha em `blog_posts` chegava, e a
 * unica barreira era ter 800 caracteres de corpo. Os testes abaixo travam o
 * lado do banco: se alguem afrouxar o portao, um deles quebra.
 */

/** Corpo longo e valido: passa dos 800 caracteres e das 600 palavras. */
function corpoValido(): string {
  const paragrafo =
    "O Spitz Alemao Anao adulto pesa entre um quilo e meio e tres quilos e meio, " +
    "e a pelagem dupla exige escovacao regular para nao formar nos junto a pele. " +
    "Filhote separado da mae cedo demais chega ansioso, e isso aparece na rotina " +
    "de sono das primeiras semanas na casa nova. ";
  return (
    "# Guia\n\nVeja tambem os [filhotes disponiveis](/filhotes).\n\n" +
    paragrafo.repeat(45)
  );
}

function postValido(extra: Record<string, unknown> = {}) {
  return {
    status: "published",
    title: "Guia do Spitz Alemao Anao",
    excerpt: "O que muda na rotina nas primeiras semanas com um filhote em casa.",
    seo_description: "O que muda na rotina nas primeiras semanas com um filhote em casa.",
    published_at: "2026-08-20T12:00:00.000Z",
    content_mdx: corpoValido(),
    ...extra,
  };
}

describe("contagem de palavras e links", () => {
  it("nao conta a sintaxe do markdown como palavra", () => {
    const mdx = "## Titulo\n\n![alt de imagem](/foto.jpg)\n\n```js\nconst a = 1;\n```\n\nDuas palavras";
    // Sobram apenas "Titulo", "Duas" e "palavras": o alt da imagem, o bloco de
    // codigo e os sinais de marcacao saem antes da contagem.
    expect(contarPalavras(mdx)).toBe(3);
  });

  it("conta o texto do link, nao a URL", () => {
    expect(contarPalavras("[ver filhotes](/filhotes)")).toBe(2);
  });

  it("so conta como interno o link que comeca com barra", () => {
    const mdx = "[a](/filhotes) [b](https://fci.be) [c](/blog/x) [d](#ancora)";
    expect(contarLinksInternos(mdx)).toBe(2);
  });
});

describe("reprovacoesDoPost", () => {
  it("aprova um post completo", () => {
    expect(reprovacoesDoPost(postValido())).toEqual([]);
  });

  it("reprova sem titulo", () => {
    const r = reprovacoesDoPost(postValido({ title: "   " }));
    expect(r.map((x) => x.regra)).toContain("title");
  });

  it("reprova sem data de publicacao", () => {
    const r = reprovacoesDoPost(postValido({ published_at: null }));
    expect(r.map((x) => x.regra)).toContain("published_at");
  });

  it("aceita excerpt quando seo_description falta, e reprova quando faltam os dois", () => {
    expect(reprovacoesDoPost(postValido({ seo_description: null }))).toEqual([]);
    const r = reprovacoesDoPost(postValido({ seo_description: null, excerpt: null }));
    expect(r.map((x) => x.regra)).toContain("description");
  });

  it("reprova artigo fino", () => {
    const r = reprovacoesDoPost(postValido({ content_mdx: "Texto curto. [link](/filhotes)" }));
    const fino = r.find((x) => x.regra === "conteudo-fino");
    expect(fino).toBeDefined();
    expect(fino?.detalhe).toContain(String(PALAVRAS_MIN));
  });

  it("reprova artigo sem nenhum link interno", () => {
    const semLink = corpoValido().replace("[filhotes disponiveis](/filhotes)", "filhotes");
    const r = reprovacoesDoPost(postValido({ content_mdx: semLink }));
    expect(r.map((x) => x.regra)).toContain("link-interno");
  });

  it("junta todas as reprovacoes de uma vez, em vez de parar na primeira", () => {
    const r = reprovacoesDoPost({
      status: "published",
      title: null,
      published_at: null,
      content_mdx: "curto",
    });
    expect(r.length).toBeGreaterThan(2);
  });
});

describe("marcas de rascunho automatico", () => {
  // Cada string abaixo saiu de um fallback real que existia nas rotas de IA
  // quando OPENAI_API_KEY estava ausente. Os fallbacks foram removidos, mas
  // linha gravada antes disso continua no banco.
  const marcas = [
    "(Conteúdo placeholder offline para adestramento - substituir quando OPENAI disponível)",
    "Parágrafo de aprofundamento (1) sobre adestramento, cobrindo aspectos praticos.",
    "Contextualização inicial sobre adestramento focado em filhotes de Spitz Alemão.",
    "Resumo prático desta seção será expandido em revisão.",
    "_Tradução placeholder (en-US)_",
    "[AI] gere um texto sobre",
  ];

  for (const marca of marcas) {
    it(`reprova corpo que contem: ${marca.slice(0, 45)}...`, () => {
      const post = postValido({ content_mdx: corpoValido() + "\n\n" + marca });
      const r = reprovacoesDoPost(post);
      expect(r.map((x) => x.regra)).toContain("rascunho-automatico");
    });
  }

  it("nao confunde texto legitimo com marca de rascunho", () => {
    const post = postValido({
      content_mdx: corpoValido() + "\n\nA introducao do filhote a casa nova leva dias.",
    });
    expect(reprovacoesDoPost(post)).toEqual([]);
  });
});

describe("isPublishableSupabasePost", () => {
  it("recusa post que nao esta publicado", () => {
    expect(isPublishableSupabasePost(postValido({ status: "draft" }))).toBe(false);
  });

  it("recusa corpo abaixo do piso de caracteres", () => {
    expect(
      isPublishableSupabasePost(postValido({ content_mdx: "x".repeat(MIN_SUPABASE_BODY_CHARS - 1) }))
    ).toBe(false);
  });

  it("aceita post completo e publicado", () => {
    expect(isPublishableSupabasePost(postValido())).toBe(true);
  });

  it("recusa o rascunho de IA que passava so por ter mais de 800 caracteres", () => {
    // Este e o caso que motivou o portao: texto longo o bastante para o corte
    // antigo, curto e generico o bastante para nao ser artigo.
    const enchimento =
      "Parágrafo de aprofundamento (1) sobre adestramento, cobrindo aspectos práticos, " +
      "exemplos reais e dicas aplicáveis para tutores de Spitz Alemão.\n\n";
    const corpo = enchimento.repeat(8);
    expect(corpo.length).toBeGreaterThan(MIN_SUPABASE_BODY_CHARS);
    expect(isPublishableSupabasePost(postValido({ content_mdx: corpo }))).toBe(false);
  });
});
