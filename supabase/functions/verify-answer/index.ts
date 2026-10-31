// ============================================================================
// supabase/functions/verify-answer/index.ts — the one scoring gate.
//
// Deploy: Supabase Dashboard → Edge Functions → Create → paste this file.
// (Or `supabase functions deploy verify-answer` with the CLI.)
//
// POST { game_id, answer } with the player's Authorization header.
// · invokes with anon+user JWT (supabase-js functions.invoke does this)
// · verifies the JWT (getUser) and rejects everyone without a session
// · kind='exact'  → fingerprint(answer) must equal the stored hash
// · kind='geo'    → the same norm/Levenshtein/substring rules as geo.js
// · award via public.award_solve (atomic, one award per game per player)
// · reveal text returns ONLY after a correct answer
//
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected by the runtime.
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);

  try {
    /* ---- auth: must carry a real user JWT ---- */
    const authHeader = req.headers.get('Authorization') ?? '';
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ ok: false, error: 'no session' }, 401);
    }
    const userId = userData.user.id;

    /* ---- request shape ---- */
    const body = await req.json().catch(() => null);
    const gameId = String(body?.game_id ?? '');
    const answer = String(body?.answer ?? '');
    if (!/^[a-z0-9-]{2,40}$/.test(gameId) || !answer.trim()) {
      return json({ ok: false, error: 'bad request' }, 400);
    }

    /* ---- the sealed row (service role only, RLS shields it) ---- */
    const { data: row, error: rowErr } = await admin
      .from('puzzle_answers')
      .select('game_id, kind, answer_hash, aliases, points, reveal')
      .eq('game_id', gameId)
      .maybeSingle();
    if (rowErr || !row) return json({ ok: false, error: 'unknown game' }, 404);

    /* ---- verdict ---- */
    const correct =
      row.kind === 'exact'
        ? fingerprint(answer) === row.answer_hash
        : geoCorrect(answer, row.aliases);
    if (!correct) return json({ ok: true, correct: false });

    /* ---- award once (atomic server-side) ---- */
    const { data: award, error: awardErr } = await admin.rpc('award_solve', {
      p_user: userId,
      p_game: gameId,
      p_points: row.points,
    });
    if (awardErr) return json({ ok: false, error: 'award failed' }, 500);

    const total = (award as Array<{ newly: boolean; total: number }> | null)?.[0]?.total ?? null;
    return json({
      ok: true,
      correct: true,
      awarded: award?.[0]?.newly ? row.points : 0,
      total,
      reveal: row.reveal,
    });
  } catch (_err) {
    return json({ ok: false, error: 'server error' }, 500);
  }
});

/* ==========================================================================
   fingerprint — PORTED 1:1 from the site's vault.js. Do not "improve" it:
   the digests in puzzle_answers were produced by exactly this routine
   (tools/vault-cli.js runs the same file). Any divergence voids answers.
   ========================================================================== */
function fingerprint(text: string): string | null {
  let t = String(text == null ? '' : text).trim().replace(/\s+/g, '');
  t = t.replace(/[×✕]/g, 'x');
  t = t.replace(/\(([QRBN])\)/i, '=$1');
  t = t.replace(/[+?!#]+$/, '');
  t = t.replace(/=/g, '').toLowerCase();
  t = t.replace(/x/g, '');
  if (!t) return null;
  let h1 = 5381;
  let h2 = 2166136261;
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    h1 = (Math.imul(h1, 33) ^ c) >>> 0;
    h2 = (Math.imul(h2 ^ c, 16777619)) >>> 0;
  }
  return ('00000000' + h1.toString(16)).slice(-8) +
         ('00000000' + h2.toString(16)).slice(-8);
}

/* ==========================================================================
   geo matching — PORTED 1:1 from geo.js (norm → diacritic map + lowercase +
   letters-only; exact, both-way substring on 4+ letters, Levenshtein ≤1 on
   5-letter words and ≤2 on 6+).
   ========================================================================== */
function geoNorm(s: string): string {
  const map: Record<string, string> = {
    '\u00fe': 'th', '\u00f0': 'd', '\u00e6': 'ae', '\u00f6': 'o', '\u00e1': 'a',
    '\u00e9': 'e', '\u00ed': 'i', '\u00f3': 'o', '\u00fa': 'u', '\u00fd': 'y',
  };
  const lower = String(s).toLowerCase();
  let out = '';
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    out += map[ch] !== undefined ? map[ch] : ch;
  }
  return out.replace(/[^a-z]/g, '');
}

function lev(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev: number[] = [];
  let cur: number[] = [];
  let i: number, j: number, cost: number;
  for (j = 0; j <= b.length; j++) prev[j] = j;
  for (i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (j = 1; j <= b.length; j++) {
      cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    const tmp = prev; prev = cur; cur = tmp;
  }
  return prev[b.length];
}

function geoCorrect(input: string, aliases: unknown): boolean {
  const cand = geoNorm(input);
  if (!cand) return false;
  const list = Array.isArray(aliases) ? (aliases as string[]) : [];
  for (const alias of list) {
    const a = geoNorm(alias);
    if (!a) continue;
    if (cand === a) return true;
    if (cand.length >= 4 && (a.includes(cand) || cand.includes(a))) return true;
    const tol = cand.length >= 6 && a.length >= 6 ? 2 : (cand.length >= 5 && a.length >= 5 ? 1 : 0);
    if (tol > 0 && lev(cand, a) <= tol) return true;
  }
  return false;
}
