from flask import Blueprint, request, jsonify, Response, stream_with_context
from flask_jwt_extended import jwt_required
from src.ai import ask_ai, ask_ai_stream

chat_bp = Blueprint('chat', __name__)


@chat_bp.post('/')
@jwt_required()
def chat():
    data = request.get_json(silent=True) or {}
    message = data.get('message', '').strip()
    if not message:
        return jsonify({'error': 'message is required'}), 400
    reply = ask_ai(message)
    return jsonify({'reply': reply})


@chat_bp.post('/stream')
@jwt_required()
def chat_stream():
    data = request.get_json(silent=True) or {}
    message = data.get('message', '').strip()
    if not message:
        return jsonify({'error': 'message is required'}), 400

    def generate():
        for token in ask_ai_stream(message):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'},
    )
