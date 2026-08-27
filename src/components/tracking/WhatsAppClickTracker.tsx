"use client";

import { useEffect } from "react";

import { trackWhatsAppClick, type WhatsAppPlacement } from "@/lib/events";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/whatsapp";

/**
 * Mede o clique em WhatsApp com UM ouvinte delegado, montado uma única vez.
 *
 * Por que não um onClick em cada CTA: são 59 arquivos com link de WhatsApp.
 * Cada onClick novo é uma chance de o mesmo clique ser contado duas vezes —
 * componente pai e filho ambos escutando, listener global somado ao inline,
 * gtag somado a uma tag do GTM. Um único ouvinte no `document` não tem como
 * duplicar: o clique passa por ele exatamente uma vez, e é ele quem decide.
 *
 * Fase de captura de propósito. Vários cards de filhote chamam
 * `stopPropagation()` para o clique no botão não abrir o modal do card; na
 * fase de borbulha esse `stopPropagation` mataria a medição. Na captura o
 * ouvinte roda ANTES de qualquer handler de componente, então o evento é
 * registrado mesmo quando o componente interrompe a propagação depois.
 *
 * Não chama `preventDefault`, não segura o clique, não abre nada: o navegador
 * segue com o link normalmente e o WhatsApp abre sem atraso perceptível. Se
 * `trackWhatsAppClick` lançar, o try/catch garante que o link abre do mesmo
 * jeito — medição nunca pode ficar na frente do atendimento.
 */

/** Só conta link que fala com o número do canil. */
const DIGITOS_DO_CANIL = (() => {
  const doEnv = WHATSAPP_LINK.replace(/\D/g, "");
  return doEnv.length >= 10 ? doEnv : WHATSAPP_NUMBER;
})();

const PLACEMENTS_VALIDOS = new Set<string>([
  "hero",
  "header",
  "floating_button",
  "catalog_card",
  "product_detail",
  "reservation",
  "contact",
  "blog",
  "gallery",
  "footer",
  "content",
  "other",
]);

const PLACEMENTS_LEGADOS: Record<string, WhatsAppPlacement> = {
  puppy_card: "catalog_card",
  puppy_page: "product_detail",
  reels: "gallery",
  contact_section: "contact",
};

/**
 * Link de contato x link de compartilhamento.
 *
 * `ShareButtons` também aponta para wa.me, mas para `wa.me/?text=` — sem
 * número, porque quem escolhe o destinatário é o visitante. Isso é
 * compartilhar um artigo, não iniciar atendimento: contar como conversão de
 * WhatsApp inflaria o Ads com gente que nunca falou com o canil. Exigir o
 * número do canil no href separa os dois casos por estrutura, não por adivinha.
 */
function ehLinkDeContato(href: string): boolean {
  if (!href) return false;
  let url: URL;
  try {
    url = new URL(href, window.location.origin);
  } catch {
    return false;
  }

  const host = url.hostname.toLowerCase();
  if (host === "wa.me" || host === "api.whatsapp.com" || host === "web.whatsapp.com") {
    const numeroNoCaminho = url.pathname.replace(/\D/g, "");
    const numeroNaQuery = (url.searchParams.get("phone") ?? "").replace(/\D/g, "");
    const numero = numeroNoCaminho || numeroNaQuery;
    return numero.length > 0 && numero.endsWith(DIGITOS_DO_CANIL.slice(-11));
  }
  if (url.protocol === "whatsapp:") {
    const numero = (url.searchParams.get("phone") ?? "").replace(/\D/g, "");
    return numero.length > 0 && numero.endsWith(DIGITOS_DO_CANIL.slice(-11));
  }
  return false;
}

function lerPlacement(elemento: Element): WhatsAppPlacement {
  const anotado = elemento.closest<HTMLElement>("[data-wa-placement]");
  const valor = anotado?.dataset.waPlacement?.trim();
  if (valor && PLACEMENTS_VALIDOS.has(valor)) return valor as WhatsAppPlacement;
  if (valor && PLACEMENTS_LEGADOS[valor]) return PLACEMENTS_LEGADOS[valor];

  // Sem anotação, deduz do que a página já diz sobre o elemento — melhor um
  // palpite estrutural verificável do que jogar tudo em "other".
  if (elemento.closest("footer")) return "footer";
  const fixo = elemento.closest<HTMLElement>("[class*='fixed'],[class*='sticky']");
  if (fixo) return "floating_button";
  if (elemento.closest("[data-puppy-slug],article[data-puppy]")) return "catalog_card";

  const path = window.location.pathname;
  if (/^\/filhotes\/[^/]+$/.test(path)) return "product_detail";
  if (path === "/reserve-seu-filhote") return "reservation";
  if (path === "/contato") return "contact";
  if (path === "/blog" || path.startsWith("/blog/")) return "blog";
  if (path === "/galeria") return "gallery";
  return "content";
}

function lerPuppySlug(elemento: Element): string | null {
  const anotado = elemento.closest<HTMLElement>("[data-wa-puppy],[data-puppy-slug]");
  const valor = anotado?.dataset.waPuppy ?? anotado?.dataset.puppySlug;
  const limpo = valor?.trim();
  if (limpo) return limpo;

  const naRota = window.location.pathname.match(/^\/filhotes\/([^/]+)$/);
  return naRota ? naRota[1] : null;
}

export default function WhatsAppClickTracker() {
  useEffect(() => {
    function anotarGatilho(gatilho: HTMLElement) {
      const ehAncora = gatilho instanceof HTMLAnchorElement;
      const ehContato = ehAncora
        ? ehLinkDeContato(gatilho.getAttribute("href") ?? "")
        : gatilho.dataset.waCta === "true";
      if (ehContato && !gatilho.dataset.analytics) {
        gatilho.dataset.analytics = "whatsapp-click";
      }
    }

    function anotarArvore(raiz: ParentNode) {
      if (raiz instanceof HTMLElement && raiz.matches('a[href],[data-wa-cta="true"]')) {
        anotarGatilho(raiz);
      }
      raiz
        .querySelectorAll<HTMLElement>('a[href],[data-wa-cta="true"]')
        .forEach(anotarGatilho);
    }

    // O atributo deixa todos os CTAs verificáveis por testes e DevTools sem
    // espalhar handlers de medição por dezenas de componentes. O observer só
    // anota elementos; o disparo continua pertencendo ao único listener abaixo.
    anotarArvore(document);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) anotarArvore(node);
        });
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    function aoClicar(evento: MouseEvent) {
      const alvo = evento.target;
      if (!(alvo instanceof Element)) return;

      // `data-wa-cta` cobre o CTA que não é <a>: o botão flutuante abre o
      // WhatsApp por window.open e não tem href para casar.
      const gatilho = alvo.closest<HTMLElement>('a[href],[data-wa-cta="true"]');
      if (!gatilho) return;

      const ehAncora = gatilho instanceof HTMLAnchorElement;
      if (ehAncora && !ehLinkDeContato(gatilho.getAttribute("href") ?? "")) return;
      if (!ehAncora && gatilho.dataset.waCta !== "true") return;
      anotarGatilho(gatilho);

      try {
        trackWhatsAppClick({
          placement: lerPlacement(gatilho),
          puppySlug: lerPuppySlug(gatilho),
        });
      } catch {
        // Medição quebrada não pode impedir o WhatsApp de abrir.
      }
    }

    document.addEventListener("click", aoClicar, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", aoClicar, true);
    };
  }, []);

  return null;
}
