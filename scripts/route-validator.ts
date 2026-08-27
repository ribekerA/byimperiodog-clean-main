#!/usr/bin/env node

/**
 * Route Validator Script
 *
 * Valida rotas públicas do Next.js app/:
 * 1. Varre estrutura de pastas em app/
 * 2. Faz fetch em http://localhost:3000 para rotas críticas
 * 3. Verifica: status HTTP, <title>, autenticação de /admin
 * 4. Gera relatório JSON com erros e avisos
 *
 * Uso:
 *   pnpm route:validate
 *   npm run route:validate
 *
 * Requisitos:
 *   - Servidor Next.js rodando em http://localhost:3000
 *   - Node.js 18+ (com fetch nativo)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(PROJECT_ROOT, 'app');

const ADMIN_ROUTES = ['/admin', '/admin/login', '/admin/dashboard'];
const PUBLIC_ROUTES_TO_TEST = [
  '/',
  '/filhotes',
  '/blog',
  '/sobre',
  '/contato',
  '/comprar-spitz-anao',
  '/reserve-seu-filhote',
  '/preco-spitz-anao',
  '/filhotes/cor/branco',
  '/spitz-alemao-branco',
  '/politica-de-privacidade',
  '/politica-editorial',
  '/termos-de-uso',
  '/faq-do-tutor',
  '/criador-spitz-confiavel',
];

interface RouteInfo {
  path: string;
  type: 'file' | 'directory';
  dynamic: boolean;
}

interface FetchResult {
  route: string;
  statusCode: number;
  statusText: string;
  title: string | null;
  titleLanguage: string | null;
  contentLength: number;
  responseTime: number;
}

/**
 * Rota que não pôde sequer ser buscada — servidor fora do ar, DNS, timeout,
 * porta errada. Não é rota "sem erro": é ausência de evidência.
 *
 * Antes deste tipo existir, o fetch devolvia `null`, o `null` era descartado
 * em silêncio pelo `if (result)` do relatório, e um servidor desligado fazia o
 * validador imprimir "🎉 Todas as rotas estão OK!" com zero rota testada e sair
 * com código 0 — o pior defeito possível num portão de CI, porque o verde vinha
 * da falta de prova.
 */
interface FetchFailure {
  route: string;
  url: string;
  reason: string;
}

function isFailure(resultado: FetchResult | FetchFailure): resultado is FetchFailure {
  return (resultado as FetchFailure).reason !== undefined;
}

interface ValidationReport {
  timestamp: string;
  baseUrl: string;
  summary: {
    // `totalRoutesTested` é quantas rotas o validador TENTOU. `routesReached`
    // é quantas responderam. As duas precisam ser iguais para o relatório
    // significar alguma coisa: a diferença entre elas é evidência que faltou.
    totalRoutesTested: number;
    routesReached: number;
    successCount: number;
    errorCount: number;
    warningCount: number;
  };
  errors: {
    route404: FetchResult[];
    adminAccessible: FetchResult[];
    titleMissing: FetchResult[];
    unreachable: FetchFailure[];
  };
  warnings: {
    titleNotPt: FetchResult[];
    slowResponse: FetchResult[];
  };
  rawData: FetchResult[];
}

/**
 * Varre diretório app/ recursivamente e extrai rotas
 */
