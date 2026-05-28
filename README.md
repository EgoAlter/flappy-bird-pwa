# Flappy Bird PWA

A device-independent Flappy Bird clone built as a portfolio project. Playable in the browser,
installable as a Progressive Web App, with a persistent leaderboard backed by a REST API.

**Live demo:** _[https://flappy-bird-pwa.onrender.com/]_

---

## What it is

A full-stack web game built without any game engine or frontend framework. The goal was to
understand the fundamentals — canvas rendering, delta-time physics, a proper game loop,
collision detection — by implementing them from scratch, then back it with a real API and ship
it as a PWA that works offline and installs on mobile.

It's also a deliberate portfolio piece for the stack it's built on: Flask, SQLAlchemy, vanilla JS,
PWA standards. No shortcuts.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, Flask 3, Flask-SQLAlchemy |
| Database | SQLite (dev) — swappable via `DATABASE_URL` env var |
| Frontend | Vanilla JS (ES6 classes), HTML5 Canvas |
| PWA | W3C Web App Manifest + Service Worker (cache-first) |
| Deployment | Gunicorn (production WSGI server) |

---

## Architecture decisions worth noting

**Logical coordinate system.**
The game world is defined in 288×512 logical units (the original Flappy Bird dimensions).
All positions, sizes, and velocities are stored in logical space. `game.lx()`, `game.ly()`,
and `game.ls()` translate to screen pixels at runtime, so the game scales correctly to any
device — iPhone SE to iPad Pro — without a single media query.

**Delta-time physics.**
Physics run in seconds, not frames. Every velocity and acceleration is multiplied by the
elapsed time since the last frame (`delta`). The game runs at the same speed on a 30fps
low-end Android and a 120fps ProMotion display.

**Mediator pattern for entities.**
`Bird`, `Pipe`, and `Background` are self-contained classes that know nothing about each
other. `game.js` is the only file where entities interact — it owns collision detection
because a collision is a *relationship* between two entities, not a property of either one.
This makes each entity independently testable and replaceable.

**State machine.**
The game has three states: `idle → playing → dead`. Every input and every update call is
gated by the current state. This eliminates entire categories of bugs (double-starts,
input during death animation, etc.) and makes the control flow trivially readable.

**Service worker cache strategy.**
Static assets (JS, CSS, icons) are pre-cached on install and served cache-first. API calls
(`/api/*`) always bypass the cache and go to the network — scores must be real, not stale.
The game is fully playable offline; only leaderboard submission requires connectivity.

**Death lock.**
On death, input is ignored for 30 frames. Without this, the same tap that killed the bird
would instantly restart the game — a common frustration in mobile games.

---

## Running locally

```bash
# Clone
git clone https://github.com/EgoAlter/flappy-bird-pwa.git
cd flappy-bird-pwa

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set SECRET_KEY to something non-trivial

# Run
python3 app.py
```

Open `http://localhost:5000` in your browser.

**Testing on a phone (same network):**
```bash
cloudflared tunnel --url http://localhost:5000
```
This generates a public HTTPS URL — required for the service worker and PWA install prompt
to work on iOS/Android.

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scores` | Submit a score. Body: `{ "player": "name", "score": 12 }` |
| `GET` | `/api/leaderboard?limit=10` | Top N scores, descending. Limit capped at 100. |

Both endpoints return JSON. Score entries include `id`, `player`, `score`, and `created_at`.

---

## Project structure

```
flappy-bird-pwa/
├── app.py                     # Entry point — calls create_app()
├── config.py                  # DevelopmentConfig / ProductionConfig
├── requirements.txt
└── flappy/
    ├── __init__.py            # App factory, blueprint registration, DB init
    ├── routes/
    │   ├── main.py            # GET / → serves PWA shell
    │   └── api.py             # Score submission and leaderboard endpoints
    ├── models/
    │   └── score.py           # Score ORM model
    ├── templates/
    │   ├── base.html          # PWA meta tags, viewport, SW registration
    │   └── index.html         # Canvas mount point
    └── static/
        ├── manifest.json      # PWA manifest (standalone, portrait lock)
        ├── sw.js              # Service worker (cache-first, API bypass)
        ├── css/
        │   ├── reset.css
        │   └── game.css       # safe-area insets, image-rendering: pixelated
        └── js/
            ├── main.js        # SW registration, unified input handling, Game init
            ├── game.js        # Game loop, state machine, collision, UI
            ├── api.js         # Fetch wrapper for score endpoints
            └── entities/
                ├── bird.js    # Physics, draw, getBounds()
                ├── pipe.js    # Spawn, scroll, getBounds() top+bottom
                └── background.js  # Parallax sky/clouds/ground
```

---

## Commit history

Conventional commits throughout (`feat`, `fix`, `chore`, `refactor`). The log tells
the build story from scaffold to PWA:

```
feat: player name input with localStorage persistence
feat: add PWA app icons (procedurally generated)
feat: update background and pipe logic
feat: leaderboard overlay with post-on-death and play again
feat: Score model, POST /api/scores, GET /api/leaderboard
fix: double-jump on touch, delta-time physics, clip rendering to game world
feat: wire game entities — playable game loop with collision, scoring, state transitions
feat: Bird, Pipe, Background entity classes with placeholder drawing
feat: canvas scaling system and game state machine skeleton
feat: PWA shell — manifest, service worker, base templates, CSS reset
chore: scaffold project structure
```

---

## Licence

MIT
