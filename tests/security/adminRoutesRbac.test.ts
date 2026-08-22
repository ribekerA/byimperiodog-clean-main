// @vitest-environment node
/**
 * Teste estrutural: toda rota administrativa declara QUAL permissao exige.
 *
 * O buraco que este teste fecha nao era falta de autenticacao — era falta de
 * autorizacao. 92 das 108 rotas sob /api/admin chamavam o portao sem opcao
 * nenhuma, entao o portao so perguntava "esta logado?". Um usuario com funcao
 * `viewer` apagava Web Story, aprovava avaliacao e trocava ID de pixel.
 *
 * Um teste de unidade por rota nao pegaria a rota NOVA que alguem escrever
 * amanha copiando uma antiga. Este pega: ele varre os arquivos e reprova
 * quando aparece handler sem portao ou portao sem permissao.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";

import { describe, expect, it } from "vitest";

const RAIZ_ADMIN = join(process.cwd(), "app", "api", "admin");

/**
 * Rotas que existem justamente para quem ainda nao tem sessao. Manter a lista
 * explicita e curta: qualquer acrescimo aqui precisa passar por revisao.
 */
const SEM_PORTAO_POR_DESENHO = new Set(["login/route.ts", "logout/route.ts"]);

const METODOS_HTTP = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

function listarRotas(dir: string): string[] {
  const achados: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      achados.push(...listarRotas(caminho));
    } else if (nome === "route.ts") {
      achados.push(caminho);
    }
  }
  return achados;
}

const rotas = listarRotas(RAIZ_ADMIN).map((caminho) => ({
  caminho,
  relativa: relative(RAIZ_ADMIN, caminho).split(sep).join(posix.sep),
  fonte: readFileSync(caminho, "utf8"),
}));

const protegidas = rotas.filter((r) => !SEM_PORTAO_POR_DESENHO.has(r.relativa));

describe("rotas /api/admin — autorizacao", () => {
  it("encontra as rotas administrativas do projeto", () => {
    expect(rotas.length).toBeGreaterThan(50);
    expect(protegidas.length).toBe(rotas.length - SEM_PORTAO_POR_DESENHO.size);
  });

  it("toda rota protegida chama o portao administrativo", () => {
    const semPortao = protegidas
      .filter((r) => !/requireAdmin(Api)?\(/.test(r.fonte))
      .map((r) => r.relativa);
    expect(semPortao).toEqual([]);
  });

  it("toda chamada do portao declara a permissao que a acao exige", () => {
    // Chamada com um argumento so = sem opcao de permissao.
    const semPermissao = protegidas
      .filter((r) => /requireAdmin(?:Api)?\(\s*[A-Za-z_$][\w$]*\s*\)/.test(r.fonte))
      .map((r) => r.relativa);
    expect(semPermissao).toEqual([]);
  });

  it("nenhum metodo exportado fica sem portao", () => {
    // Um handler exportado sem portao anula os outros: a rota inteira passa a
    // ter uma entrada aberta, mesmo que os demais metodos estejam protegidos.
    const descobertas = protegidas
      .map((rota) => {
        const exportados = METODOS_HTTP.filter((m) =>
          new RegExp(`export\\s+(?:async\\s+)?(?:function\\s+${m}\\b|const\\s+${m}\\s*=)`).test(
            rota.fonte
          )
        );
        const chamadas = rota.fonte.match(/requireAdmin(?:Api)?\(/g) ?? [];
        return { relativa: rota.relativa, exportados: exportados.length, chamadas: chamadas.length };
      })
      .filter((r) => r.exportados === 0 || r.chamadas < r.exportados);
    expect(descobertas).toEqual([]);
  });

  it("nenhuma rota le funcao do usuario de algo que o cliente envia", () => {
    const suspeitas = protegidas.filter((r) =>
      /x-admin-role|admin_role|admin_auth|getClientAdminRole/.test(r.fonte)
    );
    expect(suspeitas.map((r) => r.relativa)).toEqual([]);
  });

  it("as permissoes escritas nas rotas existem no modelo de funcoes", async () => {
    const { ALL_PERMISSIONS } = await import("@/lib/rbac");
    const conhecidas = new Set<string>(ALL_PERMISSIONS);

    const usadas = new Set<string>();
    for (const r of protegidas) {
      for (const m of r.fonte.matchAll(/permission:\s*["']([^"']+)["']/g)) usadas.add(m[1]);
    }

    expect(usadas.size).toBeGreaterThan(0);
    expect([...usadas].filter((p) => !conhecidas.has(p))).toEqual([]);
  });

  it("viewer nao alcanca nenhuma permissao de escrita", async () => {
    const { ALL_PERMISSIONS, hasPermission } = await import("@/lib/rbac");
    const escrita = ALL_PERMISSIONS.filter((p) => p.endsWith(":write"));
    expect(escrita.length).toBeGreaterThan(0);
    for (const permissao of escrita) {
      expect(hasPermission("viewer", permissao)).toBe(false);
    }
  });
});
