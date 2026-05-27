// bird.js — Bird entity
//
// ARCHITECTURE NOTE:
// The Bird knows about itself only:
//   - Its position in logical coordinates
//   - Its own physics (gravity pulls it down, flap() gives upward velocity)
//   - How to draw itself
//
// It does NOT know about pipes, the score, or the game state.
// Collision detection lives in game.js — the coordinator.
// This keeps Bird independently testable and replaceable.

class Bird {
  // Physics constants — tuned to feel like the original Flappy Bird.
  // Defined as static so you can tweak them in one place and see
  // the effect across the whole game immediately.
  static GRAVITY       =  0.5;   // Logical units per frame², pulls bird down
  static FLAP_VELOCITY = -8;     // Negative = upward in canvas coordinates
  static MAX_FALL_SPEED = 12;    // Terminal velocity — prevents infinite acceleration
  static ROTATION_UP   = -25;   // Degrees: nose-up when flapping
  static ROTATION_DOWN =  90;   // Degrees: nose-down at max fall (death dive)

  // Hitbox is intentionally smaller than the visual sprite.
  // This is standard game design — pixel-perfect collision feels unfair.
  // The player should feel like they "just made it" more often than not.
  static WIDTH  = 34;
  static HEIGHT = 24;

  constructor() {
    this.reset();
  }

  reset() {
    // Logical starting position — horizontally at ~1/3, vertically centred
    this.x        = 80;
    this.y        = 256;
    this.velocity = 0;       // Current vertical speed (logical units/frame)
    this.rotation = 0;       // Visual rotation in degrees
    this.alive    = true;
  }

  flap() {
    if (!this.alive) return;
    this.velocity = Bird.FLAP_VELOCITY;
  }

  update() {
    if (!this.alive) return;

    // Apply gravity each frame
    this.velocity += Bird.GRAVITY;

    // Clamp to terminal velocity
    if (this.velocity > Bird