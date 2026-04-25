import os
import json
import google.generativeai as genai
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from src.models.subject import Subject

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
_model = genai.GenerativeModel("gemini-2.5-flash")

def gemini_json(prompt: str) -> dict:
    response = _model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )
    raw = response.text.strip().lstrip("```json").rstrip("```").strip()
    return json.loads(raw)

games_bp = Blueprint("games", __name__)

DUNGEON_PROMPT = """
You are generating a Knowledge Dungeon study game for a student.
The dungeon has exactly {room_count} rooms total.

Room layout rules based on total rooms:
- Every dungeon MUST end with exactly 1 boss room (last room)
- Place 1 treasure room in the middle
- All other rooms are battle rooms
- Example for 5 rooms: battle, battle, treasure, battle, boss
- Example for 8 rooms: battle, battle, battle, treasure, battle, battle, battle, boss
- Example for 10 rooms: battle, battle, battle, battle, treasure, battle, battle, battle, battle, boss

Rules:
- All questions must be answerable from the notes provided
- Keep explanations under 3 sentences
- Return ONLY valid JSON, no markdown

Notes:
{notes}

Return this exact JSON structure with exactly {room_count} rooms:
{{
  "floor_title": "creative 4-word dungeon title based on the subject",
  "rooms": [
    {{
      "type": "battle",
      "monster_name": "creative monster name",
      "question": "multiple choice question from the notes",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_index": 0,
      "explanation": "1-2 sentences explaining why the correct answer is right"
    }},
    {{
      "type": "treasure",
      "concept": "key concept name from the notes",
      "fun_fact": "an interesting fact about this concept from the notes",
      "bonus_xp": 30
    }},
    {{
      "type": "boss",
      "boss_name": "dramatic boss name tied to a major concept",
      "boss_intro": "one dramatic sentence introducing this boss",
      "question": "a harder conceptual question requiring deeper understanding",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_index": 3,
      "explanation": "2-3 sentences with detailed explanation",
      "bonus_xp": 50
    }}
  ]
}}
"""

FLASHCARDS_PROMPT = """
You are generating flashcards from a student's uploaded study notes.
Create exactly {count} flashcards that cover the most important concepts.

Rules:
- Front: a clear, concise question or term (max 15 words)
- Back: a clear, accurate answer or definition (max 40 words)
- Cover a variety of topics from the notes
- Return ONLY valid JSON, no markdown

Notes:
{notes}

Return this exact JSON:
{{
  "deck_title": "short descriptive title for this deck",
  "flashcards": [
    {{"front": "question or term", "back": "answer or definition"}},
    {{"front": "question or term", "back": "answer or definition"}}
  ]
}}
"""


@games_bp.route("/api/games/dungeon/generate", methods=["POST"])
@jwt_required(optional=True)
def generate_dungeon():
    from flask_jwt_extended import get_jwt_identity as _get_id
    data = request.get_json() or {}
    subject_id = data.get("subject_id")
    notes_text = data.get("notes_text", "").strip()
    room_count = max(5, min(int(data.get("room_count", 5)), 20))

    if subject_id:
        try:
            uid = _get_id()
            subject = Subject.query.filter_by(id=subject_id, user_id=int(uid)).first() if uid else                       Subject.query.filter_by(id=subject_id).first()
            if not subject:
                return jsonify({"error": "Subject not found"}), 404
            notes_text = subject.extracted_text
        except Exception:
            subject = Subject.query.filter_by(id=subject_id).first()
            if not subject:
                return jsonify({"error": "Subject not found"}), 404
            notes_text = subject.extracted_text

    if not notes_text:
        return jsonify({"error": "Provide subject_id or notes_text"}), 400

    try:
        dungeon = gemini_json(DUNGEON_PROMPT.format(notes=notes_text[:6000], room_count=room_count))
        return jsonify(dungeon), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@games_bp.route("/api/games/flashcards/generate", methods=["POST"])
@jwt_required(optional=True)
def generate_flashcards():
    from flask_jwt_extended import get_jwt_identity as _get_id
    data = request.get_json() or {}
    subject_id = data.get("subject_id")
    notes_text = data.get("notes_text", "").strip()
    count = min(int(data.get("count", 10)), 20)

    if subject_id:
        try:
            uid = _get_id()
            subject = Subject.query.filter_by(id=subject_id, user_id=int(uid)).first() if uid else                       Subject.query.filter_by(id=subject_id).first()
            if not subject:
                return jsonify({"error": "Subject not found"}), 404
            notes_text = subject.extracted_text
        except Exception:
            subject = Subject.query.filter_by(id=subject_id).first()
            if not subject:
                return jsonify({"error": "Subject not found"}), 404
            notes_text = subject.extracted_text

    if not notes_text:
        return jsonify({"error": "Provide subject_id or notes_text"}), 400

    try:
        deck = gemini_json(FLASHCARDS_PROMPT.format(notes=notes_text[:6000], count=count))
        return jsonify(deck), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500