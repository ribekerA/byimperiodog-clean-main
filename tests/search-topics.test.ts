import { describe, expect, it } from "vitest";

import { puppiesPublicados } from "../content/puppies-static";
import { puppySearchCopy } from "../content/puppy-search-copy";
import { relatedSearchTopics, SEARCH_TOPICS } from "../content/search-topics";
import { formatarPreco } from "../src/domain/pricing";

describe("navegação por intenção de busca", () => {
  it("relaciona um artigo de apoio ao assunto e remove parâmetros de atribuição", () => {
    const links = relatedSearchTopics("/blog/preco-spitz-alemao-anao/?utm_source=google#tabela");
    expect(links.map((link) => link.id)).toEqual(["filhotes", "custo-mensal", "comprar"]);
  });

  it("envia dúvidas sobre apartamento para conteúdos úteis à mesma decisão", () => {
    expect(relatedSearchTopics("/blog/spitz-alemao-anao-bom-para-apartamento").map((link) => link.id))
      .toEqual(["latidos", "sozinho", "chegada"]);
  });

  it("não repete destinos nem recomenda a página que já está aberta", () => {
    for (const topic of SEARCH_TOPICS) {
      const paths = relatedSearchTopics(topic.href, 10).map((link) => link.href);
      expect(paths).not.toContain(topic.href);
      expect(new Set(paths).size).toBe(paths.length);
    }
  });

  it("mantém caminhos de compra para artigos ainda não classificados", () => {
    expect(relatedSearchTopics("/blog/novo-artigo").map((link) => link.href))
      .toEqual(["/filhotes", "/blog/preco-spitz-alemao-anao", "/comprar-spitz-anao"]);
    expect(relatedSearchTopics("/filhotes", 0)).toEqual([]);
  });
});

describe("fichas alinhadas à intenção e ao preço publicado", () => {
  it("gera conteúdo de busca para cada referência divulgada", () => {
    for (const puppy of puppiesPublicados) {
      const copy = puppySearchCopy(puppy);
      expect(copy?.heading).toContain("Spitz Alemão Anão");
      expect(copy?.metadataDescription).toContain("Lulu da Pomerânia");
      expect(copy?.metadataDescription).toContain(formatarPreco(puppy.priceCents));
      expect(copy?.introduction).toContain(formatarPreco(puppy.priceCents));
      expect(copy?.introduction).toContain("confirmadas no atendimento");
    }
  });

  it("atualiza título e texto de preço juntos quando a referência muda", () => {
    const copy = puppySearchCopy({ slug: "exemplo", color: "preto", sex: "female", priceCents: 910000 });
    expect(copy?.metadataDescription).toContain("R$ 9.100");
    expect(copy?.introduction).toContain("R$ 9.100");
    expect(copy?.introduction).not.toContain("R$ 8.500");
  });

  it("diferencia referências da mesma cor e sexo sem alterar as URLs", () => {
    const headings = puppiesPublicados.map((puppy) => puppySearchCopy(puppy)?.heading);
    expect(new Set(headings).size).toBe(headings.length);
  });

  it("não amplia a divulgação de cores retiradas da comunicação", () => {
    expect(puppySearchCopy({ slug: "legado", color: "wolf-sable", sex: "female", priceCents: 850000 })).toBeUndefined();
  });
});
