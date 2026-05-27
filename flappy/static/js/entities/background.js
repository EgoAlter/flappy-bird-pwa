// background.js — Background and ground layers

class Background {
  static CLOUD_SPEED = 0.3;
  static GROUND_SPEED = 1.0;
  static GROUND_HEIGHT = 112; 

  constructor() {
    this.cloudOffset = 0;
    this.groundOffset = 0;
    this.clouds = this._generateClouds();
  }

  _generateClouds() {
    const clouds = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        x: Math.random() * 576, 
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
    // Note: Pipe.SCROLL_SPEED must be defined in pipe.js
    this.cloudOffset = (this.cloudOffset + Pipe.SCROLL_SPEED * Background.CLOUD_SPEED * delta) % 576;
    const stripeWidth = 48;
    this.groundOffset = (this.groundOffset + Pipe.SCROLL_SPEED * Background.GROUND_SPEED * delta) % stripeWidth;
  }

  draw(ctx, game) {
    ctx.save();

    // 1. CLIPPING - Hardcoded to 288x512 to prevent reference errors
    ctx.beginPath();
    ctx.rect(game.lx(0), game.ly(0), game.ls(288), game.ls(512));
    ctx.clip();

    // 2. SKY GRADIENT
    const skyHeight = 512 - Background.GROUND_HEIGHT;
    const gradient = ctx.createLinearGradient(game.lx(0), game.ly(0), game.lx(0), game.ly(skyHeight));
    gradient.addColorStop(0, '#4dc8e8');
    gradient.addColorStop(1, '#b8e8f8');
    ctx.fillStyle = gradient;
    ctx.fillRect(game.lx(0), game.ly(0), game.ls(288), game.ls(skyHeight));

    // 3. CLOUDS
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (const cloud of this.clouds) {
      for (const repeat of [0, 288]) {
        const cx = ((cloud.x - this.cloudOffset + repeat) % 576) - 50;
        this._drawCloud(ctx, game, cx, cloud.y, cloud.scale);
      }
    }

    // 4. GROUND
    const groundY = game.ly(skyHeight);
    ctx.fillStyle = '#ded895'; // Dirt
    ctx.fillRect(game.lx(0), groundY, game.ls(288), game.ls(Background.GROUND_HEIGHT));

    ctx.fillStyle = '#74bf2e'; // Grass
    ctx.fillRect(game.lx(0), groundY, game.ls(288), game.ls(16));

    // 5. STRIPES
    ctx.fillStyle = '#c8b560';
    const stripeW = 48;
    const startX = -this.groundOffset;
    for (let i = 0; i < 8; i++) {
      const sx = startX + (i * stripeW);
      ctx.fillRect(game.lx(sx), groundY + game.ls(20), game.ls(stripeW * 0.6), game.ls(8));
    }

    ctx.restore();
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

  static groundY() {
    return 512 - Background.GROUND_HEIGHT;
  }
}