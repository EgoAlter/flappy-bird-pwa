if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/static/sw.js')
      .then(reg => console.log('[SW] Registered, scope:', reg.scope))
      .catch(err => console.error('[SW] Registration failed:', err));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game('game-canvas');

  let lastTouchTime = 0;

  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      game.handleInput();
    }
  });

  document.addEventListener('touchstart', e => {
    // Touches on the overlay (input, buttons) are UI interactions —
    // let the browser handle them normally, don't pass to the game
    if (e.target.closest('#leaderboard-overlay')) return;

    e.preventDefault();
    lastTouchTime = Date.now();
    game.handleInput();
  }, { passive: false });

  document.addEventListener('click', e => {
    if (e.target.closest('#leaderboard-overlay')) return;

    if (Date.now() - lastTouchTime > 500) {
      game.handleInput();
    }
  });
});