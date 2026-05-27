// game.js — Game loop, state machine, entity coordinator
//
// ARCHITECTURE NOTE:
// This file is the only place where entities know about each other.
// Bird doesn't import Pipe. Pipe doesn't import Bird.
// game.js owns collision detection because collision is a *relationship*
// between two entities — it belongs to neither one individually.
// This is the Mediator pattern.

class Game {
  static LOGICAL_WIDTH  = 288;
  static LOGICAL_HEIGHT = 512;

  // Pipe spawning: how far apart pipe pairs are, in logical units
  static PIPE_INTERVAL  = 160;

  // How many frames to wait on death screen before accepting input
  static DEATH_LOCK_FRAMES = 30;

  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx    = this.canvas.getContext('2d');

    this.scale   = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    // --- Entity instances ---
    this.bird       = new Bird();
    this.background = new Background();
    this.pipes      = [];

    // --- Game state ---
    this.state       = 'idle';
    this.score       = 0;
    this.bestScore   = this._loadBestScore();
    this.deathTimer  = 0;

    this.speedMultiplier = 1;

    // --- Event Listeners ---
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    this._onResize();

    // NEW: Wire up the Play Again button from the HTML overlay
    const playAgainBtn = document.getElementById("play-again-btn");
    if (playAgainBtn) {
      playAgainBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevents the click from firing twice (once for button, once for document)
        this.handleInput();
      });
    }

    this._loop();
    console.log('[Game] Initialised. Best score:', this.bestScore);
  }

  // ---------------------------------------------------------------------------
  // SCALING SYSTEM — unchanged from skeleton
  // ---------------------------------------------------------------------------
  _onResize() {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    this.canvas.width  = screenW;
    this.canvas.height = screenH;

    this.scale   = Math.min(screenW / Game.LOGICAL_WIDTH, screenH / Game.LOGICAL_HEIGHT);
    this.offsetX = (screenW - Game.LOGICAL_WIDTH  * this.scale) / 2;
    this.offsetY = (screenH - Game.LOGICAL_HEIGHT * this.scale) / 2;
  }

  lx(x)    { return this.offsetX + x * this.scale; }
  ly(y)    { return this.offsetY + y * this.scale; }
  ls(size) { return size * this.scale; }

  // ---------------------------------------------------------------------------
  // GAME LOOP
  // ---------------------------------------------------------------------------
  _loop(timestamp = 0) {
    requestAnimationFrame((newTimestamp) => {
        // Delta time in seconds, capped at 100ms to prevent
        // huge jumps if the tab loses focus and then returns
        const delta = Math.min((newTimestamp - timestamp) / 1000, 0.1);
        this._update(delta);
        this._draw();
        this._loop(newTimestamp);
    });
}

  // ---------------------------------------------------------------------------
  // UPDATE — state machine gates what gets ticked each frame
  // ---------------------------------------------------------------------------
  _update(delta) {
    switch (this.state) {
        case 'idle':
        this.background.update(delta, false);
        this._bobBird();
        break;
        case 'playing':
        this.background.update(delta, true);
        this.bird.update(delta);
        this._updatePipes(delta);
        this._checkCollisions();
        this._updateSpeed();
        break;
        case 'dead':
        this.bird.update(delta);
        this.deathTimer++;
        break;
    }
  }

  // Gentle sine-wave bob on the idle screen — looks polished, costs nothing
  _bobBird() {
    this.bird.y = 256 + Math.sin(Date.now() / 400) * 8;
    this.bird.velocity = 0;
  }

  // ---------------------------------------------------------------------------
  // PIPE MANAGEMENT
  // ---------------------------------------------------------------------------
  _updatePipes(delta) {
    const lastPipe = this.pipes[this.pipes.length - 1];
    if (!lastPipe || lastPipe.x < Game.LOGICAL_WIDTH - Game.PIPE_INTERVAL) {
      this.pipes.push(new Pipe(Game.LOGICAL_WIDTH + 16));
    }

    for (const pipe of this.pipes) {
      // Pass both delta and multiplier to match pipe.js definition
      pipe.update(delta, this.speedMultiplier);

      if (!pipe.scored && pipe.x + Pipe.WIDTH / 2 < this.bird.x) {
        pipe.scored = true;
        this.score++;
        this._onScore();
      }
    }

    // Cull pipes that have scrolled off the left edge
    this.pipes = this.pipes.filter(p => !p.isOffScreen());
  }

  _onScore() {
    console.log('[Game] Score:', this.score);
  }

  _updateSpeed() {
    // Every 5 points, increase speed by 10%, capped at 2× base speed
    this.speedMultiplier = Math.min(1 + Math.floor(this.score / 5) * 0.1, 2.0);
  }

  // ---------------------------------------------------------------------------
  // COLLISION DETECTION
  //
  // AABB (Axis-Aligned Bounding Box) — the standard approach for 2D games.
  // Two rectangles overlap when they are NOT separated on any axis.
  // ---------------------------------------------------------------------------
  _checkCollisions() {
    const birdBounds = this.bird.getBounds();

    // --- Floor and ceiling ---
    if (this.bird.y + Bird.HEIGHT / 2 >= Background.groundY()) {
      this._killBird();
      return;
    }
    if (this.bird.y - Bird.HEIGHT / 2 <= 0) {
      this._killBird();
      return;
    }

    // --- Pipes ---
    for (const pipe of this.pipes) {
      const { top, bottom } = pipe.getBounds();

      if (this._aabb(birdBounds, top) || this._aabb(birdBounds, bottom)) {
        this._killBird();
        return;
      }
    }
  }

  _aabb(a, b) {
    // Returns true if rectangle a and rectangle b overlap
    return (
      a.x < b.x + b.width  &&
      a.x + a.width  > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  _killBird() {
    if (this.state !== 'playing') return;

    this.bird.alive = false;
    this.state      = 'dead'; 
    this.deathTimer = 0;

    // Persist best score locally
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this._saveBestScore(this.bestScore);
    }

    // Trigger the leaderboard flow (which handles the API post)
    this.showLeaderboard(this.score);

    console.log('[Game] Dead. Score:', this.score, '| Best:', this.bestScore);
  }

    showLeaderboard(currentScore) {
        const overlay     = document.getElementById("leaderboard-overlay");
        const title       = document.getElementById("overlay-title");
        const nameEntry   = document.getElementById("name-entry");
        const nameInput   = document.getElementById("player-name-input");
        const submitBtn   = document.getElementById("submit-score-btn");
        const list        = document.getElementById("leaderboard-list");

        // Pre-fill from localStorage — returning players don't retype their name
        nameInput.value = localStorage.getItem('flappy_player_name') || '';

        // Phase 1: name entry
        title.textContent = 'Game Over';
        nameEntry.classList.remove('hidden');
        list.innerHTML = '';
        overlay.classList.remove('hidden');

        // Small delay so the keyboard doesn't immediately obscure the overlay
        setTimeout(() => nameInput.focus(), 100);

        const submitScore = () => {
            const player = nameInput.value.trim().slice(0, 20) || 'Anonymous';
            localStorage.setItem('flappy_player_name', player);

            // Phase 2: loading state
            nameEntry.classList.add('hidden');
            title.textContent = 'Leaderboard';
            list.innerHTML = '<li style="opacity:0.5; justify-content:center;">Saving…</li>';

            // POST returns the saved entry with its ID — use that to identify
            // the player's row rather than matching on name+score (breaks on ties)
            let ourId = null;

            Api.postScore(player, currentScore)
                .then(saved => {
                    ourId = saved.id;
                    return Api.getLeaderboard(10);
                })
                .then(scores => {
                    // Phase 3: leaderboard
                    list.innerHTML = scores
                        .map((entry, i) => `
                            <li class="${entry.id === ourId ? 'highlight' : ''}">
                                <span>${i + 1}. ${entry.player}</span>
                                <span>${entry.score}</span>
                            </li>`)
                        .join('');
                })
                .catch(err => {
                    console.warn('[Game] Leaderboard error:', err);
                    list.innerHTML = '<li style="opacity:0.5; justify-content:center;">Could not save score</li>';
                });
        };

        submitBtn.onclick = submitScore;

        // Enter key submits — natural keyboard behaviour
        nameInput.onkeydown = (e) => {
            if (e.key === 'Enter') submitScore();
        };
    }

    hideLeaderboard() {
    const overlay   = document.getElementById("leaderboard-overlay");
    const nameEntry = document.getElementById("name-entry");

    overlay.classList.add('hidden');
    nameEntry.classList.remove('hidden');  // reset for next death
    }

  // ---------------------------------------------------------------------------
  // RESET — called when player restarts from dead screen
  // ---------------------------------------------------------------------------
  _reset() {
    this.hideLeaderboard();
    this.bird.reset();
    this.pipes            = [];
    this.score            = 0;
    this.speedMultiplier  = 1;
    this.deathTimer       = 0;
    this.background.reset();
    this.state = 'idle';
  }

  // ---------------------------------------------------------------------------
  // INPUT
  // ---------------------------------------------------------------------------
  handleInput() {
    switch (this.state) {
      case 'idle':
        this.state = 'playing';
        this.bird.flap();
        break;
      case 'playing':
        this.bird.flap();
        break;
      case 'dead':
        // Death lock prevents accidental instant restart on the same tap
        if (this.deathTimer >= Game.DEATH_LOCK_FRAMES) {
          this._reset();
        }
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // DRAW
  // ---------------------------------------------------------------------------
  _draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw order matters — painter's algorithm (back to front)
    this.background.draw(ctx, this);

    for (const pipe of this.pipes) {
      pipe.draw(ctx, this);
    }

    this.bird.draw(ctx, this);

    // UI layer drawn last — always on top
    this._drawUI();
  }

  _drawUI() {
    const { ctx } = this;

    switch (this.state) {

      case 'idle':
        this._drawCentreText('FLAPPY BIRD', 210, `${this.ls(28)}px monospace`, 'white');
        this._drawCentreText('tap to start', 240, `${this.ls(14)}px monospace`, 'rgba(255,255,255,0.8)');
        if (this.bestScore > 0) {
          this._drawCentreText(`best: ${this.bestScore}`, 265, `${this.ls(12)}px monospace`, 'rgba(255,255,255,0.6)');
        }
        break;

      case 'playing':
        // Live score — top centre
        ctx.fillStyle    = 'white';
        ctx.font         = `bold ${this.ls(28)}px monospace`;
        ctx.textAlign    = 'center';
        ctx.shadowColor  = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur   = this.ls(4);
        ctx.fillText(this.score, this.lx(144), this.ly(48));
        ctx.shadowBlur   = 0;
        break;

      case 'dead':
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(this.lx(0), this.ly(0), this.ls(Game.LOGICAL_WIDTH), this.ls(Game.LOGICAL_HEIGHT));

        this._drawCentreText('GAME OVER', 210, `bold ${this.ls(26)}px monospace`, 'white');
        this._drawCentreText(`score: ${this.score}`, 245, `${this.ls(16)}px monospace`, 'white');
        this._drawCentreText(`best:  ${this.bestScore}`, 268, `${this.ls(14)}px monospace`, 'rgba(255,255,255,0.7)');

        // Only show restart prompt after the death lock has expired
        if (this.deathTimer >= Game.DEATH_LOCK_FRAMES) {
          this._drawCentreText('tap to restart', 310, `${this.ls(13)}px monospace`, 'rgba(255,255,255,0.6)');
        }
        break;
    }
  }

  _drawCentreText(text, logicalY, font, colour) {
    const { ctx } = this;
    ctx.font         = font;
    ctx.fillStyle    = colour;
    ctx.textAlign    = 'center';
    ctx.shadowColor  = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur   = this.ls(3);
    ctx.fillText(text, this.lx(144), this.ly(logicalY));
    ctx.shadowBlur   = 0;
  }

  // ---------------------------------------------------------------------------
  // PERSISTENCE — localStorage for best score
  // Isolated here so swapping to the API later is a one-line change
  // ---------------------------------------------------------------------------
  _loadBestScore() {
    return parseInt(localStorage.getItem('flappy_best') || '0', 10);
  }

  _saveBestScore(score) {
    localStorage.setItem('flappy_best', score.toString());
  }
}