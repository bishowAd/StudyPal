from __future__ import annotations
import json
import random
import traceback

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from src.middleware.auth import token_required
from src.models.subject import Subject
from src.models.topic import Topic
from src.ai import ask_ai_json
from extensions import db

diagnostic_bp = Blueprint('diagnostic', __name__)


@diagnostic_bp.route('/generate', methods=['POST'])
@token_required
def generate():
    try:
        user_id    = int(get_jwt_identity())
        data       = request.get_json()
        subject_id = data.get('subject_id')

        # new options
        question_count = int(data.get('question_count', 20))  # how many questions
        quiz_mode      = data.get('quiz_mode', 'all')          # all | weak | random
        difficulty     = data.get('difficulty', 'medium')      # easy | medium | hard

        if not subject_id:
            return jsonify({'message': 'subject_id is required'}), 400

        subject = Subject.query.filter_by(id=subject_id, user_id=user_id).first()
        if not subject:
            return jsonify({'message': 'Subject not found'}), 404

        all_topics = Topic.query.filter_by(subject_id=subject_id).all()
        if not all_topics:
            return jsonify({'message': 'No topics found'}), 404

        # filter topics by quiz mode
        if quiz_mode == 'weak':
            filtered = [t for t in all_topics if t.status in ('weak', 'unknown')]
            if not filtered:
                filtered = all_topics  # fallback to all if no weak topics
        elif quiz_mode == 'random':
            filtered = random.sample(all_topics, min(len(all_topics), question_count))
        else:
            filtered = all_topics

        # shuffle and limit to question_count
        random.shuffle(filtered)
        topic_list = [t.name for t in filtered[:question_count]]
        seed       = random.randint(1000, 9999)

        # difficulty instructions
        difficulty_instructions = {
            'easy':   'Use simple, straightforward questions testing basic recall and definitions.',
            'medium': 'Mix recall and application questions. Some questions should require understanding.',
            'hard':   'Use challenging questions requiring deep understanding, analysis, and application. Include tricky distractors.',
        }
        diff_instruction = difficulty_instructions.get(difficulty, difficulty_instructions['medium'])

        raw = ask_ai_json(
            prompt=(
                f'[Variation seed: {seed}] Create a UNIQUE diagnostic quiz — different from any previous attempt.\n\n'
                f'Topics to cover: {json.dumps(topic_list)}\n\n'
                f'Study material:\n{subject.extracted_text[:6000]}\n\n'
                f'Difficulty level: {difficulty.upper()} — {diff_instruction}\n\n'
                f'Return JSON in this exact format:\n'
                f'{{"questions": [\n'
                f'  {{"topic": "topic name", "question": "question text", '
                f'"options": ["A", "B", "C", "D"], "answer": "A", '
                f'"explanation": "why A is correct"}}\n'
                f']}}\n\n'
                f'Rules:\n'
                f'1. Generate exactly {len(topic_list)} questions — one per topic\n'
                f'2. Each question must have exactly 4 options\n'
                f'3. answer must be the exact text of the correct option (not A/B/C/D)\n'
                f'4. Use a DIFFERENT question angle, wording, and wrong answers than before\n'
                f'5. Vary question types: definition, application, comparison, example-based\n'
                f'6. Shuffle the position of the correct answer in the options array\n'
                f'7. explanation should be 1-2 sentences\n'
                f'8. Match the difficulty: {difficulty.upper()}'
            ),
            system=(
                'You are an expert at creating diagnostic quiz questions. '
                'Every call must produce completely different questions. '
                'Never repeat the same question wording. Return only valid JSON.'
            )
        )

        parsed    = json.loads(raw)
        questions = parsed.get('questions', [])
        random.shuffle(questions)

        if not questions:
            return jsonify({'message': 'Could not generate questions'}), 500

        return jsonify({
            'subject':   subject.to_dict(),
            'questions': questions,
            'settings': {
                'question_count': len(questions),
                'quiz_mode':      quiz_mode,
                'difficulty':     difficulty,
            }
        }), 200

    except json.JSONDecodeError as e:
        return jsonify({'message': 'AI returned invalid JSON', 'error': str(e)}), 500
    except Exception as e:
        return jsonify({'message': str(e), 'error': traceback.format_exc()}), 500


@diagnostic_bp.route('/submit', methods=['POST'])
@token_required
def submit():
    try:
        user_id = int(get_jwt_identity())
        data    = request.get_json()

        subject_id = data.get('subject_id')
        results    = data.get('results', [])

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

            prev_score  = topic.score or 0
            new_score   = 100.0 if correct else 0.0
            topic.score = (prev_score + new_score) / 2 if topic.status != 'unknown' else new_score

            if topic.score >= 70:
                topic.status = 'strong'
            elif topic.score >= 40:
                topic.status = 'medium'
            else:
                topic.status = 'weak'

            updated.append(topic.to_dict())

        db.session.commit()

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