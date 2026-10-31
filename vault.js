/* ===========================================================================
   vault.js — Case Files · answer encoding (CLASSIC script, no modules)

   Answers and reveal text never appear as readable strings in this site's
   data files. DevTools → Sources shows only opaque base64 payloads and hash
   digests — not where the fall is, and not which move wins the file.

   Two primitives:
   · unlock(payload) — reverses the byte-key XOR + base64 encoding on reveal
     text, alias lists, etc. Runs from file:// (atob + TextDecoder are plain
     web APIs, not secure-context gated like SubtleCrypto).
   · fingerprint(moveText) — 64-bit digest of a written chess move, built on
     the exact normalization the game applies to typed answers (case, capture
     sign, check suffix, promotion forms all fold to one key). The stored
     side is the fingerprint of the expected move; the page compares
     digests — the expected move is never present anywhere, in any string.

   Honest limits: this hides answers from inspection. Someone driving the
   console could call unlock(payload) directly — that is deliberate mischief,
   not peeking; a server-verified submit is the real fix and is planned once
   the whole series is complete.
   ======================================================================== */
(function (host) {
  'use strict';

  /* Shared secret key (bytes) — same stream both sides. Changing it re-keys
     every payload in the data files (nobody ships re-encrypted data without
     running tools/vault-cli.js again). */
  var KEY = 'BakerStreet221B1877?';

  function unlock(payload) {
    try {
      var raw = atob(String(payload == null ? '' : payload));
      var out = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) {
        out[i] = raw.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length);
      }
      return new TextDecoder('utf-8').decode(out);
    } catch (e) { return ''; }
  }

  /* Written-move digest (chess):
     ×/✕→x · (Q)→=Q · strip trailing +?!# · strip '=' · lowercase ·
     strip 'x' on both sides ("Rbf7" == "Rbxf7+", while "Rf7" ≠) ·
     double 32-bit hash (djb2-xor ‖ FNV-1a), 16 hex chars.
     Order MUST stay identical to the fingerprint of the sealed side,
     which is produced by the same function (tools/vault-cli.js requires
     this file directly) — one implementation, never two. */
  function fingerprint(text) {
    var t = String(text == null ? '' : text).trim().replace(/\s+/g, '');
    t = t.replace(/[×✕]/g, 'x');
    t = t.replace(/\(([QRBN])\)/i, '=$1');
    t = t.replace(/[+?!#]+$/, '');
    t = t.replace(/=/g, '').toLowerCase();
    t = t.replace(/x/g, '');
    if (!t) return null;
    var h1 = 5381;
    var h2 = 2166136261;
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i);
      h1 = (Math.imul(h1, 33) ^ c) >>> 0;
      h2 = (Math.imul(h2 ^ c, 16777619)) >>> 0;
    }
    return ('00000000' + h1.toString(16)).slice(-8) +
           ('00000000' + h2.toString(16)).slice(-8);
  }

  host.SherlockVault = { unlock: unlock, fingerprint: fingerprint, key: KEY };
})(typeof window !== 'undefined' ? window : globalThis);

/* Node/CLI access (tools/vault-cli.js, test harnesses). The browser branch
   above is untouched; this file never loads in the browser as a module. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.SherlockVault;
}