async function scanAppDirectory(dir: string, basePath = ''): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      // Ignorar pastas/arquivos especiais
      if (
        entry.name.startsWith('(') ||
        entry.name.startsWith('[') ||
        entry.name.startsWith('_') ||
        entry.name.startsWith('.')
      ) {
        if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
          // Rota dinâmica: [slug], etc
          const routePath = path.join(basePath, entry.name);
          routes.push({
            path: routePath,
            type: 'directory',
            dynamic: true,
          });
        }
        // Ignorar outras pastas especiais
        continue;
      }

      const fullPath = path.join(dir, entry.name);
      const routePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        routes.push({
          path: routePath,
          type: 'directory',
          dynamic: false,
        });
        // Recursar
        const subRoutes = await scanAppDirectory(fullPath, routePath);
        routes.push(...subRoutes);
      } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
        // Encontrou page file
        const parentDir = path.dirname(routePath);
        routes.push({
          path: parentDir || '/',
          type: 'file',
          dynamic: false,
        });
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao ler ${dir}:`, error);
  }

  return routes;
}

/**
 * Extrai idioma da tag <title> usando padrões conhecidos
 */
function detectTitleLanguage(title: string | null): string | null {
  if (!title) return null;

  // Palavras-chave em português
  const ptKeywords = [
    'filhote',
    'spitz',
    'alemão',
    'imperio',
    'dog',
    'pomerânia',
    'comprar',
    'criador',
    'anão',
    'contato',
    'sobre',
    'blog',
    'guia',
    'tutor',
    'cuidado',
    'preço',
    'reserv',
  ];

  // Palavras-chave em outros idiomas
  const otherLanguages: Record<string, string[]> = {
    hu: ['pomerániai', 'kölyökkutyák', 'élhető', 'prémium', 'kolyok'],
    en: ['puppy', 'puppies', 'breeder', 'dog', 'price', 'contact', 'about'],
    es: ['cachorro', 'criador', 'perro', 'precio', 'contacto'],
    de: ['welpe', 'züchter', 'hund', 'preis', 'kontakt'],
  };

  const titleLower = title.toLowerCase();

  // Verificar húngaro (critério mais rigoroso porque é problema conhecido)
  if (otherLanguages.hu.some(word => titleLower.includes(word))) {
    return 'hu';
  }

  // Verificar português
  if (ptKeywords.some(word => titleLower.includes(word))) {
    return 'pt-BR';
  }

  // Verificar outros idiomas
  for (const [lang, keywords] of Object.entries(otherLanguages)) {
    if (keywords.some(word => titleLower.includes(word))) {
      return lang;
    }
  }

  // Se nenhum padrão, considerar desconhecido
  return 'unknown';
}

/**
 * Extrai <title> do HTML
 */
function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * Faz fetch de uma rota e coleta informações
 */
async function fetchRoute(
  baseUrl: string,
  route: string,
  timeout = 5000,
  redirect: RequestRedirect = 'follow'
): Promise<FetchResult | FetchFailure> {
  const url = new URL(route, baseUrl).toString();
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'GET',
      redirect,
      signal: controller.signal,
      headers: {
        'User-Agent': 'RouteValidator/1.0 (Node.js)',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Ler body para extrair title
    const html = await response.text();
    const title = extractTitle(html);
    const titleLanguage = detectTitleLanguage(title);

    return {
      route,
      statusCode: response.status,
      statusText: response.statusText,
      title: title || null,
      titleLanguage,
      contentLength: html.length,
      responseTime,
    };
  } catch (error) {
    // Devolver `null` aqui era o mesmo que não ter testado a rota: quem chama
    // não conseguia distinguir "não respondeu" de "não perguntei". A falha
    // agora viaja com o motivo, e o relatório a conta como erro.
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`⚠️  Erro ao buscar ${url}: ${reason}`);
    return { route, url, reason };
  }
}

/**
 * Valida título de página
 */
function validateTitle(result: FetchResult): boolean {
  if (!result.title) return false;
  if (result.titleLanguage !== 'pt-BR') return false;
  // Title deve ter algum comprimento mínimo
  return result.title.length >= 10;
}

/**
 * Verifica se é rota admin
 */
function isAdminRoute(route: string): boolean {
  return route.startsWith('/admin');
}

/**
 * Detecta idioma não-português no título
 */
function hasNonPtTitle(result: FetchResult): boolean {
  return (
    result.title !== null &&
    result.titleLanguage !== null &&
    result.titleLanguage !== 'pt-BR' &&
    result.titleLanguage !== 'unknown'
  );
}

/**
 * Gera relatório de validação
 */
async function generateReport(baseUrl: string): Promise<ValidationReport> {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                      🔍 Route Validator - Iniciando                         ║
╚════════════════════════════════════════════════════════════════════════════╝

📍 Base URL: ${baseUrl}
📂 Testando ${PUBLIC_ROUTES_TO_TEST.length} rotas públicas
🔐 Testando ${ADMIN_ROUTES.length} rotas admin

Aguarde enquanto fazemos o fetch das rotas...
`);

  const results: FetchResult[] = [];
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    baseUrl,
    summary: {
      totalRoutesTested: 0,
      routesReached: 0,
      successCount: 0,
      errorCount: 0,
      warningCount: 0,
    },
    errors: {
      route404: [],
      adminAccessible: [],
      titleMissing: [],
      unreachable: [],
    },
    warnings: {
      titleNotPt: [],
      slowResponse: [],
    },
    rawData: [],
  };

  // Testar rotas públicas
  console.log('\n📄 Testando rotas públicas...');
  for (const route of PUBLIC_ROUTES_TO_TEST) {
    process.stdout.write(`  ├─ ${route.padEnd(35)} `);
    const result = await fetchRoute(baseUrl, route);

    // Rota que não respondeu não é rota sem problema.
    if (isFailure(result)) {
      report.errors.unreachable.push(result);
      console.log(`❌ INACESSÍVEL — ${result.reason}`);
    } else {
      results.push(result);
      report.rawData.push(result);

      // Registrar erros
      if (result.statusCode === 404) {
        report.errors.route404.push(result);
        console.log(`❌ 404 NOT FOUND`);
      } else if (!validateTitle(result)) {
        report.errors.titleMissing.push(result);
        console.log(`⚠️  ${result.statusCode} - Title: ${result.title?.substring(0, 30) || '(vazio)'}`);
      } else {
        console.log(`✅ ${result.statusCode} - ${result.title?.substring(0, 40) || 'OK'}`);
      }

      // Registrar avisos
      if (hasNonPtTitle(result)) {
        report.warnings.titleNotPt.push(result);
      }

      if (result.responseTime > 2000) {
        report.warnings.slowResponse.push(result);
      }
    }
  }

  // Testar rotas /admin (devem ter proteção)
  console.log('\n🔐 Testando rotas admin (verificando auth)...');
  for (const route of ADMIN_ROUTES) {
    process.stdout.write(`  ├─ ${route.padEnd(35)} `);
    // Não seguir o redirect aqui: o status 307 é justamente a evidência de
    // que a rota protegida enviou o visitante anônimo para o login.
    const result = await fetchRoute(baseUrl, route, 5000, 'manual');

    if (isFailure(result)) {
      report.errors.unreachable.push(result);
      console.log(`❌ INACESSÍVEL — ${result.reason}`);
    } else {
      results.push(result);
      report.rawData.push(result);

      // /admin/login é pública por definição; as demais devem redirecionar
      // ou negar acesso sem credenciais.
      if (route === '/admin/login' && result.statusCode === 200) {
        console.log(`✅ ${result.statusCode} - Login público`);
      } else if (result.statusCode === 200) {
        // ⚠️ Acessível sem auth! Pode ser error.
        report.errors.adminAccessible.push(result);
        console.log(`❌ ${result.statusCode} - ADMIN ACESSÍVEL SEM AUTH!`);
      } else if ([301, 302, 307, 308].includes(result.statusCode)) {
        console.log(`✅ ${result.statusCode} - Redirect (auth required)`);
      } else if (result.statusCode === 401 || result.statusCode === 403) {
        console.log(`✅ ${result.statusCode} - ${result.statusText} (auth required)`);
      } else {
        console.log(`⚠️  ${result.statusCode} - ${result.statusText}`);
      }
    }
  }

  // Calcular resumo
  //
  // `totalRoutesTested` era `results.length` — o número de rotas que RESPONDERAM.
  // Com o servidor fora do ar isso dava 0, e 0 rota com 0 erro passava no portão.
  // Agora ele é o número de rotas que a lista manda testar, um valor que não
  // depende do servidor estar de pé; quem responde vai em `routesReached`.
  report.summary.totalRoutesTested = PUBLIC_ROUTES_TO_TEST.length + ADMIN_ROUTES.length;
  report.summary.routesReached = results.length;
  report.summary.errorCount =
    report.errors.route404.length +
    report.errors.adminAccessible.length +
    report.errors.titleMissing.length +
    report.errors.unreachable.length;
  report.summary.warningCount =
    report.warnings.titleNotPt.length + report.warnings.slowResponse.length;
  report.summary.successCount =
    report.summary.routesReached -
    report.errors.route404.length -
    report.errors.adminAccessible.length -
    report.errors.titleMissing.length -
    report.summary.warningCount;

  return report;
}

