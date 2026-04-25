from extensions import db
from datetime import datetime

class Subject(db.Model):
    __tablename__ = 'subjects'

    id             = db.Column(db.Integer,     primary_key=True)
    user_id        = db.Column(db.Integer,     db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title          = db.Column(db.String(255), nullable=False)
    extracted_text = db.Column(db.Text,        nullable=False)
    created_at     = db.Column(db.DateTime,    default=datetime.utcnow)

    topics = db.relationship('Topic', backref='subject', cascade='all, delete', lazy=True)

    def to_dict(self):
        return {
            'id':          self.id,
            'title':       self.title,
            'created_at':  self.created_at.isoformat(),
            'topic_count': len(self.topics),
        }