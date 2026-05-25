// Client-only helper. Use: track.event("generate_lead", { puppy_id: "..." })
type Params = Record<string, any>;

export function sendGA4(name: string, params?: Params) {
  // @ts-ignore
  const gtag = (window as any).gtag;
  if (typeof gtag === "function") {
    gtag("event", name, params || {});
  }
}

export function sendFB(name: string, params?: Params) {
  // @ts-ignore
  const fbq = (window as any).fbq;
  if (typeof fbq === "function") {
    const map: Record<string, string> = {
      generate_lead: "Lead",
      view_item: "ViewContent",
      select_item: "ViewContent",
    };
    fbq("track", map[name] || name, params || {});
  }
}

export function sendTT(name: string, params?: Params) {
  // @ts-ignore
  const ttq = (window as any).ttq;
  if (ttq && typeof ttq.track === "function") {
    const map: Record<string, string> = {
      generate_lead: "SubmitForm",
      view_item: "ViewContent",
      select_item: "ClickButton",
    };
    ttq.track(map[name] || name, params || {});
  }
}

export function sendPIN(name: string, params?: Params) {
  // @ts-ignore
  const pintrk = (window as any).pintrk;
  if (typeof pintrk === "function") {
    const map: Record<string, string> = {
      generate_lead: "lead",
      view_item: "pagevisit",
      select_item: "viewcategory",
    };
    pintrk("track", map[name] || name, params || {});
  }
}

export function event(name: string, params?: Params) {
  try {
    sendGA4(name, params);
    sendFB(name, params);
    sendTT(name, params);
    sendPIN(name, params);
    // se usar Ads via gtag, já foi coberto no sendGA4 (mesma API)
  } catch (e) {
    // silencioso
  }
}

export function page() {
  try {
    const path = typeof window !== "undefined" ? window.location.pathname : undefined;
    event("page_view", path ? { path } : undefined);
  } catch {}
}

let clicksBound = false;
export function bindClicks() {
  try {
    if (clicksBound || typeof document === "undefined") return;
    clicksBound = true;
    document.addEventListener("click", (ev) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest<HTMLElement>("[data-track-event]");
      if (!el) return;
      const name = el.getAttribute("data-track-event");
      if (!name) return;
      const paramsAttr = el.getAttribute("data-track-params");
      let params: Params | undefined;
      try { params = paramsAttr ? JSON.parse(paramsAttr) : undefined; } catch {}
      event(name, params);
    });
  } catch {}
}

// Experiments A/B helpers: emite para pixels e persiste no backend (/api/analytics)
type ExperimentPayload = { experiment: string; variant: string; [k: string]: unknown };

function postAnalytics(name: string, meta: ExperimentPayload) {
  try {
    const path = typeof window !== "undefined" ? window.location.pathname : undefined;
    const body = JSON.stringify({ name, meta, path });
    // Usa sendBeacon quando disponível para não bloquear navegação
    // @ts-ignore
    const beacon = typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function";
    if (beacon) {
      // @ts-ignore
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
      return;
    }
    // fallback fetch não bloqueante
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function experimentView(experiment: string, variant: string) {
  const meta: ExperimentPayload = { experiment, variant };
  // Pixels (GA/FB/TT/PIN)
  event("experiment_view", meta);
  // Persistência no backend
  postAnalytics("experiment_view", meta);
}

export function experimentConversion(experiment: string, variant: string, extra?: Record<string, unknown>) {
  const meta: ExperimentPayload = { experiment, variant, ...(extra || {}) };
  event("experiment_conversion", meta);
  postAnalytics("experiment_conversion", meta);
}

const tracker = { event, page, bindClicks, experimentView, experimentConversion };
export default tracker;

