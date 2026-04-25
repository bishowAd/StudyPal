import os
import json
import google.generativeai as genai
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

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
You are generating a 5-room Knowledge Dungeon study game for a student.
Rooms must be in EXACTLY this order: battle, battle, treasure, battle, boss.

Rules:
- All questions must be answerable from the notes provided
- Keep explanations under 3 sentences
- Return ONLY valid JSON, no markdown

Notes:
{notes}

Return this exact JSON:
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
      "type": "battle",
      "monster_name": "different creative monster name",
      "question": "another multiple choice question from the notes",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_index": 2,
      "explanation": "1-2 sentences"
    }},
    {{
      "type": "treasure",
      "concept": "key concept name from the notes",
      "fun_fact": "an interesting fact about this concept from the notes",
      "bonus_xp": 30
    }},
    {{
      "type": "battle",
      "monster_name": "another monster name",
      "question": "multiple choice question from the notes",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_index": 1,
      "explanation": "1-2 sentences"
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

@games_bp.route("/api/games/dungeon/generate", methods=["POST"])
@jwt_required(optional=True)
def generate_dungeon():
    data = request.get_json() or {}
    notes_text = data.get("notes_text", "").strip()
    topic = data.get("topic", "").strip()

    if not notes_text and not topic:
        return jsonify({"error": "Provide notes_text or topic"}), 400

    context = notes_text[:6000] if notes_text else f"Topic: {topic}"

    try:
        dungeon = gemini_json(DUNGEON_PROMPT.format(notes=context))
        return jsonify(dungeon), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500