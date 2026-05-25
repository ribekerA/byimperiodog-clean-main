// Compute SHA-256 hex for the internal phrase
const { webcrypto } = require('crypto');
const enc = new TextEncoder();
const phrase = 'byid-internal-v1-2025';
(async () => {
  const buf = await webcrypto.subtle.digest('SHA-256', enc.encode(phrase));
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  console.log(hex);
})();