/**
 * Salva relatório em JSON
 */
async function saveReport(report: ValidationReport, outputPath: string): Promise<void> {
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📊 Relatório salvo em: ${outputPath}`);
}

/**
 * Exibe resumo do relatório no terminal
 */
function printReportSummary(report: ValidationReport): void {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                        📊 RESULTADO DA VALIDAÇÃO                           ║
╚════════════════════════════════════════════════════════════════════════════╝

📈 Resumo:
  ✅ Sucesso:    ${report.summary.successCount} rotas
  ❌ Erros:      ${report.summary.errorCount} rotas
  ⚠️  Avisos:    ${report.summary.warningCount} rotas
  📡 Responderam: ${report.summary.routesReached} de ${report.summary.totalRoutesTested} rotas

`);

  // Mostrar erros críticos
  if (report.errors.unreachable.length > 0) {
    console.log('🚫 ROTAS QUE NÃO RESPONDERAM (sem evidência, contam como erro):');
    report.errors.unreachable.forEach(r => {
      console.log(`   • ${r.route} - ${r.reason}`);
    });
    console.log();
  }

  if (report.errors.route404.length > 0) {
    console.log('❌ ROTAS COM 404:');
    report.errors.route404.forEach(r => {
      console.log(`   • ${r.route} - Status ${r.statusCode}`);
    });
    console.log();
  }

  if (report.errors.titleMissing.length > 0) {
    console.log('⚠️  ROTAS COM TITLE INVÁLIDO:');
    report.errors.titleMissing.forEach(r => {
      console.log(`   • ${r.route} - Title: "${r.title || '(vazio)'}"`);
    });
    console.log();
  }

  if (report.errors.adminAccessible.length > 0) {
    console.log('🔓 ROTAS ADMIN ACESSÍVEIS SEM AUTH:');
    report.errors.adminAccessible.forEach(r => {
      console.log(`   • ${r.route} - Status ${r.statusCode}`);
    });
    console.log();
  }

  if (report.warnings.titleNotPt.length > 0) {
    console.log('🌐 ROTAS COM TITLE NÃO-PORTUGUÊS:');
    report.warnings.titleNotPt.forEach(r => {
      console.log(`   • ${r.route} - Idioma: ${r.titleLanguage} - Title: "${r.title}"`);
    });
    console.log();
  }

  if (report.warnings.slowResponse.length > 0) {
    console.log('⏱️  ROTAS COM RESPOSTA LENTA (>2s):');
    report.warnings.slowResponse.forEach(r => {
      console.log(`   • ${r.route} - ${r.responseTime}ms`);
    });
    console.log();
  }

  // A frase só pode ser dita quando todas as rotas da lista responderam. Sem
  // essa condição, ela era impressa também quando nenhuma respondeu.
  if (
    report.summary.routesReached === report.summary.totalRoutesTested &&
    report.summary.errorCount === 0 &&
    report.summary.warningCount === 0
  ) {
    console.log('🎉 Todas as rotas estão OK!');
  }

  console.log(`
📄 Relatório completo: reports/route-validation.json
⏰ Gerado em: ${report.timestamp}
`);
}

