import os
import smtplib
from email.message import EmailMessage
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Work
from auth import user_to_dict
from works import work_to_dict

profile_bp = Blueprint("profile", __name__, url_prefix="/api")

RESET_MAX_AGE = 3600  # o link vale 1 hora


# ---------- PERFIL ----------

@profile_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user = db.session.get(User, int(get_jwt_identity()))
    data = request.get_json() or {}
    name = data.get("name", user.name).strip()
    email = data.get("email", user.email).strip().lower()

    if not name or not email:
        return jsonify({"error": "Nome e e-mail não podem ficar vazios."}), 400

    other = User.query.filter_by(email=email).first()
    if other and other.id != user.id:
        return jsonify({"error": "Este e-mail já está em uso."}), 409

    user.name = name
    user.email = email
    db.session.commit()
    return jsonify({"message": "Perfil atualizado!", "user": user_to_dict(user)})


@profile_bp.route("/profile/password", methods=["PUT"])
@jwt_required()
def change_password():
    user = db.session.get(User, int(get_jwt_identity()))
    data = request.get_json() or {}
    current = data.get("current_password", "")
    new = data.get("new_password", "")

    if not check_password_hash(user.password_hash, current):
        return jsonify({"error": "A senha atual está incorreta."}), 400
    if len(new) < 6:
        return jsonify({"error": "A nova senha deve ter pelo menos 6 caracteres."}), 400

    user.password_hash = generate_password_hash(new)
    db.session.commit()
    return jsonify({"message": "Senha alterada com sucesso!"})


@profile_bp.route("/profile/works", methods=["GET"])
@jwt_required()
def my_works():
    """Obras cadastradas pelo usuário logado."""
    user_id = int(get_jwt_identity())
    works = Work.query.filter_by(created_by=user_id).order_by(Work.created_at.desc()).all()
    return jsonify([work_to_dict(w) for w in works])


# ---------- RECUPERAÇÃO DE SENHA ----------

def get_serializer():
    return URLSafeTimedSerializer(current_app.config["JWT_SECRET_KEY"], salt="reset-senha")


def send_reset_email(user, link):
    """Envia o e-mail se o SMTP estiver configurado no .env.
    Se não estiver, mostra o link no terminal (modo de desenvolvimento)."""
    host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not (host and smtp_user and smtp_password):
        print("\n=== LINK DE RECUPERAÇÃO (modo desenvolvimento) ===")
        print(f"Usuário: {user.email}")
        print(link)
        print("==================================================\n")
        return

    msg = EmailMessage()
    msg["Subject"] = "MovieBook - Recuperação de senha"
    msg["From"] = smtp_user
    msg["To"] = user.email
    msg.set_content(
        f"Olá, {user.name}!\n\n"
        f"Para criar uma nova senha, acesse o link abaixo (vale por 1 hora):\n{link}\n\n"
        "Se você não pediu isso, ignore este e-mail."
    )
    with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", 587))) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)


@profile_bp.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    user = User.query.filter_by(email=email).first()

    if user:
        # o pedaço do hash da senha faz o link funcionar só uma vez
        token = get_serializer().dumps({"id": user.id, "h": user.password_hash[-10:]})
        frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
        link = f"{frontend}/redefinir-senha?token={token}"
        try:
            send_reset_email(user, link)
        except Exception as e:
            print("Erro ao enviar e-mail:", e)

    # mesma resposta existindo ou não, para não revelar quais e-mails estão cadastrados
    return jsonify({"message": "Se o e-mail estiver cadastrado, enviaremos um link de recuperação."})


@profile_bp.route("/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    token = data.get("token", "")
    new = data.get("new_password", "")

    if len(new) < 6:
        return jsonify({"error": "A nova senha deve ter pelo menos 6 caracteres."}), 400

    try:
        info = get_serializer().loads(token, max_age=RESET_MAX_AGE)
    except SignatureExpired:
        return jsonify({"error": "O link expirou. Peça um novo."}), 400
    except BadSignature:
        return jsonify({"error": "Link inválido."}), 400

    user = db.session.get(User, info["id"])
    if not user or user.password_hash[-10:] != info["h"]:
        return jsonify({"error": "Este link já foi usado ou é inválido."}), 400

    user.password_hash = generate_password_hash(new)
    db.session.commit()
    return jsonify({"message": "Senha redefinida! Já pode fazer login."})