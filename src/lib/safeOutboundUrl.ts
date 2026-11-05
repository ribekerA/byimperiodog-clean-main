import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function isBlockedIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = octets;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113);
}

function isBlockedIp(address: string): boolean {
  if (isIP(address) === 4) return isBlockedIpv4(address);
  if (isIP(address) !== 6) return true;
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  if (normalized.startsWith("2001:db8:")) return true;
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mapped ? isBlockedIpv4(mapped) : false;
}

/** Valida destinos externos e bloqueia localhost, redes privadas e metadata. */
export async function validatePublicHttpsUrl(value: string): Promise<string> {
  let url: URL;
  try { url = new URL(value); }
  catch { throw new Error("invalid_url"); }

  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    throw new Error("https_url_required");
  }
  if (url.hostname === "localhost" || url.hostname.endsWith(".localhost") || url.hostname.endsWith(".local")) {
    throw new Error("private_destination");
  }

  const directIp = isIP(url.hostname) ? [url.hostname] : [];
  const resolved = directIp.length
    ? directIp
    : (await lookup(url.hostname, { all: true, verbatim: true })).map((item) => item.address);
  if (!resolved.length || resolved.some(isBlockedIp)) throw new Error("private_destination");
  url.hash = "";
  return url.toString();
}
