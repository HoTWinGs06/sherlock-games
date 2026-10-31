/* ===========================================================================
   chess-state.js — Case File #SH-003 · progression STATE (pure logic only)

   Import-free by design: the DOM-shim test harness loads this file in Node
   and tests puzzle gating without touching chess.js, the board library, or
   the browser. UI code (chess-puzzle.js) is the only consumer in the page.

   Shape of persisted state (sessionStorage, key sh-chess-state-v2):
   {
     solved:    [bool, ...],   // one slot per puzzle, index-aligned
     attempts:  {id: n },      // wrong-but-legal tries per puzzle id
     hintsUsed: {id: n }       // 0 or 1 per puzzle id
   }
   =========================================================================== */

/* global window, sessionStorage */
window.ChessCaseState = (function () {
  'use strict';

  var KEY = 'sh-chess-state-v2';

  function fresh() {
    return { solved: [], attempts: {}, hintsUsed: {} };
  }

  /* Restores saved state or returns a fresh one. Corruption and shape drift
     always fall back to fresh — never feed garbage into the UI. */
  function load(count) {
    var freshS = fresh();
    try {
      var raw = sessionStorage.getItem(KEY);
      if (!raw) return freshS;
      var s = JSON.parse(raw);
      if (s && Array.isArray(s.solved) && s.solved.length === count &&
          s.solved.every(function (v) { return typeof v === 'boolean'; })) {
        /* solved array is the hard requirement; the tallies are merely
           sanitized field-by-field so progress never dies with them */
        return {
          solved: s.solved.slice(),
          attempts: (s.attempts && typeof s.attempts === 'object' && !Array.isArray(s.attempts))
            ? s.attempts : {},
          hintsUsed: (s.hintsUsed && typeof s.hintsUsed === 'object' && !Array.isArray(s.hintsUsed))
            ? s.hintsUsed : {}
        };
      }
    } catch (e) { /* private mode / corrupted — start clean */ }
    return freshS;
  }

  function save(state) {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* Index of the first unsolved puzzle; === count means the case is closed. */
  function firstUnsolved(state) {
    for (var i = 0; i < state.solved.length; i++) {
      if (!state.solved[i]) return i;
    }
    return state.solved.length;
  }

  function solvedCount(state) {
    var n = 0;
    for (var i = 0; i < state.solved.length; i++) {
      if (state.solved[i]) n++;
    }
    return n;
  }

  /* "Puzzle 2 of 5 · 1 solved" style header text. done → full tally line. */
  function progressText(state, total) {
    var idx = firstUnsolved(state);
    var done = solvedCount(state);
    if (idx >= total) {
      return 'Case closed \u00b7 ' + done + ' of ' + total + ' solved';
    }
    return 'Puzzle ' + (idx + 1) + ' of ' + total + ' \u00b7 ' + done + ' solved';
  }

  function recordAttempt(state, id) {
    state.attempts[id] = (state.attempts[id] || 0) + 1;
  }

  function totalAttempts(state) {
    var n = 0, id;
    for (id in state.attempts) { n += state.attempts[id]; }
    return n;
  }

  function totalHints(state) {
    var n = 0, id;
    for (id in state.hintsUsed) { n += state.hintsUsed[id]; }
    return n;
  }

  return {
    KEY: KEY,
    fresh: fresh,
    load: load,
    save: save,
    firstUnsolved: firstUnsolved,
    solvedCount: solvedCount,
    progressText: progressText,
    recordAttempt: recordAttempt,
    totalAttempts: totalAttempts,
    totalHints: totalHints
  };
})();
