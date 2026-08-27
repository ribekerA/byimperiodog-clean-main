/**
 * Matriz de verdade pública — regressão nos dois sentidos.
 *
 * Um guard só serve se falhar quando deve E passar quando deve. O bloco de
 * baixo cobre a segunda metade, que é a que costuma faltar: se `verificarTexto`
 * começar a acusar artigo educativo, o build cai por texto correto e a resposta
 * natural de quem estiver com pressa é desligar o guard. Guard barulhento morre.
 */

import { describe, expect, it } from "vitest";

import {
  FATOS_PUBLICOS,
  MARCADORES_DE_PRIMEIRA_PESSOA,
  REGRAS_DE_VERDADE,
  verificarTexto,
} from "@/domain/public-truth";

const idsDe = (texto: string) => verificarTexto(texto).map((v) => v.regra.id);

describe("verificarTexto — o que NÃO pode passar", () => {
  it("pega laudo como item entregue pelo canil", () => {
    expect(idsDe("Todos os filhotes saem com laudo veterinário dos pais.")).toContain(
      "laudo-entregue",
    );
  });

  it("pega exame de patela em qualquer contexto de oferta", () => {
    expect(idsDe("Fazemos teste de patela em todos os reprodutores.")).toContain(
      "exame-de-patela",
    );
  });

  it("pega microchip anunciado como incluso", () => {
    expect(idsDe("O filhote vem com microchip e carteira de vacinação.")).toContain(
      "microchip-incluso",
    );
  });

  it("pega nota fiscal na lista de entrega", () => {
    expect(idsDe("Cada filhote sai com contrato e nota fiscal.")).toContain(
      "nota-fiscal-inclusa",
    );
  });

  it("pega estrutura física inventada", () => {
    expect(idsDe("A maternidade climatizada tem câmeras 24h.")).toContain("estrutura-fisica");
  });

  it("pega rede de parceiros", () => {
    expect(idsDe("Indicamos groomers parceiros na sua cidade.")).toContain("rede-de-parceiros");
  });

  it("pega processo de entrevista de famílias", () => {
    expect(idsDe("Veja as etapas: entrevista, socialização e entrega.")).toContain(
      "selecao-de-familias",
    );
    expect(idsDe("Entenda como selecionamos cada família.")).toContain("selecao-de-familias");
  });

  it("pega contagem de clientes e nota média sem fonte", () => {
    expect(idsDe("Atingimos a marca de 100 famílias em todo o Brasil.")).toContain(
      "numeros-sem-fonte",
    );
    expect(idsDe("Nota 5,0 em 180 avaliações.")).toContain("numeros-sem-fonte");
  });

  it("pega superlativo sobre o próprio negócio", () => {
    expect(idsDe("Somos o melhor canil de Spitz do Brasil.")).toContain("superlativo");
  });

  it("pega compromisso vitalício", () => {
    expect(idsDe("Você recebe mentoria vitalícia com a criadora.")).toContain("vitalicio");
  });

  it("pega garantia de saúde como promessa do canil", () => {
    expect(idsDe("Nossos filhotes têm garantia de saúde genética.")).toContain(
      "garantia-de-saude",
    );
  });

  it("pega frete grátis", () => {
    expect(idsDe("Entrega grátis para a Grande São Paulo.")).toContain("frete-gratis");
  });

  it("pega urgência fabricada", () => {
    expect(idsDe("⚡ Último desta cor")).toContain("urgencia-fabricada");
    expect(idsDe("Restam apenas 2 filhotes desta ninhada.")).toContain("urgencia-fabricada");
    expect(idsDe("Disponibilidade limitada — fale agora.")).toContain("urgencia-fabricada");
  });

  it("pega procura usada como justificativa de preço", () => {
    expect(
      idsDe("A fêmea custa R$ 1.000 a mais que o macho, por conta da maior procura."),
    ).toContain("procura-como-justificativa");
  });

  it("pega o canil se colocando como operador do transporte", () => {
    expect(idsDe("Fazemos entrega em todo o estado de Minas Gerais.")).toContain(
      "entrega-como-servico-proprio",
    );
    expect(idsDe("A entrega é segura, com transporte especializado para filhotes.")).toContain(
      "entrega-como-servico-proprio",
    );
    expect(idsDe("Entregamos em todo o Brasil com transporte humanizado.")).toContain(
      "entrega-como-servico-proprio",
    );
  });

  it("pega o ano de fundação errado", () => {
    expect(idsDe("Criamos Spitz Alemão Anão desde 2012.")).toContain("ano-errado");
  });

  it("pega adequação a crianças prometida pelo canil", () => {
    expect(idsDe("Nossos filhotes são excelentes para famílias com crianças.")).toContain(
      "crianca-como-garantia",
    );
  });
});

