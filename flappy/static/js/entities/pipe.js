// pipe.js — Pipe entity
//
// ARCHITECTURE NOTE:
// One Pipe instance = one pipe PAIR (top + bottom).
// The gap between them is what the bird flies through.
// Managing them as pairs simplifies spawning, scrolling,
// scoring (did the bird pass this pair?), and culling.

class Pipe {
  static WIDTH        = 52;    // Logical units — matches original game
  static SCROLL_SPEED = 2;     // Logical units per frame (increases with score)
  static GAP_SIZE     = 120;   // Logical units between top and bottom pipe
  static CAP_HEIGHT   = 26;    // The flared end cap on each pipe

  // Spawn pipes with gap centre between 30% and 70% of game height.
  // Keeps the gap reachable but not trivially easy.
  static MIN_GAP_CENTRE = Math.round(512 * 0.30);  // ~154
  static MAX_GAP_CENTRE = Math.round(512 * 0.70);  // ~358

  constructor(x) {
    this.x = x;

    // Randomise where the gap is vertically
    this.gapCentre = Pipe.MIN_GAP_CENTRE + Math.random()
                     * (Pipe.MAX_GAP_CENTRE - Pipe.MIN_GAP_CENTRE);

    // Derived: top and bottom edges of the gap
    this.gapTop    = this.gapCentre - Pipe.GAP_SIZE / 2;
    this.gapBottom = this.gapCentre + Pipe.GAP_SIZE / 2;

    // Has the bird already passed this pipe pair and earned the point?
    this.scored = false;
  }

  update(speedMultiplier = 1) {
    this.x -= Pipe.SCROLL_SPEED * speedMultiplier;
  }

  // Off the left edge of the logical world — safe to remove from array
  isOffScreen() {
    return this.x + Pipe.WIDTH < 0;
  }

  // Returns two hitboxes — one per pipe — in logical coordinates.
  // game.js checks these against bird.getBounds().
  getBounds() {
    return {
      top: {
        x:      this.x,
        y:      0,
        width:  Pipe.WIDTH,
        height: this.gapTop,
      },
      bottom: {
        x:      this.x,
        y:      this.gapBottom,
        width:  Pipe.WIDTH,
        height: 512 - this.gapBottom,  // to bottom of logical world
      }
    };
  }

  draw(ctx, game) {
    ctx.save();

    const sx     = game.lx(this.x);
    const sw     = game.ls(Pipe.WIDTH);
    const capH   = game.ls(Pipe.CAP_HEIGHT);
    const capW   = game.ls(Pipe.WIDTH + 8);   // Cap is slightly wider than shaft

    // --- TOP PIPE ---
    const topShaftY = game.ly(0);
    const topShaftH = game.ly(this.gapTop) - topShaftY;
    const topCapY   = game.ly(this.gapTop) - capH;

    // Shaft
    ctx.fillStyle = '#74bf2e';
    ctx.fillRect(sx, topShaftY, sw, topShaftH);

    // Darker right edge for depth
    ctx.fillStyle = '#4e8a1e';
    ctx.fillRect(sx + sw - game.ls(8), topShaftY, game.ls(8), topShaftH);

    // Cap (centred on shaft)
    ctx.fillStyle = '#74bf2e';
    ctx.fillRect(sx - (capW - sw) / 2, topCapY, capW, capH);

    // Cap dark edge
    ctx.fillStyle = '#4e8a1e';
    ctx.fillRect(
      sx - (capW - sw) / 2 + capW - game.ls(8),
      topCapY, game.ls(8), capH
    );

    // --- BOTTOM PIPE ---
    const bottomCapY   = game.ly(this.gapBottom);
    const bottomShaftY = bottomCapY + capH;
    const bottomShaftH = game.ly(512) - bottomShaftY;

    // Shaft
    ctx.fillStyle = '#74bf2e';
    ctx.fillRect(sx, bottomShaftY, sw, bottomShaftH);

    // Shaft dark edge
    ctx.fillStyle = '#4e8a1e';
    ctx.fillRect(sx + sw - game.ls(8), bottomShaftY, game.ls(8), bottomShaftH);

    // Cap
    ctx.fillStyle = '#74bf2e';
    ctx.fillRect(sx - (capW - sw) / 2, bottomCapY, capW, capH);

    // Cap dark edge
    ctx.fillStyle = '#4e8a1e';
    ctx.fillRect(
      sx - (capW - sw) / 2 + capW - game.ls(8),
      bottomCapY, game.ls(8), capH
    );

    ctx.restore();

    // --- Debug: draw hitboxes (uncomment to verify collision bounds) ---
    // const b = this.getBounds();
    // ctx.strokeStyle = 'rgba(255,100,0,0.7)';
    // ctx.lineWidth = 1;
    // ['top', 'bottom'].forEach(k => {
    //   const r = b[k];
    //   ctx.strokeRect(game.lx(r.x), game.ly(r.y), game.ls(r.width), game.ls(r.height));
    // });
  }
}