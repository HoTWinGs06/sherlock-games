/* ===========================================================================
   puzzles.js — Case File #SH-003 · Chess Puzzles (DATA ONLY, no logic/UI)

   Validity: every FEN and its expected move were verified with chess.js
   1.4.0 (vendored at ./lib/chess.mjs) before being sealed here.

   `solver`     = the side that plays first ('w' or 'b', from the FEN).
   `img`        = static board photograph shown to the solver (img/<id>.png).
   `answerHash` = 64-bit digest of the ONE expected move (SherlockVault
                  fingerprints the typed answer at submit time; the plaintext
                  move is never stored, so DevTools cannot read it).
   `sanV`       = the winning line (sealed; unlocked only after a solve).
   `whyV`       = the explanation card (sealed; unlocked only after a solve).
   `hintV`      = the hint line (sealed; unlocked when the hint is taken).
   fen is openly stored — it pinpoints the position but withholds the move.

   Regenerate these payloads with:  node tools/vault-cli.js seal-file ...
   ======================================================================== */

/* global window */
(function () {
  'use strict';

  var PUZZLES = [
    {
      id: 'sh003p1',
      title: 'The Queen Descends',
      rating: 1300,
      difficulty: 'Novice',
      themes: ['middlegame', 'check', 'advantage'],
      solver: 'b',
      img: 'img/sh003p1.png',
      answerHash: '0b87778e3efc0baa',
      fen: '8/1Qpk1p2/p6q/3N2r1/3Pp3/2P1Pbp1/3K4/1R4R1 b - - 0 40',
      sanV: 'EwlZTg==',
      whyV: 'EwlZTlIhARwWRQBaVxE3X0xYQlwqBA9FAyYRFwtFEF1FX2JFUFIXWi8RHxxSO1kUDAkREkFFMFBRUF9LYgAfRQY7EVIODBpVEl4sEVwFGR8WCQ5FETsREQ5FFkdLQmJFUFIXSycMGwpecxUcAUUAWlcRMF5XXBddJxICARdzABoARR9bXFZiV1lbW0xiDw4dBnOW8vFFNl5TUikRW1hZSScTHxZSMlQRCQAVXBJDLV5TGQ==',
      hintV: 'FgkORRp+EhsJAFRbQRE1WFxSF1AyBAVFFCEbH0URHFcSQDdUXVkQTGITCgsZcwAdRREcVxJaK19fEEQfMAAFDlKx9OZFEhVeWRErRRhAXksqQR8AHyMbSUUEVFxXWCVZWlhCTS4YSxcdPB9SDBZUXldXNhFLQ1ZRJggFAlI6GlIRDRESVlAwWhY='
    },
    {
      id: 'sh003p2',
      title: 'The Locked Corridor',
      rating: 1470,
      difficulty: 'Apprentice',
      themes: ['check', 'initiative', 'tactics'],
      solver: 'w',
      img: 'img/sh003p2.png',
      answerHash: '0b8776c1bc14d557',
      fen: '2R5/4kpp1/1p5p/p7/3r4/5Q1P/5PPK/4q3 w - - 0 1',
      sanV: 'EwNcTlIBEEVFNAxQBA==',
      whyV: 'EwNcTlIwHBcGDgcSRlknEVNeWVhiBQQSHHMAGgBFG0JXX2JCXUFSUTYJSxcTPR9eRQQaVhJFKlQYVA8fMA4EDlI7FQFFAAJXQEhiVFFQX0sqTBkEHDhUFx0MABJBVCNdXVMbHzEOSxEaNlQZDAsTEl9EMUUYRENaMkECCwY8VAYNAFRdQlQsHxhjX1piDgUJC3MHHQkMEBJTXzFGXUUXVjFBHw0XcwYdCg5UUF5eIVoYWFkfJlZLh/LHVBMDERFAEkYqWFtfF246A11FAScVABEWVEJbUilYVlAXSjJBHw0XcxgdChYREkNEJ1RWRF5bJ0EbBAU9B1IECxASRlknEVtYQlE2QQ4TFz0HUgoQABwSeCQRTF9SHykIBQJSNxUAABZUQUZUMhFZRF5bJ0ECCwEnERMBSVRGWlRiVFZQXlEnQQgKHDUdAAgWVEZaVGJZV0JEWmIODUURMgYWFkUSU15dMQsYfFIJYhMeCwFzHRwRClRgVwlpHRh8UwliCAURHXMmEVNOWBJ5V3QRUVlDUGIwEwdEeFpSJwkVUVkRNVBLF0NILUEbBAU9B1IQFU8SRlkrQhhEXlElDQ5FETsREQ5FAEdAXzERTF9SHzUJBAkXcxcTFgBUU0BeN19cGQ==',
      hintV: 'FgkORRc6ExoRDVRAU18pEVFEF14uEw4EFipUHgoGH1dWETFZTUMXXTtBEgoHIVQdEgtUQF1eKRHat6MfJAgFAVInHBdFChpXEkA3VF1ZF1wqBAgOUiccF0UOHVxVESFQVllYS2IABRYFNgZSAwoGElRDJ1QW'
    },
    {
      id: 'sh003p3',
      title: 'The Queen\'s Doorstep',
      rating: 1520,
      difficulty: 'Inspector',
      themes: ['sacrifice', 'matingNet', 'middlegame'],
      solver: 'b',
      img: 'img/sh003p3.png',
      answerHash: '0b8776a2260d2d70',
      fen: 'r1k2N2/pp1nQ2p/5n2/5p2/2p2P2/4P2P/PP1RKNR1/r1B4q b - - 0 1',
      sanV: 'EwZaTg==',
      whyV: 'EwZaTlIkFR4OFlRGWlRiQE1SUlFiEh8XEzoTGhFFEF1FX2JFUFIXWG8HAgkXcxscEQpURlpUYlpRWVAYMUENDAAgAFIXBBpZEtPCpRhDX1piEB4AFz1TAUUBG11AQjZUSBkXayoESwYaNhcZRQMbQFFUMRFMX1IfKQgFAlInG1IWERFCElAxWFxSF1AwQQ0MHDdUE0UHGF1RWidDFBdWUSZBKQkTMB9VFkUGXV1aYl5WF1QOYhEHEAFzABoARRBdR1MuVFwXXFErBgMRAXMfFwAVVEZaVGJBSlJETDcTDkUdPVQUV0UVXFYRKgMWF2NXJ0EOCxU6GhdFFxVGV0JiRVBeRB8jEksRGjZUEQkAFVxXQjYRT1ZOHzYOSwcANhUZRREcVxJaK19fEEQfMQkOCQY2BkhFNBMDGRE2REpZRB82CQ5FFX4SGwkAVFtcRS0ReltWXClGGEUaOhMaEgQNHhJQLFUYWVhLKggFAlIEHBsRAFRRU19iVVcXVlk2BBkSEyEQUgEAEldcVTERWlhDV2IVAwBSOB0cAkUVXFYRNlldF0deNQ9LFgYhAREREAZXHA==',
      hintV: 'FgkORRV+EhsJAFRbQRE1WFxSF1AyBAVFFCEbH0URHFcSQDdUXVkQTGITCgsZcwAdRTIcW0ZUZUIYVVZcKUEZBBw4VJDl8VRfU0MhWRhEQ00jCAwNBnMQHRILVFtGETVYTF8XXCoECA5JcwAaAEUfW1xWYllZRBdRLRYDAAA2VAYKRRxbVlRiXlYXQ1cnQQ0MACAAUhcEGlkc'
    },
    {
      id: 'sh003p4',
      title: 'The Greek Gift',
      rating: 1580,
      difficulty: 'Inspector',
      themes: ['sacrifice', 'kingHunt', 'matingNet', 'middlegame'],
      solver: 'w',
      img: 'img/sh003p4.png',
      answerHash: '0b874898a3cd8a40',
      fen: 'r3brk1/pBq1bppp/1p2pn2/3p4/3p1Q2/3B1NR1/PPP2PP1/2KR4 w - - 0 1',
      sanV: 'ABkDUllzPwoNUlR8VQRpEXNQDx8TCV4=',
      whyV: 'ABkDUllzHQFFERxXElIuUEtEXlxiJhkAFzhUFQwDABLQsdYRTF9SHyAIGA0dI1QdAwMRQEERK0VLUltZYhUERQA6BFIKFRFcEkUqVBhcXlElRhhFAjIDHEUGG0RXQ2wRcVEXSyoESw4bPRNSEQQfV0EdYn9fAhwfJA4ZBhcgVBsRRRZTUVpuEVlZUx8TCV5FAjoaAUURHFcSVm9BWUBZHzUJAgkXcxELAAwaVRJZdR8YflEfNgkORRk6GhVFFgBTS0JiGXNfDxZuQR8NF3MFBwAAGhJeUCxVSxdYUWIJXkUTPQ0FBBxUU1xVYkVQUhdeNhUKBhlzBh0JCQccEmUqVBhSWVgrDw5FETwaFAwXGUESRSpUGERWXDAIDQwRNlQbFkUHXUdfJgoYQ19aYgAHERchGhMRDAJXEl0rX11EF1grFw5FMD8VEQ5FAFtfVGJFVxdVTScAHw0XfQ==',
      hintV: 'FgkORRA6BxoKFVRdXBEmAhhEQ14wBBhFEydUGlJLVGZaVGJaVl5QVzZBAhZSIRETARxURl0RKERVRxkfFQkKEVI7FQIVABpBElgkEUFYQh8xCAYVHipUFQwTERJGWScRWl5EVy0RSwQFMg1N'
    },
    {
      id: 'sh003p5',
      title: 'The Quiet Sentry',
      rating: 1420,
      difficulty: 'Apprentice',
      themes: ['defence', 'prophylaxis', 'middlegame'],
      solver: 'b',
      img: 'img/sh003p5.png',
      answerHash: '0b875939e8993151',
      fen: '6k1/6pp/2n2r2/2Kp4/P2N4/5N2/1q6/R2Q4 b - - 0 1',
      sanV: 'DARc',
      whyV: 'DARcRRsgVAYNAFRDR1gnRRhVQktiBBgWFz0AGwQJVFZXVydfW1IX3cL1SxEaNlQWUEUEU0VfYlhLF0NXJ0EHDBwwHAIMC1RdVBEAXVlUXBgxQRsKAToAGwoLWBJTXyYRb19eSydGGEUDJhEXC0lUWVxYJVlMF1ZRJkEADBw0VBMXAFRTXl1iU11WRVYsBksBHSQaUgoLVFtGH2JlUFIXVCwIDA0GcxIACghUUQQRMUVdR0QfNg5LAEV/VBEKExFAW18lEVwCF14sBUsOFzYEGwsCVEZaVGJBV0ReSysOBUUBPBgbAUtUZlpUYlRWUF5RJ0EYDR0kB1IRDR1BElgxEUxfUh8tDwccUj4bBABFAFpTRWJZV1tTTGIVAwBSMRUeBAsXVwkRJ0ddRU5LKggFAlI2GAEARRBAXUExEVkXR141D0sKAHMDHRcWERw=',
      hintV: 'FgkORRZmVAIEEhoSW0JiRVBSF0sjEwwABn1UJg0XEVcSRipYTFIXTysECAABcxUAAEUVW19UJhFZQxdWNk9LPB0mVBoEExESXV8nEVNZXlgqFUsRGjIAUgYEGhJaVC5BGNW3q2IWAwAANlQWCgAHEltFYlZXCA=='
    }
  ];

  /* Expose to the (non-module) page scripts. */
  window.PUZZLES = PUZZLES;
})();