describe("verificarTexto — o que PRECISA passar", () => {
  it("deixa o artigo educativo explicar luxação de patela", () => {
    const artigo =
      "A luxação de patela é uma condição ortopédica comum em cães de porte pequeno. " +
      "O diagnóstico é feito pelo médico-veterinário, que classifica a luxação em graus. " +
      "Se o seu cão mancar ou pular com uma pata suspensa, procure um profissional.";
    expect(verificarTexto(artigo)).toHaveLength(0);
  });

  it("deixa o artigo explicar o que é um laudo, sem o canil prometer um", () => {
    const artigo =
      "Um laudo veterinário é o documento em que o profissional registra o resultado de um exame. " +
      "Peça ao criador a documentação que ele apresenta antes da compra.";
    expect(verificarTexto(artigo)).toHaveLength(0);
  });

  it("deixa o artigo explicar microchip como conceito", () => {
    const artigo =
      "O microchip é um identificador do tamanho de um grão de arroz aplicado sob a pele. " +
      "Algumas cidades exigem a identificação; consulte a legislação do seu município.";
    expect(verificarTexto(artigo)).toHaveLength(0);
  });

  it("deixa passar a formulação aprovada da identificação", () => {
    const texto =
      "A identificação do animal segue os requisitos exigidos pela legislação aplicável.";
    expect(verificarTexto(texto)).toHaveLength(0);
  });

  it("deixa passar a lista de entrega confirmada", () => {
    const texto =
      "Todos os filhotes saem com registro oficial, consulta veterinária, hemograma completo, " +
      "carteira de vacinação assinada pelo médico-veterinário, histórico de vermifugação e contrato.";
    expect(verificarTexto(texto)).toHaveLength(0);
  });

  it("deixa passar visita e transporte na formulação hedgeada", () => {
    const texto =
      "Visitas são combinadas caso a caso com a criadora. " +
      "O tutor retira o filhote em Bragança Paulista (SP) ou consulta opções de transporte " +
      "especializado, definidas conforme destino, idade e condições do filhote.";
    expect(verificarTexto(texto)).toHaveLength(0);
  });

  it("não confunde regulamento com promessa", () => {
    // O prompt do matchmaker precisa citar a frase que proíbe.
    const regra =
      'Nunca prometa microchip incluso. Frases como "é o último dessa cor" são proibidas em qualquer contexto.';
    expect(verificarTexto(regra)).toHaveLength(0);
  });

  it("deixa passar afirmação sobre a raça, não sobre o estoque", () => {
    const texto =
      "O Spitz Alemão Anão é uma das raças de pequeno porte mais procuradas do Brasil.";
    expect(verificarTexto(texto)).toHaveLength(0);
  });

  it("deixa passar suporte pós-venda sem prazo inventado", () => {
    const texto = "Você tem mentoria pós-venda direta com a criadora pelo WhatsApp.";
    expect(verificarTexto(texto)).toHaveLength(0);
  });

  it("não acusa texto vazio", () => {
    expect(verificarTexto("")).toHaveLength(0);
    expect(verificarTexto("   \n\n  ")).toHaveLength(0);
  });
});

describe("integridade da matriz", () => {
  it("não tem regra com id repetido", () => {
    const ids = REGRAS_DE_VERDADE.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("não tem fato com id repetido", () => {
    const ids = FATOS_PUBLICOS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("toda regra tem motivo escrito", () => {
    for (const regra of REGRAS_DE_VERDADE) {
      expect(regra.motivo.length, `regra ${regra.id} sem motivo`).toBeGreaterThan(20);
    }
  });

  it("nenhum padrão usa a flag global", () => {
    // Regex com /g carrega lastIndex entre chamadas: a segunda ocorrência
    // do mesmo arquivo passaria batida. É o tipo de furo que só aparece
    // quando alguém já publicou a frase.
    for (const regra of REGRAS_DE_VERDADE) {
      expect(regra.padrao.global, `regra ${regra.id} usa /g`).toBe(false);
    }
    expect(MARCADORES_DE_PRIMEIRA_PESSOA.global).toBe(false);
  });
});
