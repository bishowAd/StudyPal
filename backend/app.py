from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from extensions import db, migrate, jwt
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI']        = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY']                 = os.getenv('JWT_SECRET_KEY')
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=['http://localhost:5173'])
    with app.app_context():
        from src.models import User, Note
    from src.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    from src.routes.notes import notes_bp
    app.register_blueprint(notes_bp, url_prefix='/api/notes')
    from src.routes.chat import chat_bp
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    @app.route('/')
    def index():
        return jsonify({'status': 'API is running'})
    @app.route('/db-check')
    def db_check():
        try:
            db.session.execute(db.text('SELECT 1'))
            return jsonify({'status': 'Database connected successfully'})
        except Exception as e:
            return jsonify({'status': 'Database connection failed', 'error': str(e)}), 500
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
