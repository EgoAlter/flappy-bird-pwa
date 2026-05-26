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
  document.addEventListener('keydown',     e => { if (e.code === 'Space') game.handleInput(); });
  document.addEventListener('click',       ()  => game.handleInput());
  document.addEventListener('touchstart',  ()  => game.handleInput(), { passive: true });
  // passive: true tells the browser this listener won't call preventDefault()
  // which lets it optimise scroll performance (good habit even though we disable scroll)
});