/**
 * Main
 */
async function main(): Promise<void> {
  const baseUrl = process.env.ROUTE_VALIDATOR_URL || 'http://localhost:3000';
  const outputDir = path.join(PROJECT_ROOT, 'reports');
  const outputFile = path.join(outputDir, 'route-validation.json');

  // Criar diretório reports se não existir
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch {
    // Ignorar se já existe
  }

  // Gerar relatório
  const report = await generateReport(baseUrl);

  // Salvar JSON
  await saveReport(report, outputFile);

  // Exibir resumo
  printReportSummary(report);

  // Portão fecha-fechado: verde exige evidência, não a falta dela.
  const { totalRoutesTested, routesReached, errorCount } = report.summary;

  if (routesReached === 0) {
    console.error(
      [
        ``,
        `❌ FALHA: nenhuma das ${totalRoutesTested} rotas respondeu em ${baseUrl}.`,
        ``,
        `   Servidor fora do ar, porta errada ou build ausente. Isto é falha do`,
        `   validador, não aprovação: sem página buscada não há nada a validar, e`,
        `   um relatório vazio não é um relatório limpo.`,
        ``,
        `   Suba o servidor antes de rodar:  npm run build && npm run start`,
        `   Ou aponte para outra origem:     ROUTE_VALIDATOR_URL=https://... npm run route:validate`,
        ``,
      ].join('\n'),
    );
    process.exit(1);
  }

  if (errorCount > 0) {
    // `unreachable` já entra em errorCount, então rota que caiu no meio do
    // caminho reprova aqui junto com 404 e admin aberto.
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
