/**
 * Web Vitals de campo — o único coletor do site.
 *
 * O problema que isto resolve
 * --------------------------
 * O site tinha DUAS tubulações de RUM e elas não se encontravam:
 *
 *   coletor vivo   src/lib/analytics.ts#initWebVitals → /api/analytics → analytics_events
 *   painel /admin  src/components/admin/CwvPanel     → /api/rum       → rum_vitals
 *
 * Este arquivo era o único escritor de `rum_vitals` e nada o importava. Ou
 * seja: o navegador media LCP/INP/CLS e mandava para uma tabela; o painel lia
 * outra, que ninguém preenchia e que sequer tinha migration. Daí o "Nenhum
 * dado" em campo enquanto o laboratório marcava 99-100 — não era falta de
 * tráfego, era medida caindo no ralo.
 *
 * A escolha foi `/api/rum` porque ele já sabe o que fazer com a medida: p50,
 * p75, tendência diária, páginas lentas e os limiares do Google. O
 * `/api/analytics` guardava a métrica como mais um evento numa tabela de
 * eventos, sem nada que a lesse como métrica.
 *
 * O que sai daqui
 * ---------------
 * `{ name, value, id, page, device }` e nada além disso. Sem query string,
 * sem gclid, sem UTM, sem IP, sem cookie, sem hash de visitante, sem texto do
 * usuário. `device` é derivado da LARGURA da janela, não do user agent: três
 * baldes não distinguem ninguém, e a pergunta que o painel precisa responder
 * ("o LCP é ruim no celular?") não exige saber o aparelho.
 *
 * Consentimento
 * -------------
 * `analytics: false` é o padrão (opt-in). A checagem é feita aqui além de em
 * TrackingScripts: quem chamar este módulo de qualquer outro lugar herda a
 * mesma trava, em vez de depender de o chamador ter lembrado.
 */

import { getCurrentConsent } from "@/lib/consent";

const ENDPOINT = "/api/rum";

const DISABLED =
  process.env.NEXT_PUBLIC_DISABLE_ANALYTICS === "1" || process.env.DISABLE_ANALYTICS === "1";
const IS_PROD = process.env.NODE_ENV === "production";
const FORCE = process.env.NEXT_PUBLIC_FORCE_ANALYTICS === "1";

export type DeviceClass = "mobile" | "tablet" | "desktop";

export interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
}

/**
 * Três baldes por largura de viewport.
 *
 * Os cortes são os do Tailwind (`md` e `lg`), que é o que o layout deste site
 * realmente usa — então "mobile" aqui significa "recebeu o layout mobile", que
 * é exatamente a pergunta por trás de um LCP ruim.
 */
export function classificarDispositivo(largura: number): DeviceClass {
  if (!Number.isFinite(largura) || largura <= 0) return "desktop";
  if (largura < 768) return "mobile";
  if (largura < 1024) return "tablet";
  return "desktop";
}

/**
 * Só o caminho. Query string e fragmento ficam de fora.
 *
 * É onde o gclid, o utm_source e o e-mail em `?email=` entrariam no banco sem
 * ninguém decidir isso. E, para agrupar métrica por página, `?utm_source=x`
 * só faz a mesma página virar dez linhas diferentes.
 */
export function caminhoLimpo(entrada: string): string {
  const semQuery = entrada.split("?")[0]?.split("#")[0] ?? "";
  if (!semQuery.startsWith("/")) return "/";
  return semQuery.slice(0, 300);
}

// Uma métrica, um envio. web-vitals reporta uma vez por página no modo padrão,
// mas StrictMode monta o efeito duas vezes em dev e uma aba restaurada pode
// reexecutar o init — os dois viram amostra dobrada, que desloca o p75 para
// baixo justamente nas páginas mais visitadas.
const enviados = new Set<string>();

let iniciado = false;

function podeColetar(): boolean {
  if (DISABLED) return false;
  if (!IS_PROD && !FORCE) return false;
  if (typeof window === "undefined") return false;
  return getCurrentConsent().analytics === true;
}

export function enviarMetrica(metrica: WebVitalMetric): void {
  if (!podeColetar()) return;
  if (!metrica?.name || typeof metrica.value !== "number" || !Number.isFinite(metrica.value)) return;

  const chave = `${metrica.name}|${metrica.id}`;
  if (enviados.has(chave)) return;
  enviados.add(chave);

  try {
    const corpo = JSON.stringify({
      name: metrica.name,
      value: metrica.value,
      id: metrica.id,
      page: caminhoLimpo(window.location.pathname),
      device: classificarDispositivo(window.innerWidth),
    });

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const ok = navigator.sendBeacon(ENDPOINT, new Blob([corpo], { type: "application/json" }));
      if (ok) return;
    }

    void fetch(ENDPOINT, {
      method: "POST",
      body: corpo,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Medir a página nunca pode quebrar a página.
  }
}

export async function initWebVitals(
  logger: (m: WebVitalMetric) => void = enviarMetrica,
): Promise<void> {
  if (iniciado) return;
  if (!podeColetar()) return; // sem consentimento não se registra nem o listener
  iniciado = true;

  try {
    const webVitals = await import("web-vitals");
    const protege = (cb: (m: WebVitalMetric) => void) => (metrica: WebVitalMetric) => {
      try {
        cb(metrica);
      } catch {
        /* noop */
      }
    };
    webVitals.onLCP(protege(logger));
    webVitals.onINP(protege(logger));
    webVitals.onCLS(protege(logger));
    webVitals.onFCP(protege(logger));
    webVitals.onTTFB(protege(logger));
  } catch {
    iniciado = false; // pacote ausente: deixar tentar de novo em vez de travar
  }
}

/** Somente para testes: zera o estado de módulo entre casos. */
export function __resetWebVitals(): void {
  iniciado = false;
  enviados.clear();
}
