/* ===========================================================================
   points.js — Case Files · collective points layer (CLASSIC script)

   One anonymous Supabase session per browser, shared across every game:
     · submit(gameId, answer) → the SERVER re-verifies the answer (same
       fingerprint logic as vault.js / geo matcher logic as geo.js) and
       awards points once per game
     · refresh() → asks the server for the current total, tier, solved list

   Offline / not configured / no tab session yet → every call degrades to
   { enabled:false } or { offline:true } and the page keeps working with its
   own local (sealed) answer checks. Nothing here trusts "the client solved
   it" — the edge function recomputes everything from the raw answer text.
   ======================================================================== */
(function (host) {
    'use strict';

    var cfg = host.SUPABASE_CONFIG || { url: '', anonKey: '' };
    var client = null;
    var enabled = false;
    var user = null;
    var cachedTotal = null;
    var cachedSolves = [];

    /* ---- saved player name (from the study door username field) ---- */
    var savedUsername = '';
    try { savedUsername = localStorage.getItem('sh-username') || ''; } catch (e) { savedUsername = ''; }

    function getSavedUsername() { return savedUsername; }

    function saveUsername(name) {
        savedUsername = name || '';
        try { localStorage.setItem('sh-username', savedUsername); } catch (e) { /* ignore */ }
    }

    function boot() {
        if (!cfg.url || !cfg.anonKey || !host.supabase) return;
        try {
            client = host.supabase.createClient(cfg.url, cfg.anonKey);
            enabled = true;
        } catch (e) { enabled = false; }
    }

    /* anonymous sign-in once, then every tab keeps its own stable player id */
    async function ensureSession() {
        if (!enabled) return null;
        try {
            var res = await client.auth.getSession();
            var session = res && res.data ? res.data.session : null;
            if (!session) {
                var anon = await client.auth.signInAnonymously();
                session = anon && anon.data ? anon.data.session : null;
            }
            user = session ? session.user : null;
            return user;
        } catch (e) { return null; }
    }

    /* the one scoring call — server verifies, server awards */
    async function submit(gameId, answer) {
        if (!enabled) return { enabled: false };
        var u = await ensureSession();
        if (!u) return { ok: false, offline: true };
        try {
            var r = await client.functions.invoke('verify-answer', {
                body: {
                    game_id: String(gameId),
                    answer: String(answer == null ? '' : answer),
                    username: getSavedUsername()
                }
            });
            var d = r && r.data ? r.data : null;
            if (d && d.ok && d.correct && typeof d.total === 'number') {
                cachedTotal = d.total;
                if (d.awarded && cachedSolves.indexOf(gameId) < 0) cachedSolves.push(gameId);
            }
            return d || { ok: false, offline: true };
        } catch (e) {
            return { ok: false, offline: true };
        }
    }

    /* the study-menu read: totals + which files are reconciled */
    async function refresh() {
        if (!enabled) return { enabled: false, total: cachedTotal || 0, tier: 'Apprentice', solved: cachedSolves };
        var u = await ensureSession();
        if (!u) return { enabled: true, offline: true, total: cachedTotal || 0, tier: 'Apprentice', solved: cachedSolves };
        try {
            var p = await client.from('profiles').select('total_points,tier').eq('id', u.id).maybeSingle();
            var s = await client.from('game_solves').select('game_id').eq('user_id', u.id);
            cachedTotal = p && p.data ? p.data.total_points : 0;
            cachedSolves = s && s.data ? s.data.map(function (row) { return row.game_id; }) : [];
            return {
                enabled: true,
                total: cachedTotal || 0,
                tier: p && p.data ? p.data.tier : 'Apprentice',
                solved: cachedSolves
            };
        } catch (e) {
            return { enabled: true, offline: true, total: cachedTotal || 0, tier: 'Apprentice', solved: cachedSolves };
        }
    }

    host.SherlockPoints = {
        submit: submit,
        refresh: refresh,
        getSavedUsername: getSavedUsername,
        saveUsername: saveUsername,
        get enabled() { return enabled; },
        get cachedTotal() { return cachedTotal; },
        get cachedSolves() { return cachedSolves.slice(); }
    };

    boot();
})(typeof window !== 'undefined' ? window : globalThis);
