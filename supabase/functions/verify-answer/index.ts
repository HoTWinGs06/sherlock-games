// ============================================================================
// supabase/functions/verify-answer/index.ts — the one scoring gate.
// ============================================================================
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-secret-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  /* ---- service role client (bypasses RLS) ---- */
  const sr = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const url = new URL(req.url);
  const isLeaderboard = req.method === 'GET' && (
    url.pathname.endsWith('/leaderboard') ||
    url.pathname.includes('leaderboard') ||
    url.searchParams.get('action') === 'leaderboard'
  );

  const isLogs = req.method === 'GET' && (
    url.pathname.endsWith('/logs') ||
    url.pathname.includes('logs') ||
    url.searchParams.get('action') === 'logs'
  );

  /* ---- leaderboard (admin) ---- */
  if (isLeaderboard) {
    const authHeader = req.headers.get('Authorization') ?? '';
    const secretKey = req.headers.get('X-Secret-Key') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    const { data: userData, error: userErr } = await sr.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json({ ok: false, error: 'unauthorized' }, 401);
    }
    const userId = userData.user.id;
    const { data: adminRow, error: adminErr } = await sr
      .from('admins').select('id, secret_key').eq('id', userId).maybeSingle();
    if (adminErr || !adminRow || adminRow.secret_key !== secretKey) {
      return json({ ok: false, error: 'not an admin' }, 403);
    }
    const { data: adminList } = await sr.from('admins').select('id');
    const adminIdSet = new Set((adminList ?? []).map((a: any) => a.id));

    const { data: profiles, error: profilesErr } = await sr
      .from('profiles')
      .select('id, username, display_name, total_points, tier')
      .order('total_points', { ascending: false });
    if (profilesErr) {
      return json({ ok: false, error: 'query failed: ' + profilesErr.message }, 500);
    }
    const cleanProfiles = (profiles ?? [])
      .filter((p: any) => !adminIdSet.has(p.id) && (p.username || p.display_name))
      .map((p: any) => ({
        username: p.username || p.display_name,
        total_points: p.total_points ?? 0,
        tier: p.tier || 'Apprentice',
      }));
    return json({
      ok: true,
      leaderboard: cleanProfiles,
    });
  }

  /* ---- player logs (admin) ---- */
  if (isLogs) {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: userData, error: userErr } = await sr.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json({ ok: false, error: 'unauthorized' }, 401);
    }
    const userId = userData.user.id;
    const { data: adminRow, error: adminErr } = await sr
      .from('admins').select('id').eq('id', userId).maybeSingle();
    if (adminErr || !adminRow) {
      return json({ ok: false, error: 'not an admin' }, 403);
    }
    const { data: logs, error: logsErr } = await sr
      .from('activity_logs')
      .select('id, username, game_id, action, points_awarded, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (logsErr) {
      return json({ ok: false, error: 'query failed: ' + logsErr.message }, 500);
    }
    return json({ ok: true, logs: logs ?? [] });
  }

  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
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

    const body = await req.json().catch(() => null);
    const gameId = String(body?.game_id ?? '');
    const answer = String(body?.answer ?? '');
    const username = body?.username ? String(body.username).trim() : null;
    if (!/^[a-z0-9-]{2,40}$/.test(gameId) || !answer.trim()) {
      return json({ ok: false, error: 'bad request' }, 400);
    }

    /* ---- attach the player name to the profile (once per login) ---- */
    if (username) {
      try {
        await sr.from('profiles').upsert({
          id: userId,
          username: username,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (e) { /* name storage is best-effort; scoring is unaffected */ }
    }

    const { data: row, error: rowErr } = await sr
      .from('puzzle_answers')
      .select('game_id, kind, answer_hash, aliases, points, reveal')
      .eq('game_id', gameId)
      .maybeSingle();
    if (rowErr || !row) return json({ ok: false, error: 'unknown game' }, 404);

    const correct =
      row.kind === 'exact'
        ? fingerprint(answer) === row.answer_hash
        : geoCorrect(answer, row.aliases);
    if (!correct) return json({ ok: true, correct: false });

    const { data: award, error: awardErr } = await sr.rpc('award_solve', {
      p_user: userId,
      p_game: gameId,
      p_points: row.points,
    });
    if (awardErr) return json({ ok: false, error: 'award failed' }, 500);

    const total = (award as Array<{ newly: boolean; total: number }> | null)?.[0]?.total ?? null;
    try {
      await sr.from('activity_logs').insert({
        user_id: userId,
        username: username || 'unknown',
        game_id: gameId,
        action: correct ? 'solved' : 'attempt',
        points_awarded: correct ? row.points : 0,
      });
    } catch (e) { /* best-effort logging — never block the game */ }
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
function fingerprint(text) {
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
function geoNorm(s) {
  const map = {
    'þ': 'th', 'ð': 'd', 'æ': 'ae', 'ö': 'o', 'á': 'a',
    'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ý': 'y',
  };
  const lower = String(s).toLowerCase();
  let out = '';
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    out += map[ch] !== undefined ? map[ch] : ch;
  }
  return out.replace(/[^a-z]/g, '');
}

function lev(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = [];
  let cur = [];
  let i, j, cost;
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

function geoCorrect(input, aliases) {
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
