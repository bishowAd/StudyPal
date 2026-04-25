from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity
from src.middleware.auth import token_required
from src.models.subject import Subject
from src.models.topic import Topic

progress_bp = Blueprint('progress', __name__)


# GET /api/progress/
@progress_bp.route('/', methods=['GET'])
@token_required
def get_progress():
    try:
        user_id  = int(get_jwt_identity())
        subjects = Subject.query.filter_by(user_id=user_id)\
            .order_by(Subject.created_at.desc()).all()

        result = []
        for subject in subjects:
            topics = Topic.query.filter_by(subject_id=subject.id).all()
            total   = len(topics)
            strong  = len([t for t in topics if t.status == 'strong'])
            medium  = len([t for t in topics if t.status == 'medium'])
            weak    = len([t for t in topics if t.status == 'weak'])
            unknown = len([t for t in topics if t.status == 'unknown'])
            tested  = total - unknown

            result.append({
                'subject_id':  subject.id,
                'title':       subject.title,
                'created_at':  subject.created_at.isoformat(),
                'total':       total,
                'tested':      tested,
                'strong':      strong,
                'medium':      medium,
                'weak':        weak,
                'unknown':     unknown,
                'score':       round((strong * 100 + medium * 60) / total, 1) if total > 0 else 0,
                'topics':      [t.to_dict() for t in topics],
            })

        return jsonify({'progress': result})

    except Exception as e:
        return jsonify({'message': str(e)}), 500