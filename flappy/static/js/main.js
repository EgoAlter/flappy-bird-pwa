if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/static/sw.js')
      .then(reg => console.log('[SW] Registered, scope:', reg.scope))
      .catch(err => console.error('[SW] Registration failed:', err));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game('game-canvas');

  // Unified input handler — one listener covers both mouse and touch.
  // Touch devices fire touchstart; mice fire click.
  // We use touchstart (not touchend) for minimum perceived latency on mobile.
  // Track whether a touch just happened so we can suppress
  // the synthetic click the browser fires 300ms later
  let lastTouchTime = 0;

  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault(); // stop space from scrolling the page
      game.handleInput();
    }
  });

  document.addEventListener('touchstart', e => {
    e.preventDefault(); // suppress the synthetic click entirely
    lastTouchTime = Date.now();
    game.handleInput();
  }, { passive: false }); // passive: false required to allow preventDefault

  document.addEventListener('click', () => {
    // Only fire if this click wasn't preceded by a touch within 500ms
    if (Date.now() - lastTouchTime > 500) {
      game.handleInput();
    }
  });
});