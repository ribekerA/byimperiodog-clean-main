/** Production properties must never receive localhost or deploy-preview traffic. */
export function isProductionTrackingHost(hostname?: string): boolean {
  const host = hostname ?? (typeof window === 'undefined' ? '' : window.location.hostname);
  return ['byimperiodog.com.br', 'www.byimperiodog.com.br'].includes(host.toLowerCase());
}
