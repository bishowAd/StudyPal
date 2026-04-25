from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity
from src.middleware.auth import token_required
from src.models.subject import Subject
from src.models.topic import Topic

subjects_bp = Blueprint('subjects', __name__)


# GET /api/subjects/
@subjects_bp.route('/', methods=['GET'])
@token_required
def get_subjects():
    user_id  = int(get_jwt_identity())
    subjects = Subject.query.filter_by(user_id=user_id)\
        .order_by(Subject.created_at.desc()).all()
    return jsonify({'subjects': [s.to_dict() for s in subjects]})


# GET /api/subjects/<id>/topics
@subjects_bp.route('/<int:subject_id>/topics', methods=['GET'])
@token_required
def get_topics(subject_id):
    user_id = int(get_jwt_identity())
    subject = Subject.query.filter_by(id=subject_id, user_id=user_id).first()
    if not subject:
        return jsonify({'message': 'Subject not found'}), 404
    topics = Topic.query.filter_by(subject_id=subject_id)\
        .order_by(Topic.status, Topic.name).all()
    return jsonify({
        'subject': subject.to_dict(),
        'topics':  [t.to_dict() for t in topics],
    })