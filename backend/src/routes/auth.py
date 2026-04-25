from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity
from src.middleware.auth import token_required
from src.models.user import User
from extensions import db
import bcrypt

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data     = request.get_json()
        username = data.get('username', '').strip()
        email    = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not all([username, email, password]):
            return jsonify({'message': 'All fields are required'}), 400

        if len(password) < 6:
            return jsonify({'message': 'Password must be at least 6 characters'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Email already registered'}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'message': 'Username already taken'}), 400

        password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        user = User(
            username = username,
            email    = email,
            password = password_hash,
        )
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.id))

        return jsonify({
            'token': token,
            'user':  user.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Server error', 'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data     = request.get_json()
        email    = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not all([email, password]):
            return jsonify({'message': 'Email and password are required'}), 400

        user = User.query.filter_by(email=email).first()

        if not user or not bcrypt.checkpw(
            password.encode('utf-8'),
            user.password.encode('utf-8')
        ):
            return jsonify({'message': 'Invalid email or password'}), 400

        token = create_access_token(identity=str(user.id))

        return jsonify({
            'token': token,
            'user':  user.to_dict(),
        })

    except Exception as e:
        return jsonify({'message': 'Server error', 'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@token_required
def me():
    try:
        user_id = get_jwt_identity()
        user    = User.query.get(int(user_id))
        if not user:
            return jsonify({'message': 'User not found'}), 404
        return jsonify(user.to_dict())
    except Exception as e:
        return jsonify({'message': 'Server error', 'error': str(e)}), 500