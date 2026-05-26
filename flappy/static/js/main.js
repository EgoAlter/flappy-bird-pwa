// main.js — application entry point
// Responsibilities: register the service worker, then boot the game.
// Kept separate from game.js so PWA infrastructure is never tangled
// with game logic.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/static/sw.js')
      .then(reg => console.log('[SW] Registered, scope:', reg.scope))
      .catch(err => console.error('[SW] Registration failed:', err));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Game instantiation will go here once game.js is written.
  // For now this confirms the shell is wired correctly.
  console.log('[Main] Shell ready — awaiting game boot.');
});