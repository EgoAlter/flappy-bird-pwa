// game.js — Game loop, state machine, canvas scaling system
//
// ARCHITECTURE NOTE:
// This file is the coordinator. It owns:
//   - The canonical game world dimensions (logical units)
//   - The scale factor between logical units and physical pixels
//   - The requestAnimationFrame loop
//   - The state machine (IDLE → PLAYING → DEAD)
//
// It does NOT know how to draw a bird or a pipe.
// That knowledge lives in the entity files.
// This separation means you can change how a pipe looks
// without ever touching the game loop.

class Game {
  // --- Logical world dimensions ---
  // All game coordinates are expressed in these units.
  // These numbers come from the original Flappy Bird (288×512).
  // Think of this as the "design canvas" — device-agnostic.
  static LOGICAL_WIDTH  = 288;
  static LOGICAL_HEIGHT = 512;

  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx    = this.canvas.getContext('2d');

    // Scale factor: logical units → physical pixels
    // Recalculated on every resize event
    this.scale = 1;

    // State machine
    // Valid states: 'idle' | 'playing' | 'dead'
    this.state = 'idle';

    this.score = 0;

    // Bind resize handler so 'this' stays correct inside the callback
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);

    // Set initial canvas size
    this._onResize();

    // Start the loop
    this._loop();

    console.log('[Game] Initialised. Logical world:', Game.LOGICAL_WIDTH, '×', Game.LOGICAL_HEIGHT);
  }

  // ---------------------------------------------------------------------------
  // CANVAS SCALING SYSTEM
  //
  // The canvas has two separate size concepts that are easy to confuse:
  //
  //   canvas.width / canvas.height  → the resolution the GPU renders at (pixels)
  //   canvas CSS width / height     → how large it appears on screen
  //
  // We always render at the physical screen resolution to avoid blurriness,
  // then scale every coordinate by this.scale before drawing.
  // ---------------------------------------------------------------------------
  _onResize() {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Set the canvas render resolution to the actual screen size
    this.canvas.width  = screenW;
    this.canvas.height = screenH;

    // Calculate a uniform scale that fits the logical world into the screen
    // min() preserves aspect ratio — the game never stretches or squashes
    this.scale = Math.min(
      screenW / Game.LOGICAL_WIDTH,
      screenH / Game.LOGICAL_HEIGHT
    );

    // Centre the game world when there's letterboxing
    // (e.g. on a very wide desktop screen)
    this.offsetX = (screenW - Game.LOGICAL_WIDTH  * this.scale) / 2;
    this.offsetY = (screenH - Game.LOGICAL_HEIGHT * this.scale) / 2;

    console.log(
      `[Game] Resized → screen: ${screenW}×${screenH}`,
      `| scale: ${this.scale.toFixed(3)}`,
      `| offset: (${this.offsetX.toFixed(0)}, ${this.offsetY.toFixed(0)})`
    );
  }

  // ---------------------------------------------------------------------------
  // COORDINATE HELPERS
  //
  // Every entity uses these to convert from logical → physical pixels.
  // If you ever need to change the scaling strategy, you change it here
  // and nowhere else.
  // ---------------------------------------------------------------------------
  lx(logicalX) { return this.offsetX + logicalX * this.scale; }
  ly(logicalY) { return this.offsetY + logicalY * this.scale; }
  ls(logicalSize) { return logicalSize * this.scale; }

  // ---------------------------------------------------------------------------
  // GAME LOOP
  // ---------------------------------------------------------------------------
  _loop() {
    // requestAnimationFrame passes a timestamp — useful later for
    // delta-time calculations so physics is framerate-independent
    requestAnimationFrame((timestamp) => {
      this._update(timestamp);
      this._draw();
      this._loop();
    });
  }

  _update(timestamp) {
    // State-gated update — entities only tick when the game is playing
    switch (this.state) {
      case 'idle':
        // Waiting for first tap/click — background still animates
        break;
      case 'playing':
        // TODO: update bird, pipes, check collisions
        break;
      case 'dead':
        // TODO: death animation, then transition to idle
        break;
    }
  }

  _draw() {
    const { ctx, canvas } = this;

    // Clear the full physical canvas each frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Temporary: draw a placeholder so we can verify scaling works ---
    // This block gets deleted once real entities are in place
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(
      this.lx(0),
      this.ly(0),
      this.ls(Game.LOGICAL_WIDTH),
      this.ls(Game.LOGICAL_HEIGHT)
    );

    // Draw the logical world boundary — shows our coordinate system is correct
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth   = 1;
    ctx.strokeRect(
      this.lx(0),
      this.ly(0),
      this.ls(Game.LOGICAL_WIDTH),
      this.ls(Game.LOGICAL_HEIGHT)
    );

    // Draw a dot at logical centre (144, 256) — should be dead centre of the
    // game world on any screen
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(this.lx(144), this.ly(256), this.ls(5), 0, Math.PI * 2);
    ctx.fill();

    // State label
    ctx.fillStyle   = 'white';
    ctx.font        = `${this.ls(14)}px monospace`;
    ctx.textAlign   = 'center';
    ctx.fillText(
      `state: ${this.state} | scale: ${this.scale.toFixed(2)}`,
      this.lx(144),
      this.ly(20)
    );
    // --- End temporary placeholder ---
  }

  // ---------------------------------------------------------------------------
  // INPUT — single entry point for both tap and click
  // ---------------------------------------------------------------------------
  handleInput() {
    switch (this.state) {
      case 'idle':
        this.state = 'playing';
        break;
      case 'playing':
        // TODO: bird.flap()
        break;
      case 'dead':
        // TODO: reset and return to idle
        break;
    }
  }
}