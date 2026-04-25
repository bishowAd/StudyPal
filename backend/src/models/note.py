from extensions import db
from datetime import datetime


class Note(db.Model):
    __tablename__ = 'notes'

    id             = db.Column(db.Integer,     primary_key=True)
    user_id        = db.Column(db.Integer,     db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    filename       = db.Column(db.String(255), nullable=False)
    extracted_text = db.Column(db.Text)
    summary        = db.Column(db.Text)
    chunk_count    = db.Column(db.Integer,     default=0)
    created_at     = db.Column(db.DateTime,    default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('notes', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id':             self.id,
            'user_id':        self.user_id,
            'filename':       self.filename,
            'summary':        self.summary,
            'chunk_count':    self.chunk_count,
            'created_at':     self.created_at.isoformat(),
        }
