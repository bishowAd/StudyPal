from flask_jwt_extended import verify_jwt_in_request
from flask import jsonify
from functools import wraps

def token_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return fn(*args, **kwargs)
        except Exception:
            return jsonify({'message': 'Invalid or missing token'}), 401
    return wrapper