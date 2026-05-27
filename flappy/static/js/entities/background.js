// background.js — Background and ground layers
//
// ARCHITECTURE NOTE:
// The background is purely cosmetic — game.js never calls getBounds()
// on it. It knows only how to scroll and draw itself.
// Parallax means different layers scroll at different speeds,
// giving a sense of depth without any 3D work.

class Background {
  // Layer scroll speeds as a fraction of pipe scroll speed.
  // Sky = still, clouds = slow, ground = same speed as pipes.
  static CLOUD_SPEED = 0.3;
  static GROUND_SPEED = 1.0;
  static GROUND_HEIGHT = 112; // Logical units — the floor of the playfield

  constructor() {
    // Track horizontal scroll offset for each layer independently
    this.cloudOffset = 0;
    this.groundOffset = 0;

    // Static cloud positions — randomised once, then scrolled forever
    this.clouds = this._generateClouds();
  }

  _generateClouds() {
    // Spread a handful of clouds across two screen-widths so the loop
    // is never visible to the player
    const clouds = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        x: Math.random() * 576, // Two logical widths (288 × 2)
        y: 20 + Math.random() * 80,
        scale: 0.6 + Math.random() * 0.8,
      });
    }
    return clouds;
  }

  reset() {
    this.cloudOffset = 0;
    this.groundOffset = 0;
  }

  update(delta = 1 / 60, scrolling = true) {
    if (!scrolling) return;

    // Cloud offset loops every 576 units (two screens wide)
    this.cloudOffset = (this.cloudOffset + Pipe.SCROLL_SPEED * Background.CLOUD_SPEED * delta) % 576;

    // Ground stripe offset loops every 48 units (the width of one stripe).
    // This creates the "treadmill" effect where the stripes look continuous.
    const stripeWidth = 48;
    this.groundOffset = (this.groundOffset + Pipe.SCROLL_SPEED * Background.GROUND_SPEED * delta) % stripeWidth;
  }

  draw(ctx, game) {
    ctx.save();

    // --- 1. CLIPPING ---
    // This ensures that on wide screens (like iPhone in landscape), 
    // the background doesn't bleed into the side bars.
    ctx.beginPath();
    ctx.rect(
      game.lx(0),
      game.ly(0),
      game.ls(Game.LOGICAL_WIDTH),
      game.ls(Game.LOGICAL_HEIGHT)
    );
    ctx.clip();

    // --- 2. DRAW CLOUDS ---
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (const cloud of this.clouds) {
      // Draw clouds twice to handle the seamless loop
      for (const repeat of [0, 576]) {
        const cx = (cloud.x - this.cloudOffset + repeat) % 576;
        this._drawCloud(ctx, game, cx - 50, cloud.y, cloud.scale);
      }
    }

    // --- 3. DRAW GROUND ---
    const groundY = game.ly(512 - Background.GROUND_HEIGHT);

    // Dirt layer (The solid brown block)
    ctx.fillStyle = '#ded895';
    ctx.fillRect(
      game.lx(0), 
      groundY, 
      game.ls(Game.LOGICAL_WIDTH), 
      game.ls(Background.GROUND_HEIGHT)
    );

    // Grass strip (The solid green line)
    ctx.fillStyle = '#74bf2e';
    ctx.fillRect(
      game.lx(0), 
      groundY, 
      game.ls(Game.LOGICAL_WIDTH), 
      game.ls(16)
    );

    // --- 4. GROUND STRIPES (The Motion Lines) ---
    // We draw 8 stripes starting from a slightly negative offset.
    // Because the offset resets every 48 units, this looks like one long moving line.
    ctx.fillStyle = '#c8b560';
    const stripeW = 48; 
    const startX = -this.groundOffset; 

    for (let i = 0; i < 8; i++) {
      const sx = startX + (i * stripeW);
      ctx.fillRect(
        game.lx(sx),
        groundY + game.ls(20),
        game.ls(stripeW * 0.6),
        game.ls(8)
      );
    }

    ctx.restore(); // Removes the clipping mask for the rest of the game
  }

  _drawCloud(ctx, game, logicalX, logicalY, scale) {
    const r = game.ls(18 * scale);
    const cx = game.lx(logicalX);
    const cy = game.ly(logicalY);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.9, cy + r * 0.2, r * 0.75, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.8, cy + r * 0.2, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ground Y in logical units — used by game.js for collision
  static groundY() {
    return 512 - Background.GROUND_HEIGHT;
  }
}