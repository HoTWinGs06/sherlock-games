/* ===========================================================================
   geo.js — Case File #SH-002 · Guess the Location
   Self-contained: flat-panorama viewer, guess matching, scoring.
   Touches nothing belonging to the vault wordle or the study door.
   Answers ship SEALED: names/aliases/reveal/facts/gps are vault payloads,
   unlocked only when a verdict renders — DevTools shows nothing usable.
   Scenes/payloads are regenerated with: node tools/vault-cli.js seal-file
   =========================================================================== */
(function () {
  'use strict';

  /* =======================================================================
     EDIT HERE — add more scenes in the same shape; the game scales itself.
     type 'pan' = a stitched PARTIAL panorama photo. Never claim 360°.
     src        = LOCAL neutral-named file (img/sh002sN.jpg). A hotlinked
                  Commons URL would print the place name in DevTools; the
                  credit line (post-answer) carries the license text.
     credit     = mandatory per file license (Artist + license).
     *V fields  = sealed payloads from tools/vault-cli.js (aliases/facts
                  are sealed as JSON strings). Never paste plaintext here.
     IDs        = neutral (sh002sN) — an id is Sources-visible, so it must
                  not carry the answer.
     ===================================================================== */
  var LOCATIONS = [
    {
      id: 'sh002s1',
      type: 'pan',
      src: 'img/sh002s1.jpg',
      credit: 'Photo: Ischa1 — Wikimedia Commons, CC BY-SA 3.0',
      points: 100,
      titleV: 'EQQHDxM/FRwBFhJdQUI=',
      aliasesV: 'GUM4AB45FR4ECxBBVF4xQhobFWwnDQEEHjIaFgMKB0EQHWBiXVtdXi4ABQEBNRsBFkUDU0ZUMFdZW1sdbkM4AB45FR4ECxBBEkMrR11FF1kjDQcWUA4=',
      hintsV: 'A0EZDBAxGxxFChISQFg0VEoXRFMrERhFAToMBhxFGVdGQydCGFhRWWIABUUdPxBSFgAVH1FdK1deGRdzLQIKCQFzFgAEAlRLXURiUllZF0gjDQBFADoTGhFFHVwSUydZUVlTHysVRQ==',
      revealV: 'EQQHDxM/FRwBFhJdQUJi07ijF0sqBEs2Fz8eEwkEGlZBERBYTlJFHyYTBBUCOhoVRRtCAhJcYhkJDgAfJBVCRR01ElIDCgZfV0NiQl1WF1wuCA0DAXMbHEUsF1deUCxV2reuTGISBBAGO1QRCgQHRhIZEUT7h0JNLgAFAVt9VDNFFRVGWhEuVFlTRB8rD0sHFzsdHAFFAFpXESFESkNWVixBBANSJBUGABdYEkVZK1JQF15MYgQTBBEnGAtFEhxXQFRiRVBeRB8hAAYAADJUAREKG1Yc',
      factsV: 'GUMvFx0jTlIEFQRAXUlsEQ4HF1JiSVpcRXMSBkxHWBB0VCYRWk4XUicNHxITJxEARQMGXV8RB0hSVlFVIw0HBBiQwhkQCRgQHhMNX10XWFliFQMAUjURBUUSFUZXQyRQVFtEHzsOHkURMhpSEgQYWRJXN11UThddJwkCCxZxWFA3CgFVWl07EQsHF1QvQRwAASdUHQNFJ1nxgiVQXlhETGA8',
      gpsV: 'dFJFU0NmQLDVRToeEgB7HwEPDwiA0Usy',
      hrefV: 'KhUfFQFpW10GChlfXV8xH09eXFYvBA8ME30bAAJKA1tZWG13UVtSBREEBw8TPxUcARYSXUFCElBWWEVeLwBZSxgjEw=='
    },
    {
      id: 'sh002s2',
      type: 'pan',
      src: 'img/sh002s2.jpg',
      credit: 'Photo: Simaron (Flickr) — Wikimedia Commons, CC BY-SA 2.0',
      points: 100,
      titleV: 'CQgZDhgmEhcJCQ==',
      aliasesV: 'GUMgDAA4HgcDABheEB1gelFFXFU3Bw4JHiASHRYWVh4QdjBEVlNWTSQLBBcWJgZQSUczQEdfJlBKUV389BOo1QchVl5HLh1AWVs3V11bWx8vDh4LBjIdHEc4',
      hintsV: 'A0EHChw2VBEKCxESXVdiQkxYWVpiEwIWFyBUFBcKGRJTESxeSkNfWjAPSwcTKlQeDA4RElMRMUVdUkdTJ0EcDAY7GwcRRRUSUVk3Q1tfGR8WFgRFAScGFwQIBxJBRStFW18XXmISBgQeP1QUBAkYElBUJF5KUhdWNk8=',
      revealV: 'CQgZDhgmEhcJCVTQsqViRVBSFwt0UksIUrH07iYNAUBRWWJ8V0JZSyMIBYfyzlQdC0UAWlcREV/7kVFaLg0YCxcgVAIACx1cQUQuUBQXRVYxCAUCUjERAQwBERJGWScRTl5bUyMGDkUdNVQ1FxAaVlNDJFv7gUX88hQZS1IHAxsLSABbV0MnVRh8Xk0pCx4DFz8YAQMKB0ESVyNdVEQXVixBHw0XcxIdFwATQF1ELFUDF0NQJQQfDRchVAYNAA0SVEMtX0wXX14uB0sKFHM9EQAJFVxW08KoSxdDTSMXDglSNAEbAQAHHBJlKlhLF0BWLBUOF1IyEQAMBBgSQUUrRVtfF1MtDgAWUjcbBQtFAFpXESBQQRk=',
      factsV: 'GUMjABs0HAZfRUAEAREvERAGGwpzWEsDBnpWXkc2GvGUVyddVERZWjFBGwAcOhoBEAkVHhJGJ0JMF35cJw0KCxZxWFArBBlXVhEkXkoXXksxQQgNByEXGkgWBFtAVGJCUVtfUDcEHxEXcVhQLgwGWVhEJFRUW0RZLRIYRRYhGwIWRR1cEkU1XhhDXlowEksLFzIGEBxHKQ==',
      gpsV: 'dFVFXENmTbDVRToeEgNxHwsFAg6A0Usy',
      hrefV: 'KhUfFQFpW10GChlfXV8xH09eXFYvBA8ME30bAAJKA1tZWG13UVtSBQkIGQ4YJhIXCQkrYlNfLUNZWlZgbz4tCRswHwA6SCthW1wjQ1dZGVUyBg=='
    }
  ];

  /* ===== END EDIT ===== */

  /* ---------------------------------------------------------------------
     Shared theme tokens are in styles.css; only NEW geo-* classes used.
     ------------------------------------------------------------------- */

  var KEY_STATE = 'sh-geo-state';

  var Vault = window.SherlockVault;

  function freshState() {
    return { round: 0, score: 0, submitted: false, lastGuess: '', results: [] };
  }

  function loadState() {
    try {
      var s = JSON.parse(sessionStorage.getItem(KEY_STATE));
      if (s && typeof s.round === 'number' && Array.isArray(s.results) &&
          s.round <= LOCATIONS.length && s.results.length <= s.round + 1) {
        return s;
      }
    } catch (e) { /* fresh */ }
    return freshState();
  }

  function saveState() {
    try { sessionStorage.setItem(KEY_STATE, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  var state = loadState();

  /* ---------------------------------------------------------------------
     Guess matching: diacritic-tolerant, typo-tolerant (distance <= 2 on
     long words), substring on words of 4+ letters. Nothing clever leaks.
     ------------------------------------------------------------------- */
  function norm(s) {
    var map = { '\u00fe': 'th', '\u00f0': 'd', '\u00e6': 'ae', '\u00f6': 'o', '\u00e1': 'a',
      '\u00e9': 'e', '\u00ed': 'i', '\u00f3': 'o', '\u00fa': 'u', '\u00fd': 'y' };
    var out = '';
    var lower = String(s).toLowerCase();
    for (var i = 0; i < lower.length; i++) {
      var ch = lower[i];
      out += (map[ch] !== undefined) ? map[ch] : ch;
    }
    return out.replace(/[^a-z]/g, '');
  }

  function lev(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var prev = [], cur = [], i, j, cost;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (j = 1; j <= b.length; j++) {
        cost = (a[i - 1] === b[j - 1]) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      var tmp = prev; prev = cur; cur = tmp;
    }
    return prev[b.length];
  }

  function isCorrect(input, loc) {
    var cand = norm(input);
    if (!cand) return false;
    var aliases;
    try {
      aliases = JSON.parse(Vault.unlock(loc.aliasesV));
    } catch (e) {
      aliases = [];   /* sealed payload unreadable → refuses every guess */
    }
    for (var k = 0; k < aliases.length; k++) {
      var a = norm(aliases[k]);
      if (!a) continue;
      if (cand === a) return true;
      if (cand.length >= 4 && (a.indexOf(cand) !== -1 || cand.indexOf(a) !== -1)) return true;
      var tol = (cand.length >= 6 && a.length >= 6) ? 2 : ((cand.length >= 5 && a.length >= 5) ? 1 : 0);
      if (tol > 0 && lev(cand, a) <= tol) return true;
    }
    return false;
  }

  /* ---------------------------------------------------------------------
     Flat-panorama viewer — honest partial pan (drag/wheel/pinch/keys),
     zoom with pointer-anchored scaling. No fake 360 claims.
     ------------------------------------------------------------------- */
  function createFlatPan(host, loc, hooks) {
    var stage = document.createElement('div');
    stage.className = 'geo-pano';
    stage.tabIndex = 0;
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label', 'Panoramic photograph. Drag to look around, scroll or buttons to zoom.');

    var badge = document.createElement('div');
    badge.className = 'geo-badge';
    badge.textContent = 'Stitched panorama \u00b7 drag to explore \u00b7 not 360\u00b0';

    var tools = document.createElement('div');
    tools.className = 'geo-tools';
    ['\u2212', 'Reset', '+'].forEach(function (sym, idx) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'geo-tool-btn' + (idx === 1 ? ' geo-tool-reset' : '');
      b.textContent = sym;
      b.setAttribute('aria-label', ['Zoom out', 'Reset view', 'Zoom in'][idx]);
      tools.appendChild(b);
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (idx === 0) api.zoomOut(); else if (idx === 2) api.zoomIn(); else api.reset();
      });
    });

    /* Tool presses must never leak into the stage: stopped here, the pointer
       is never drag-tracked or captured by the stage, and the click reliably
       fires on the button itself (capture would retarget it to the stage). */
    tools.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

    var loader = document.createElement('div');
    loader.className = 'geo-loading';
    var spin = document.createElement('div');
    spin.className = 'geo-spin';
    var loadTxt = document.createElement('p');
    loadTxt.textContent = 'Fetching the photograph\u2026';
    loader.appendChild(spin); loader.appendChild(loadTxt);

    var img = new Image();
    img.className = 'geo-pano-img';
    img.alt = '';
    img.draggable = false;

    host.innerHTML = '';
    host.appendChild(stage);
    stage.appendChild(loader);
    stage.appendChild(img);
    stage.appendChild(badge);
    stage.appendChild(tools);

    var natural = { w: 0, h: 0 };
    var scale = 1, tx = 0, ty = 0, fitScale = 1;
    /* Zoom band is relative to the filled (cover-fit) view. A floor below
       fit-scale lets clamp() snap the image into a corner and kill panning —
       the "zoomed in and can't get back out" bug. */
    function minScale() { return fitScale; }
    function maxScale() { return fitScale * 4; }
    var pointers = {};
    var dragging = false, lastX = 0, lastY = 0, prevDist = 0;

    function coverScale() {
      return Math.max(stage.clientWidth / natural.w, stage.clientHeight / natural.h);
    }

    function clamp() {
      var maxX = Math.max(0, stage.clientWidth - natural.w * scale);
      var maxY = Math.max(0, stage.clientHeight - natural.h * scale);
      tx = Math.min(0, Math.max(maxX, tx));
      ty = Math.min(0, Math.max(maxY, ty));
    }

    function apply() {
      clamp();
      img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    }

    function zoomAt(x, y, factor) {
      var next = Math.min(maxScale(), Math.max(minScale(), scale * factor));
      if (next === scale) { apply(); return; }
      var wx = (x - tx) / scale, wy = (y - ty) / scale;
      tx = x - wx * next;
      ty = y - wy * next;
      scale = next;
      apply();
    }

    function panBy(dx, dy) {
      tx += dx; ty += dy; apply();
    }

    function onResize() {
      fitScale = coverScale();
      if (scale < fitScale) scale = fitScale;   /* never leave gaps after a resize */
      apply();
    }
    window.addEventListener('resize', onResize);

    function pointerCount() { return Object.keys(pointers).length; }

    stage.addEventListener('pointerdown', function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (pointerCount() === 1) {
        dragging = true; lastX = e.clientX; lastY = e.clientY;
        stage.classList.add('geo-togo');
      } else if (pointerCount() === 2) {
        var ids = Object.keys(pointers);
        prevDist = Math.hypot(pointers[ids[0]].x - pointers[ids[1]].x,
                              pointers[ids[0]].y - pointers[ids[1]].y);
        dragging = false;
        stage.classList.remove('geo-togo');
      }
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* older engines */ }
    });

    stage.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId].x = e.clientX; pointers[e.pointerId].y = e.clientY;
      if (pointerCount() >= 2) {
        var ids = Object.keys(pointers);
        var a = pointers[ids[0]], b = pointers[ids[1]];
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        if (prevDist > 0 && d > 0) {
          var r = stage.getBoundingClientRect();
          zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, d / prevDist);
        }
        prevDist = d;
      } else if (dragging) {
        tx += e.clientX - lastX; ty += e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        apply();
      }
    });

    function endPointer(e) {
      delete pointers[e.pointerId];
      if (Object.keys(pointers).length === 0) {
        dragging = false; prevDist = 0;
        stage.classList.remove('geo-togo');
      }
    }
    stage.addEventListener('pointerup', endPointer);
    stage.addEventListener('pointercancel', endPointer);

    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      var r = stage.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.pow(1.0015, -e.deltaY));
    }, { passive: false });

    stage.addEventListener('dblclick', function () {
      var r = stage.getBoundingClientRect();
      /* toggle between the base view and 1.8x of it — always inside the band */
      var base = fitScale * 1.02;
      var target = (scale > base * 1.55) ? base : fitScale * 1.8;
      zoomAt(r.width / 2, r.height / 2, target / scale);
    });

    stage.addEventListener('keydown', function (e) {
      var step = 70;
      switch (e.key) {
        case 'ArrowLeft': panBy(step, 0); e.preventDefault(); break;
        case 'ArrowRight': panBy(-step, 0); e.preventDefault(); break;
        case 'ArrowUp': panBy(0, step); e.preventDefault(); break;
        case 'ArrowDown': panBy(0, -step); e.preventDefault(); break;
        case '+': case '=': api.zoomIn(); e.preventDefault(); break;
        case '-': case '_': api.zoomOut(); e.preventDefault(); break;
        case '0': api.reset(); e.preventDefault(); break;
      }
    });

    img.onload = function () {
      natural.w = img.naturalWidth;
      natural.h = img.naturalHeight;
      fitScale = coverScale();
      scale = fitScale * 1.02;
      tx = 0; ty = 0;
      loader.remove();
      apply();
      if (hooks && hooks.onReady) hooks.onReady();
    };

    img.onerror = function () {
      loader.remove();
      if (hooks && hooks.onError) hooks.onError();
    };
    img.src = loc.src;

    var api = {
      zoomIn: function () { var r = stage.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1.25); },
      zoomOut: function () { var r = stage.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1 / 1.25); },
      reset: function () { scale = fitScale * 1.02; tx = 0; ty = 0; apply(); }
    };
    api.destroy = function () { window.removeEventListener('resize', onResize); };
    return api;
  }

  /* ---------------------------------------------------------------------
     Page wiring
     ------------------------------------------------------------------- */
  var $ = function (id) { return document.getElementById(id); };
  var ui = {
    progress: $('geoProgress'),
    pano: $('geoPano'),
    guessRow: $('geoGuessRow'),
    input: $('geoGuess'),
    submit: $('geoSubmit'),
    note: $('geoGuessNote'),
    verdict: $('geoVerdict'),
    summary: $('geoSummary')
  };
  var pan = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderProgress() {
    var done = state.round >= LOCATIONS.length;
    var shown = done ? LOCATIONS.length : state.round + 1;
    ui.progress.textContent = 'Scene ' + shown + ' of ' + LOCATIONS.length +
      ' \u00b7 ' + state.score + ' pts banked';
  }

  function showPano(loc) {
    if (pan) { pan.destroy(); pan = null; }
    ui.pano.classList.remove('geo-panic');
    pan = createFlatPan(ui.pano, loc, {
      onError: function () { showPanoFallback(loc); }
    });
  }

  function showPanoFallback(loc) {
    ui.pano.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'geo-fallback';
    box.innerHTML =
      '<p class="geo-fallback-title">The photograph failed to arrive</p>' +
      '<p class="geo-fallback-clue">' + esc(Vault.unlock(loc.hintsV)) + '</p>' +
      '<p class="geo-fallback-note">Work from the field note above — your deduction still counts.</p>';
    var retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn btn-outline geo-fallback-retry';
    retry.textContent = 'Try the photograph again';
    retry.addEventListener('click', function () { renderScene(); });
    box.appendChild(retry);
    ui.pano.appendChild(box);
    ui.pano.classList.add('geo-panic');
  }

  function renderScene() {
    var i = state.round;
    var loc = LOCATIONS[i];

    showPano(loc);

    /* guess row */
    ui.input.value = state.submitted ? state.lastGuess : '';
    ui.input.disabled = state.submitted;
    ui.submit.disabled = state.submitted;
    ui.submit.textContent = state.submitted ? 'Already read' : 'Submit Guess';
    ui.note.textContent = state.submitted ? '' :
      'One deliberate call per scene. A correct first reading earns ' + loc.points + ' pts; a miss lays the truth bare.';
    ui.note.className = 'geo-scoring-note' + (state.submitted ? ' is-dim' : '');

    renderProgress();

    /* verdict */
    if (state.submitted) {
      fillVerdict(loc, state.lastGuess);
      ui.verdict.hidden = false;
    } else {
      ui.verdict.hidden = true;
      ui.verdict.innerHTML = '';   /* never leave stale verdict DOM around */
      ui.input.focus({ preventScroll: true });
    }
    ui.summary.hidden = true;
    ui.summary.innerHTML = '';
  }

  function fillVerdict(loc, guess) {
    var correct = isCorrect(guess, loc);
    var pts = correct ? loc.points : 0;
    var facts;
    try { facts = JSON.parse(Vault.unlock(loc.factsV)); } catch (e) { facts = []; }
    ui.verdict.className = 'case-card geo-verdict ' + (correct ? 'is-correct' : 'is-wrong');
    ui.verdict.innerHTML =
      '<p class="geo-verdict-flag">' + (correct ? 'Correct' : 'Not the ground we stood on') +
      ' \u00b7 +' + pts + ' pts</p>' +
      '<h2 class="geo-verdict-title">' + esc(Vault.unlock(loc.titleV)) + '</h2>' +
      '<p class="geo-verdict-guess">Your call: <em>' + esc(guess) + '</em></p>' +
      '<p class="geo-verdict-reveal">' + esc(Vault.unlock(loc.revealV)) + '</p>' +
      '<ul class="geo-facts">' + facts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
      '<p class="geo-gps mono">' + esc(Vault.unlock(loc.gpsV)) + '</p>' +
      '<p class="geo-credit">' + esc(loc.credit).replace('—', '\u00b7') +
      ' \u00b7 <a href="' + esc(Vault.unlock(loc.hrefV)) + '" target="_blank" rel="noopener">source file</a></p>' +
      '<div class="action-row"><button type="button" class="btn btn-primary" id="geoNext">' +
      (state.round + 1 < LOCATIONS.length ? 'Next Scene' : 'Close the Case') + '</button></div>';

    $('geoNext').addEventListener('click', nextScene);
  }

  function renderSummary() {
    if (pan) { pan.destroy(); pan = null; }
    ui.pano.innerHTML = '';
    var max = LOCATIONS.length * 100;
    var rows = [];
    for (var i = 0; i < LOCATIONS.length; i++) {
      var loc = LOCATIONS[i];
      var r = state.results[i];
      var ok = r && r.pts > 0;
      rows.push('<div class="geo-tally"><span>' + esc(Vault.unlock(loc.titleV)) + '</span><span class="' +
        (ok ? 'is-hit' : 'is-miss') + '">' + (ok ? '\u2713 ' + r.pts + ' pts' : '\u2717 0 pts') + '</span></div>');
    }
    ui.summary.innerHTML =
      '<div class="cleared-stamp">Case Closed</div>' +
      '<p class="geo-summary-total">' + state.score + ' / ' + max + ' pts</p>' +
      '<p class="geo-summary-line">' + (state.score === max ?
        'Every ground named on the first read. Holmes would tip his hat.' :
        'The ground is mapped. Return to the study for the next matter at hand.') + '</p>' +
      rows.join('') +
      '<div class="action-row">' +
      '<button type="button" class="btn btn-outline" id="geoReplay">Replay Scenes</button>' +
      '<a class="btn btn-primary" href="case-cleared.html">Return to the Study</a></div>';
    ui.summary.className = 'case-card geo-verdict geo-summary';
    ui.summary.hidden = false;
    ui.verdict.hidden = true;
    ui.guessRow.hidden = true;
    renderProgress();

    $('geoReplay').addEventListener('click', function () {
      state = freshState();
      saveState();
      ui.guessRow.hidden = false;
      render();
    });
  }

  function nextScene() {
    state.round += 1;
    state.submitted = false;
    state.lastGuess = '';
    saveState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    render();
  }

  function submitGuess() {
    if (state.submitted || state.round >= LOCATIONS.length) return;
    var guess = ui.input.value.trim();
    if (!guess) {
      ui.note.textContent = 'Name a ground before you call it, Watson.';
      ui.note.className = 'geo-scoring-note is-warn';
      ui.guessRow.classList.remove('geo-shake');
      void ui.guessRow.offsetWidth;
      ui.guessRow.classList.add('geo-shake');
      return;
    }
    var loc = LOCATIONS[state.round];
    var correct = isCorrect(guess, loc);
    var pts = correct ? loc.points : 0;
    while (state.results.length < state.round + 1) state.results.push(null);
    state.results[state.round] = { id: loc.id, pts: pts, guess: guess };
    state.score = state.results.reduce(function (acc, r) { return acc + (r ? r.pts : 0); }, 0);
    state.submitted = true;
    state.lastGuess = guess;
    saveState();
    renderScene();
    ui.verdict.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function render() {
    if (state.round >= LOCATIONS.length) { renderSummary(); }
    else { renderScene(); }
  }

  ui.submit.addEventListener('click', submitGuess);
  ui.input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); submitGuess(); }
  });
  ui.input.addEventListener('input', function () {
    if (ui.note.classList.contains('is-warn')) {
      ui.note.className = 'geo-scoring-note';
      ui.note.textContent = 'One deliberate call per scene. A correct first reading earns 100 pts; a miss lays the truth bare.';
    }
  });

  render();
})();