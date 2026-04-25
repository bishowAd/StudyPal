from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from src.middleware.auth import token_required
from src.models.subject import Subject
from src.models.topic import Topic
from src.ai import ask_ai_json
from extensions import db
import json
import traceback

diagnostic_bp = Blueprint('diagnostic', __name__)

@diagnostic_bp.route('/generate', methods=['POST'])
@token_required
def generate():
    try:
        user_id    = int(get_jwt_identity())
        data       = request.get_json()
        subject_id = data.get('subject_id')

        if not subject_id:
            return jsonify({'message': 'subject_id is required'}), 400

        subject = Subject.query.filter_by(id=subject_id, user_id=user_id).first()
        if not subject:
            return jsonify({'message': 'Subject not found'}), 404

        topics = Topic.query.filter_by(subject_id=subject_id).all()
        if not topics:
            return jsonify({'message': 'No topics found'}), 404

        topic_names = [t.name for t in topics]

        raw = ask_ai_json(
            prompt=(
                f'Create a diagnostic quiz for these topics: {json.dumps(topic_names)}\n\n'
                f'Study material context:\n{subject.extracted_text[:6000]}\n\n'
                f'Return JSON in this exact format:\n'
                f'{{"questions": [\n'
                f'  {{"topic": "topic name", "question": "question text", '
                f'"options": ["A", "B", "C", "D"], "answer": "A", '
                f'"explanation": "why A is correct"}}\n'
                f']}}\n\n'
                f'Rules:\n'
                f'1. Generate 1 question per topic (max 20 questions total)\n'
                f'2. Each question must have exactly 4 options\n'
                f'3. answer must be the exact text of the correct option (not A/B/C/D)\n'
                f'4. Keep questions clear and specific\n'
                f'5. explanation should be 1-2 sentences'
            ),
            system='You are an expert at creating diagnostic quiz questions. Return only valid JSON.'
        )

        parsed    = json.loads(raw)
        questions = parsed.get('questions', [])

        if not questions:
            return jsonify({'message': 'Could not generate questions'}), 500

        return jsonify({
            'subject':   subject.to_dict(),
            'questions': questions,
        }), 200

    except json.JSONDecodeError as e:
        return jsonify({'message': 'AI returned invalid JSON', 'error': str(e)}), 500
    except Exception as e:
        return jsonify({'message': str(e), 'error': traceback.format_exc()}), 500


# POST /api/diagnostic/submit
# saves scores and updates topic statuses
@diagnostic_bp.route('/submit', methods=['POST'])
@token_required
def submit():
    try:
        user_id = int(get_jwt_identity())
        data    = request.get_json()

        subject_id = data.get('subject_id')
        results    = data.get('results', [])
        # results = [{ topic: str, correct: bool }]

        if not subject_id or not results:
            return jsonify({'message': 'subject_id and results are required'}), 400

        subject = Subject.query.filter_by(id=subject_id, user_id=user_id).first()
        if not subject:
            return jsonify({'message': 'Subject not found'}), 404

        updated = []
        for r in results:
            topic_name = r.get('topic')
            correct    = r.get('correct', False)

            topic = Topic.query.filter_by(
                subject_id=subject_id,
                name=topic_name
            ).first()

            if not topic:
                continue

            # update score — average with previous if exists
            prev_score   = topic.score or 0
            new_score    = 100.0 if correct else 0.0
            topic.score  = (prev_score + new_score) / 2 if topic.status != 'unknown' else new_score

            # assign status based on score
            if topic.score >= 70:
                topic.status = 'strong'
            elif topic.score >= 40:
                topic.status = 'medium'
            else:
                topic.status = 'weak'

            updated.append(topic.to_dict())

        db.session.commit()

        # build summary
        all_topics = Topic.query.filter_by(subject_id=subject_id).all()
        summary = {
            'strong':  len([t for t in all_topics if t.status == 'strong']),
            'medium':  len([t for t in all_topics if t.status == 'medium']),
            'weak':    len([t for t in all_topics if t.status == 'weak']),
            'unknown': len([t for t in all_topics if t.status == 'unknown']),
        }

        return jsonify({
            'message': 'Results saved',
            'summary': summary,
            'updated': updated,
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e), 'error': traceback.format_exc()}), 500