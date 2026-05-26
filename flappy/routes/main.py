from flask import Blueprint, render_template

main_bp = Blueprint("main", __name__)

@main_bp.route("/")
def index():
    """Serve the PWA shell. All game logic runs client-side from here."""
    return render_template("index.html")

@main_bp.app_errorhandler(404)
def not_found(e):
    """Return the shell on 404 so client-side routing can handle it."""
    return render_template("index.html"), 404