import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from profile import profile_bp

from models import db
from auth import auth_bp
from works import works_bp
from interactions import interactions_bp


load_dotenv()


def create_app():
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

    CORS(app)
    JWTManager(app)
    db.init_app(app)

    # Registra cada Blueprint apenas uma vez
    app.register_blueprint(auth_bp)
    app.register_blueprint(works_bp)
    app.register_blueprint(interactions_bp)
    app.register_blueprint(profile_bp)

    with app.app_context():
        db.create_all()

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


if __name__ == "__main__":
    create_app().run(debug=True)
