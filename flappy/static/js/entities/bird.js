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
  static GRAVITY       =  1800;  // units/s²  (was 0.5/frame × 60² = 1800)
  static FLAP_VELOCITY = -480;   // units/s   (was -8/frame × 60 = -480)
  static MAX_FALL_SPEED = 720;   // units/s   (was 12/frame × 60 = 720)
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

  update(delta = 1/60) {
    if (!this.alive) return;

    this.velocity += Bird.GRAVITY * delta;

    if (this.velocity > Bird.MAX_FALL_SPEED) {
        this.velocity = Bird.MAX_FALL_SPEED;
    }

    this.y += this.velocity * delta;

    // Rotation logic unchanged — still maps velocity to angle
    const velocityRange = Bird.MAX_FALL_SPEED - Bird.FLAP_VELOCITY;
    const rotationRange = Bird.ROTATION_DOWN - Bird.ROTATION_UP;
    this.rotation = Bird.ROTATION_UP + (this.velocity - Bird.FLAP_VELOCITY)
                    * (rotationRange / velocityRange);

    this.rotation = Math.max(Bird.ROTATION_UP,
                    Math.min(Bird.ROTATION_DOWN, this.rotation));
    }

  // Returns the hitbox as logical coordinates — used by game.js for collision
  getBounds() {
    // Shrink hitbox by 4 logical units on each side (the "forgiveness" margin)
    const margin = 4;
    return {
      x:      this.x - Bird.WIDTH  / 2 + margin,
      y:      this.y - Bird.HEIGHT / 2 + margin,
      width:  Bird.WIDTH  - margin * 2,
      height: Bird.HEIGHT - margin * 2,
    };
  }

  draw(ctx, game) {
    const screenX = game.lx(this.x);
    const screenY = game.ly(this.y);
    const w = game.ls(Bird.WIDTH);
    const h = game.ls(Bird.HEIGHT);

    ctx.save();

    // Translate to bird centre, rotate, then draw — this is the correct
    // order for rotation around a centred pivot point
    ctx.translate(screenX, screenY);
    ctx.rotate(this.rotation * Math.PI / 180);

    // --- Placeholder sprite: yellow rectangle with an eye ---
    // Will be replaced by a spritesheet in the assets step.

    // Body
    ctx.fillStyle = '#f5c518';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, game.ls(6));
    ctx.fill();

    // Wing
    ctx.fillStyle = '#e6a800';
    ctx.beginPath();
    ctx.ellipse(0, game.ls(4), w * 0.35, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye (white)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(w * 0.18, -h * 0.1, game.ls(5), 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(w * 0.22, -h * 0.08, game.ls(2.5), 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath();
    ctx.moveTo(w * 0.45, -h * 0.05);
    ctx.lineTo(w * 0.72, -h * 0.12);
    ctx.lineTo(w * 0.72,  h * 0.08);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // --- Debug: draw hitbox (comment out once you've verified it) ---
    // const b = this.getBounds();
    // ctx.strokeStyle = 'rgba(255,0,0,0.6)';
    // ctx.lineWidth = 1;
    // ctx.strokeRect(game.lx(b.x), game.ly(b.y), game.ls(b.width), game.ls(b.height));
  }
}