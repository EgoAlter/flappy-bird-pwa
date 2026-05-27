from flask import Blueprint, request, jsonify
from flappy import db
from flappy.models.score import Score

api_bp = Blueprint("api", __name__)


@api_bp.route("/api/scores", methods=["POST"])
def post_score():
    data = request.get_json(silent=True)

    # Validate — never trust the client
    if not data:
        return jsonify({"error": "No JSON body"}), 400

    player = str(data.get("player", "")).strip()[:20]  # sanitise length
    score  = data.get("score")

    if not player:
        return jsonify({"error": "player is required"}), 422
    if not isinstance(score, int) or score < 0:
        return jsonify({"error": "score must be a non-negative integer"}), 422

    entry = Score(player=player, score=score)
    db.session.add(entry)
    db.session.commit()

    return jsonify(entry.to_dict()), 201


@api_bp.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    limit  = min(int(request.args.get("limit", 10)), 100)  # cap at 100
    scores = (
        Score.query
        .order_by(Score.score.desc())
        .limit(limit)
        .all()
    )
    return jsonify([s.to_dict() for s in scores]), 200