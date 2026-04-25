from extensions import db
from datetime import datetime

class Topic(db.Model):
    __tablename__ = 'topics'

    id         = db.Column(db.Integer,     primary_key=True)
    subject_id = db.Column(db.Integer,     db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    name       = db.Column(db.String(255), nullable=False)
    status     = db.Column(db.String(20),  default='unknown')
    score      = db.Column(db.Float,       default=0.0)
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':         self.id,
            'name':       self.name,
            'status':     self.status,
            'score':      self.score,
        }