// Internal lightweight auth (no env). Provides token verification for admin-like endpoints.
// Accepts either the raw phrase or a precomputed SHA-256 hex of that phrase.
// Implemented without Node 'crypto' to be Edge-compatible.

// Fixed phrase (can be rotated manually). Avoid using a publicly obvious value.
const PHRASE = 'byid-internal-v1-2025';
// Precomputed: sha256(PHRASE) in hex. If you rotate PHRASE, update this too.
// To compute locally (Node 18+):
//  node -e "(async()=>{ const { webcrypto } = require('crypto'); const phrase='byid-internal-v1-2025'; const enc=new TextEncoder(); const buf=await webcrypto.subtle.digest('SHA-256', enc.encode(phrase)); const hex=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join(''); console.log(hex); })()"
const HASH = '8ffa8b33008ae698052eb58047d47a78f7b3db6228b22a76131db07b730a9215';

export function verifyInternalToken(headerValue: string | null | undefined){
  if(!headerValue) return false;
  // Accept either the raw phrase or the precomputed hex hash of the phrase
  return headerValue === PHRASE || headerValue.toLowerCase() === HASH;
}

export function internalGuard(req: Request){
  const token = req.headers.get('x-internal-token');
  return verifyInternalToken(token);
}
