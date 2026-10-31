/* ===========================================================================
   tools/vault-cli.js — build-side companion to vault.js (NOT a page script).

   Never included by any HTML; run from this folder's parent with Node when
   adding a puzzle or scene:

       node tools/vault-cli.js fingerprint "Rbxf7+"     (digest of one move)
       node tools/vault-cli.js unlock "<payload>"        (verify a payload)
       node tools/vault-cli.js seal-file <in.json> <out.json>

   seal-file schema (in) — plaintext secrets live in a TEMP file, never in
   the served project:
   {
     chess:  [ { id, move, san, why, hint }, ... ],
     geo:    [ { id, title, aliases[], hints, reveal, facts[], gps, href }, ... ],
     finals: [ { id, answer, reveal }, ... ]        // final-key pages
   }
   out:
   {
     chess:   [ { id, answerHash, sanV, whyV, hintV }, ... ],
     geo:     [ { id, titleV, aliasesV, hintsV, revealV, factsV, gpsV, hrefV }, ... ],
     finals:  [ { id, answerHash, revealV }, ... ]
   }
   answerHash = fingerprint(answer); *V = base64/XOR payload of the plaintext.
   Fingerprint + unlock come straight from ../vault.js — one implementation.
   ======================================================================== */
'use strict';

var V = require('../vault.js');

function seal(plain) {
  var bytes = new (require('util').TextEncoder || TextEncoder)().encode(String(plain == null ? '' : plain));
  var key = V.key;
  var bin = '';
  for (var i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i] ^ key.charCodeAt(i % key.length));
  }
  return btoa(bin);
}

function sealAll(spec) {
  var out = { chess: [], geo: [], finals: [] };
  for (var i = 0; i < spec.chess.length; i++) {
    var c = spec.chess[i];
    if (c.move == null || !String(c.move).trim()) {
      throw new Error('chess entry "' + c.id + '" has no move');
    }
    out.chess.push({ id: c.id, answerHash: V.fingerprint(c.move), sanV: seal(c.san), whyV: seal(c.why), hintV: seal(c.hint) });
  }
  for (var j = 0; j < spec.geo.length; j++) {
    var g = spec.geo[j];
    out.geo.push({ id: g.id, titleV: seal(g.title), aliasesV: seal(JSON.stringify(g.aliases)), hintsV: seal(g.hints),
      revealV: seal(g.reveal), factsV: seal(JSON.stringify(g.facts)), gpsV: seal(g.gps), hrefV: seal(g.href) });
  }
  for (var k = 0; k < (spec.finals || []).length; k++) {
    var f = spec.finals[k];
    if (f.answer == null || !String(f.answer).trim()) {
      throw new Error('finals entry "' + f.id + '" has no answer');
    }
    out.finals.push({ id: f.id, answerHash: V.fingerprint(f.answer), revealV: seal(f.reveal) });
  }
  return out;
}

function main() {
  var mode = process.argv[2];
  if (mode === 'fingerprint') {
    console.log(V.fingerprint(process.argv[3] || ''));
    return;
  }
  if (mode === 'unlock') {
    console.log(V.unlock(process.argv[3] || ''));
    return;
  }
  if (mode === 'seal-file') {
    var fs = require('fs');
    var rawIn = fs.readFileSync(process.argv[3], 'utf8').replace(/^\uFEFF/, '');
    var result = sealAll(JSON.parse(rawIn));
    fs.writeFileSync(process.argv[4], JSON.stringify(result, null, 2), 'utf8');
    console.log('sealed ' + result.chess.length + ' chess + ' + result.geo.length + ' geo payloads -> ' + process.argv[4]);
    return;
  }
  console.log('usage: node tools/vault-cli.js fingerprint|unlock|seal-file ...');
  process.exitCode = 2;
}

if (require.main === module) main();

module.exports = { seal: seal, sealAll: sealAll, fingerprint: V.fingerprint, unlock: V.unlock };
