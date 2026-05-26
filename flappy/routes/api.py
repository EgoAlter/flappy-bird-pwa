from flask import Blueprint, jsonify, request

api_bp = Blueprint("api", __name__)

@api_bp.route("/scores", methods=["POST"])
def post_score():
    """
    Accepts: { "player": "Jake", "score": 42 }
    Stub for now — persistence logic added when the Score model is wired in.
    """
    data = request.get_json(silent=True)
    if not data or "score" not in data:
        return jsonify({"error": "Invalid payload"}), 400

    # TODO: persist via Score model in the next step
    return jsonify({"status": "ok", "received": data}), 201

@api_bp.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    """Returns top 10 scores. Stub until Score model is ready."""
    return jsonify({"leaderboard": []}), 200