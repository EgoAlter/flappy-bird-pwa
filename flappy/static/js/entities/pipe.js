// pipe.js — Pipe entity

class Pipe {
  static WIDTH        = 52;
  static SCROLL_SPEED = 120;
  static GAP_SIZE     = 120;
  static CAP_HEIGHT   = 26;
  static MIN_GAP_CENTRE = Math.round(512 * 0.30);
  static MAX_GAP_CENTRE = Math.round(512 * 0.70);

  constructor(x) {
    this.x = x;
    this.gapCentre = Pipe.MIN_GAP_CENTRE + Math.random() * (Pipe.MAX_GAP_CENTRE - Pipe.MIN_GAP_CENTRE);
    this.gapTop    = this.gapCentre - Pipe.GAP_SIZE / 2;
    this.gapBottom = this.gapCentre + Pipe.GAP_SIZE / 2;
    this.scored = false;
  }

  update(delta = 1/60, speedMultiplier = 1) {
    this.x -= Pipe.SCROLL_SPEED * speedMultiplier * delta;
  }

  isOffScreen() {
    return this.x + Pipe.WIDTH < 0;
  }

  getBounds() {
    return {
      top: { x: this.x, y: 0, width: Pipe.WIDTH, height: this.gapTop },
      bottom: { x: this.x, y: this.gapBottom, width: Pipe.WIDTH, height: 512 - this.gapBottom }
    };
  }

  draw(ctx, game) {
    ctx.save();

    // CLIPPING
    ctx.beginPath();
    ctx.rect(game.lx(0), game.ly(0), game.ls(288), game.ls(512));
    ctx.clip();

    const sx = game.lx(this.x);
    const sw = game.ls(Pipe.WIDTH);
    const capH = game.ls(Pipe.CAP_HEIGHT);
    const capW = game.ls(Pipe.WIDTH + 8);

    // TOP PIPE
    const topShaftY = game.ly(0);
    const topShaftH = game.ly(this.gapTop) - topShaftY;
    const topCapY   = game.ly(this.gapTop) - capH;
    ctx.fillStyle = '#74bf2e';
    ctx.fillRect(sx, topShaftY, sw, topShaftH);
    ctx.fillStyle = '#4e8a1e';
    ctx.fillRect(sx + sw - game.ls(8), topShaftY, game.ls(8), topShaftH);
    ctx.fillStyle = '#74bf2e';
    ctx.fillRect(sx - (capW - sw) / 2, topCapY, capW, capH);

    // BOTTOM PIPE
    const bottomCapY   = game.ly(this.gapBottom);
    const bottomShaftY = bottomCapY + capH;
    const bottomShaftH = game.ly(512) - bottomShaftY;
    ctx.fillStyle = '#74bf2e';
    ctx.fillRect(sx, bottomShaftY, sw, bottomShaftH);
    ctx.fillStyle = '#4e8a1e';
    ctx.fillRect(sx + sw - game.ls(8), bottomShaftY, game.ls(8), bottomShaftH);
    ctx.fillStyle = '#74bf2e';
    ctx.fillRect(sx - (capW - sw) / 2, bottomCapY, capW, capH);

    ctx.restore();
  }
}