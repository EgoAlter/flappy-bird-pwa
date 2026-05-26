from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app(config_name: str = "default") -> Flask:
    """
    Application factory.

    Using a factory (rather than a module-level app instance) means:
    - You can create multiple app instances for testing.
    - Config is injected, not hardcoded.
    - Circular imports between models and routes are avoided.
    """
    from config import config as config_map

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_map[config_name])

    # --- Extension initialisation ---
    db.init_app(app)

    # --- Blueprint registration ---
    from flappy.routes.main import main_bp
    from flappy.routes.api import api_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix="/api")

    # --- Database bootstrap ---
    # Creates tables if they don't exist. Safe to call on every startup.
    with app.app_context():
        db.create_all()

    return app