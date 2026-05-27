from datetime import datetime
from flappy import db


class Score(db.Model):
    __tablename__ = "scores"

    id        = db.Column(db.Integer, primary_key=True)
    player    = db.Column(db.String(20), nullable=False)
    score     = db.Column(db.Integer,   nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Score {self.player!r} {self.score}>"

    def to_dict(self):
        return {
            "id":         self.id,
            "player":     self.player,
            "score":      self.score,
            "created_at": self.created_at.isoformat(),
        }