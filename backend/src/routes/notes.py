import os
import tempfile
from flask import Blueprint, request, jsonify, Response, stream_with_context
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from src.models.note import Note
from src.rag import extract_text, chunk_text, store_chunks, search_chunks, delete_collection
from src.ai import ask_ai, ask_ai_stream

notes_bp = Blueprint('notes', __name__)

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.pptx'}


def _allowed(filename: str) -> bool:
    return os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS


@notes_bp.post('/upload')
@jwt_required()
def upload_note():
    user_id = int(get_jwt_identity())
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if not file.filename or not _allowed(file.filename):
        return jsonify({'error': 'Unsupported file type'}), 400

    suffix = os.path.splitext(file.filename)[1].lower()
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        text = extract_text(tmp_path)
        chunks = chunk_text(text)

        note = Note(
            user_id=user_id,
            filename=file.filename,
            extracted_text=text,
            chunk_count=len(chunks),
        )
        db.session.add(note)
        db.session.flush()

        store_chunks(user_id, note.id, chunks)

        summary_prompt = (
            f"Summarize the following document in 3-5 sentences:\n\n{text[:4000]}"
        )
        note.summary = ask_ai(summary_prompt)
        db.session.commit()
    finally:
        os.unlink(tmp_path)

    return jsonify(note.to_dict()), 201


@notes_bp.post('/ask')
@jwt_required()
def ask_note():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    note_id = data.get('note_id')
    question = data.get('question', '').strip()
    if not note_id or not question:
        return jsonify({'error': 'note_id and question are required'}), 400

    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    if not note:
        return jsonify({'error': 'Note not found'}), 404

    context_chunks = search_chunks(user_id, note_id, question)
    context = "\n\n".join(context_chunks)
    prompt = (
        f"Answer the question using ONLY the context below. "
        f"If the answer is not in the context, say so.\n\n"
        f"Context:\n{context}\n\nQuestion: {question}"
    )
    answer = ask_ai(prompt)
    return jsonify({'answer': answer})


@notes_bp.post('/ask/stream')
@jwt_required()
def ask_note_stream():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    note_id = data.get('note_id')
    question = data.get('question', '').strip()
    if not note_id or not question:
        return jsonify({'error': 'note_id and question are required'}), 400

    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    if not note:
        return jsonify({'error': 'Note not found'}), 404

    context_chunks = search_chunks(user_id, note_id, question)
    context = "\n\n".join(context_chunks)
    prompt = (
        f"Answer the question using ONLY the context below. "
        f"If the answer is not in the context, say so.\n\n"
        f"Context:\n{context}\n\nQuestion: {question}"
    )

    def generate():
        for token in ask_ai_stream(prompt):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'},
    )


@notes_bp.get('/')
@jwt_required()
def list_notes():
    user_id = int(get_jwt_identity())
    notes = Note.query.filter_by(user_id=user_id).order_by(Note.created_at.desc()).all()
    return jsonify([n.to_dict() for n in notes])


@notes_bp.get('/<int:note_id>')
@jwt_required()
def get_note(note_id):
    user_id = int(get_jwt_identity())
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    if not note:
        return jsonify({'error': 'Note not found'}), 404
    return jsonify(note.to_dict())


@notes_bp.delete('/<int:note_id>')
@jwt_required()
def delete_note(note_id):
    user_id = int(get_jwt_identity())
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    if not note:
        return jsonify({'error': 'Note not found'}), 404
    delete_collection(user_id, note_id)
    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Note deleted'})
