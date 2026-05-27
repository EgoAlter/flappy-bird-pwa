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
  static CLOUD_SPEED  = 0.3;
  static GROUND_SPEED = 1.0;
  static GROUND_HEIGHT = 112;   // Logical units — the floor of the playfield

  constructor() {
    // Track horizontal scroll offset for each layer independently
    this.cloudOffset  = 0;
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
        x:     Math.random() * 576,   // Two logical widths (288 × 2)
        y:     20 + Math.random() * 80,
        scale: 0.6 + Math.random() * 0.8,
      });
    }
    return clouds;
  }

  reset() {
    this.cloudOffset  = 0;
    this.groundOffset = 0;
  }

  update(scrolling = true) {
    if (!scrolling) return;
    this.cloudOffset  = (this.cloudOffset  + Pipe.SCROLL_SPEED * Background.CLOUD_SPEED)  % 288;
    this.groundOffset = (this.groundOffset + Pipe.SCROLL_SPEED * Background.GROUND_SPEED) % 288;
  }

  draw(ctx, game) {
    // --- Sky gradient ---
    const gradient = ctx.createLinearGradient(
      game.lx(0), game.ly(0),
      game.lx(0), game.ly(512 - Background.GROUND_HEIGHT)
    );
    gradient.addColorStop(0,    '#4dc8e8');
    gradient.addColorStop(1,    '#b8e8f8');
    ctx.fillStyle = gradient;
    ctx.fillRect(
      game.lx(0), game.ly(0),
      game.ls(288), game.ls(512 - Background.GROUND_HEIGHT)
    );

    // --- Clouds ---
    // We draw the cloud set twice — offset by 288 — to create a seamless loop.
    // As cloudOffset increases, both sets slide left, and when one exits
    // the left edge the other is already filling from the right.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (const cloud of this.clouds) {
      for (const repeat of [0, 288]) {
        const cx = ((cloud.x - this.cloudOffset + repeat) % 576) - 50;
        this._drawCloud(ctx, game, cx, cloud.y, cloud.scale);
      }
    }

    // --- Ground ---
    const groundY = game.ly(512 - Background.GROUND_HEIGHT);

    // Dirt layer
    ctx.fillStyle = '#ded895';
    ctx.fillRect(
      game.lx(0), groundY,
      game.ls(288), game.ls(Background.GROUND_HEIGHT)
    );

    // Grass strip across the top of the ground
    ctx.fillStyle = '#74bf2e';
    ctx.fillRect(
      game.lx(0), groundY,
      game.ls(288), game.ls(16)
    );

    // Scrolling ground stripe pattern — gives motion feedback on the ground
    ctx.fillStyle = '#c8b560';
    const stripeW = 48;  // logical units
    for (let i = 0; i < 8; i++) {
      const sx = ((i * stripeW - this.groundOffset) % 288);
      ctx.fillRect(
        game.lx(sx),
        groundY + game.ls(20),
        game.ls(stripeW * 0.6),
        game.ls(8)
      );
    }
  }

  _drawCloud(ctx, game, logicalX, logicalY, scale) {
    // A cloud is 3 overlapping circles — clean and readable at any scale
    const r  = game.ls(18 * scale);
    const cx = game.lx(logicalX);
    const cy = game.ly(logicalY);

    ctx.beginPath();
    ctx.arc(cx,            cy,       r,        0, Math.PI * 2);
    ctx.arc(cx + r * 0.9,  cy + r * 0.2, r * 0.75, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.8,  cy + r * 0.2, r * 0.7,  0, Math.PI * 2);
    ctx.fill();
  }

  // Ground Y in logical units — game.js uses this for floor collision
  static groundY() {
    return 512 - Background.GROUND_HEIGHT;
  }
}