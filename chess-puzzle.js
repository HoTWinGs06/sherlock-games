/* ===========================================================================
   chess-puzzle.js — Case File #SH-003 · page glue (CLASSIC script, no modules)

   Design (v2 — the static-picture edition):
   · The position is a static photograph (`img/<id>.png`) — the solver never
     touches pieces and the page never needs an engine or a board library.
   · The solver reads the position, then WRITES one best move in standard
     notation (Qf5, Qxb1, Rbxf7, axb8=Q ...). The written move is hashed
     with SherlockVault.fingerprint and compared to the puzzle's stored
     digest (answerHash) — the expected move never exists as text, here
     or in the data file, so DevTools cannot read it.
   · Correct move → verdict card with the full line and its explanation →
     next puzzle (or the case summary).
   · Wrong move → feedback only; the position (the photograph) keeps still.

   No ES modules → works from file:// and from any http server alike.
   Progression lives in chess-state.js (Node-tested); data in puzzles.js.

   `answerHash` is the digest of the single expected move; the typed move
   is normalized inside the fingerprint itself, so matching is one digest
   comparison — and reveal text (sanV/whyV/hintV) is unlocked only after
   the verdict, keeping the Sources panel free of answers.
   ======================================================================== */

(function () {
  'use strict';

  var State = window.ChessCaseState;
  var Vault = window.SherlockVault;
  var puzzles = window.PUZZLES || [];
  var $ = function (id) { return document.getElementById(id); };

  var ui = {
    progress: $('chProgress'),
    boardHost: $('chBoard'),
    boardSection: $('chBoardCard'),
    msg: $('chMsg'),
    controls: $('chControls'),
    answer: $('chAnswer'),
    submit: $('chSubmit'),
    hint: $('chHint'),
    verdict: $('chVerdict'),
    summary: $('chSummary')
  };

  var state = State.load(puzzles.length);
  var index = State.firstUnsolved(state);
  var current = null;      // live puzzle object
  var busy = false;        // true between correct answer and next render

  /* ------------------------------------------------------------------ util */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var MSG = {
    ok: function (t) { ui.msg.className = 'ch-message is-ok'; ui.msg.textContent = t; },
    bad: function (t) { ui.msg.className = 'ch-message is-bad'; ui.msg.textContent = t; },
    info: function (t) { ui.msg.className = 'ch-message'; ui.msg.textContent = t; }
  };

  function toMoveText(loc) {
    return (loc.solver === 'w' ? 'White' : 'Black') +
      ' to play \u2014 return the best move possible from this position';
  }

  /* -------------------------------------- answer validation (pure digest) */
  /* A written move is correct when its fingerprint equals the stored
     digest. The fingerprint carries the whole semantics: case, capture
     sign, check suffix and promotion forms fold to one key ("Rbf7"
     matches "Rbxf7+" while ambiguous "Rf7" never does). No expected
     plaintext exists at runtime — the answer cannot leak by inspection. */
  function isCorrectMove(text) {
    var got = Vault.fingerprint(text);
    return !!got && got === current.answerHash;
  }

  function submitAnswer() {
    if (busy || !current || ui.answer.disabled) return;
    var raw = ui.answer.value;
    if (!raw.trim()) {
      MSG.info('Study the position \u2014 then write the move, like Qf5.');
      return;
    }
    if (isCorrectMove(raw)) {
        /* server-side points: the move re-verified THERE by the same digest */
        try { if (window.SherlockPoints && window.SherlockPoints.enabled) {
            window.SherlockPoints.submit('sh003-chess-' + current.id.slice(5), raw);
        } } catch (e) {}
        solveComplete();
        return;
    }
    State.recordAttempt(state, current.id);
    State.save(state);
    MSG.bad('Not the move this file holds \u2014 standard notation, e.g. Qf5 or Qxb1. The position keeps still.');
    ui.answer.focus();
    ui.answer.select();
  }

  /* ------------------------------------------------------------ rendering */
  function renderProgress() {
    ui.progress.textContent = State.progressText(state, puzzles.length);
  }

  function setHintButton(loc) {
    if (state.hintsUsed[loc.id]) {
      ui.hint.disabled = true;
      ui.hint.textContent = 'Hint read';
    } else {
      ui.hint.disabled = false;
      ui.hint.textContent = 'Hint';
    }
  }

  function armInput() {
    ui.answer.disabled = false;
    ui.submit.disabled = false;
    ui.answer.value = '';
    try { ui.answer.focus(); } catch (e) { /* focus may be refused */ }
  }

  function showMissing(loc) {
    ui.boardHost.innerHTML =
      '<div class="ch-board-missing">' +
      '<p>The photograph is missing.</p>' +
      '<p>Drop the board image at <code>img/' + esc(loc.id) + '.png</code></p>' +
      '<p>Position to capture: <code>' + esc(loc.fen) + '</code></p>' +
      '</div>';
  }

  function buildImage(loc) {
    ui.boardHost.innerHTML = '';
    var img = document.createElement('img');
    img.className = 'ch-board-img';
    img.src = loc.img;
    img.alt = toMoveText(loc) + ' \u2014 ' + loc.title + ' (' + loc.difficulty + ')';
    img.addEventListener('error', function () { showMissing(loc); }, { once: true });
    ui.boardHost.appendChild(img);

    /* The photograph opens full-size in a new tab: board coordinates stay
       legible at any page width, exactly as the solver's screenshot shows them. */
    var open = document.createElement('a');
    open.className = 'ch-board-open';
    open.href = loc.img;
    open.target = '_blank';
    open.rel = 'noopener';
    open.textContent = 'Open the full photograph in a new tab \u2197';
    ui.boardHost.appendChild(open);
  }

  function renderPuzzle() {
    current = puzzles[index];
    busy = false;

    buildImage(current);
    ui.controls.hidden = false;
    ui.verdict.hidden = true;
    ui.verdict.innerHTML = '';
    ui.summary.hidden = true;
    ui.summary.innerHTML = '';
    ui.boardSection.hidden = false;
    setHintButton(current);
    armInput();

    /* a previously read hint stays visible for the continuing visit */
    if (state.hintsUsed[current.id]) MSG.info('Hint: ' + Vault.unlock(current.hintV));
    else MSG.info(toMoveText(current) + '.');

    renderProgress();
  }

  function fillVerdict() {
    var loc = current;
    var last = index + 1 < puzzles.length;
    ui.verdict.className = 'case-card geo-verdict is-correct';
    ui.verdict.innerHTML =
      '<p class="geo-verdict-flag">Correct &middot; ' + esc(loc.difficulty) + ' &middot; rated ' + esc(loc.rating) + '</p>' +
      '<h2 class="geo-verdict-title">' + esc(loc.title) + '</h2>' +
      '<p class="geo-verdict-guess">The winning line: <em>' + esc(Vault.unlock(loc.sanV)) + '</em></p>' +
      '<p class="geo-verdict-reveal">' + esc(Vault.unlock(loc.whyV)) + '</p>' +
      '<div class="action-row">' +
      (last
        ? '<button type="button" class="btn btn-primary" id="chNext">Next Puzzle</button>'
        : '<button type="button" class="btn btn-primary" id="chNext">Close the Case</button>') +
      '</div>';
    ui.verdict.hidden = false;
    $('chNext').addEventListener('click', nextPuzzle);
    ui.verdict.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function solveComplete() {
    state.solved[index] = true;
    State.save(state);
    busy = true;
    ui.answer.disabled = true;
    ui.submit.disabled = true;
    MSG.ok('Solved \u2014 ' + Vault.unlock(current.sanV));
    fillVerdict();
    renderProgress();
  }

  function renderSummary() {
    busy = true;
    ui.answer.disabled = true;
    ui.submit.disabled = true;
    ui.boardSection.hidden = true;
    ui.verdict.hidden = true;
    ui.verdict.innerHTML = '';
    ui.controls.hidden = true;

    var rows = puzzles.map(function (p) {
      var tries = state.attempts[p.id] || 0;
      var hints = state.hintsUsed[p.id] ? ' \u00b7 hint read' : '';
      return '<div class="geo-tally"><span>' + esc(p.title) + '</span><span class="is-hit">' +
        esc(String(tries === 0 ? 'clean case' : tries + (tries === 1 ? ' attempt' : ' attempts'))) + hints +
        '</span></div>';
    }).join('');

    var att = State.totalAttempts(state);
    var hintN = State.totalHints(state);
    var praise = att === 0 && hintN === 0
      ? 'Every line on the first swing. Watson would be proud.'
      : (hintN === 0 ? 'No hints consulted \u2014 the files stayed closed.' : '');
    ui.summary.className = 'case-card geo-verdict geo-summary';
    ui.summary.innerHTML =
      '<div class="cleared-stamp">Case Closed</div>' +
      '<p class="geo-summary-total">' + State.solvedCount(state) + ' / ' + puzzles.length + ' lines solved</p>' +
      (praise ? '<p class="geo-summary-line">' + praise + '</p>' : '') +
      '<p class="geo-summary-line">' + att + (att === 1 ? ' stray attempt' : ' stray attempts in total') + ' \u00b7 ' +
      hintN + (hintN === 1 ? ' hint used' : ' hints used') + '</p>' +
      rows +
      '<div class="action-row">' +
      '<button type="button" class="btn btn-outline" id="chReplay">Deal the set again</button>' +
      '<a class="btn btn-primary" href="case-cleared.html">Return to the Study</a>' +
      '</div>';
    ui.summary.hidden = false;
    $('chReplay').addEventListener('click', function () {
      state = State.fresh();
      State.save(state);
      index = 0;
      busy = false;
      renderPuzzle();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    renderProgress();
  }

  function nextPuzzle() {
    ui.verdict.hidden = true;
    ui.verdict.innerHTML = '';
    index = State.firstUnsolved(state);
    if (index >= puzzles.length) { renderSummary(); return; }
    busy = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderPuzzle();
  }

  /* ------------------------------------------------------------ top wiring */
  ui.submit.addEventListener('click', submitAnswer);

  ui.answer.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitAnswer();
    }
  });

  ui.hint.addEventListener('click', function () {
    if (!current || state.hintsUsed[current.id]) return;
    state.hintsUsed[current.id] = 1;
    State.save(state);
    MSG.info('Hint \u2014 ' + Vault.unlock(current.hintV));
    setHintButton(current);
  });

  render(); /* entry point */
  function render() {
    if (!puzzles.length) {
      /* puzzles.js failed to load — say so instead of an empty case */
      MSG.bad('The puzzle file failed to load. Reload the page or check the console.');
      ui.boardHost.innerHTML = '<div class="ch-board-fallback"><p class="geo-fallback-clue">The case file is missing \u2014 the board stays empty.</p></div>';
      ui.controls.hidden = true;
      return;
    }
    if (index >= puzzles.length) renderSummary();
    else renderPuzzle();
  }
})();
