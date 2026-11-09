
import re

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def only_digits(value):
    return re.sub(r"\D", "", str(value or ""))


def user_to_dict(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "is_admin": user.is_admin,
    }


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    phone = only_digits(data.get("phone"))

    try:
        age = int(data.get("age"))
    except (TypeError, ValueError):
        age = 0

    if not name or not email or not password or not phone or not data.get("age"):
        return jsonify({
            "error": "Preencha todos os campos obrigatórios."
        }), 400

    if age < 1 or age > 120:
        return jsonify({
            "error": "A idade deve estar entre 1 e 120 anos."
        }), 400

    if len(phone) not in (10, 11):
        return jsonify({
            "error": "Informe um telefone válido com DDD."
        }), 400

    if len(password) < 6:
        return jsonify({
            "error": "A senha deve ter pelo menos 6 caracteres."
        }), 400

    if User.query.filter_by(email=email).first():
        return jsonify({
            "error": "Este e-mail já está cadastrado."
        }), 409

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        phone=phone,
        age=age,
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Conta criada com sucesso!",
        "user": user_to_dict(user)
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({
            "error": "E-mail ou senha incorretos."
        }), 401

    # O identity do JWT precisa ser texto (string).
    token = create_access_token(identity=str(user.id))

    return jsonify({
        "token": token,
        "user": user_to_dict(user)
    })


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = db.session.get(User, int(get_jwt_identity()))

    if not user:
        return jsonify({
            "error": "Usuário não encontrado."
        }), 404

    return jsonify(user_to_dict(user))
