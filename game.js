/* ===========================================================================
   game.js — shared utilities for Sherlock Holmes case files
   No answers, passwords, or words live in this file.
   =========================================================================== */

/* Helper: temporary toast-style message across the page */
function showToast(message, duration = 3000) {
  let toast = document.getElementById('sherlock-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'sherlock-toast';
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#0a1418',
      color: '#e9e2cf',
      border: '1px solid #c49a55',
      padding: '10px 18px',
      borderRadius: '4px',
      fontSize: '0.9rem',
      zIndex: 1000,
      pointerEvents: 'none',
      opacity: 0,
      transition: 'opacity 0.3s'
    });
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = 1;
  setTimeout(() => { toast.style.opacity = 0; }, duration);
}