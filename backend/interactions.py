from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Work, Favorite, Rating
from works import work_to_dict

interactions_bp = Blueprint("interactions", __name__, url_prefix="/api")


# ---------- FAVORITOS ----------

@interactions_bp.route("/favorites", methods=["GET"])
@jwt_required()
def list_favorites():
    user_id = int(get_jwt_identity())
    works = (
        Work.query.join(Favorite, Favorite.work_id == Work.id)
        .filter(Favorite.user_id == user_id)
        .order_by(Work.title)
        .all()
    )
    return jsonify([work_to_dict(w) for w in works])


@interactions_bp.route("/favorites/<int:work_id>", methods=["POST"])
@jwt_required()
def add_favorite(work_id):
    user_id = int(get_jwt_identity())
    if not db.session.get(Work, work_id):
        return jsonify({"error": "Obra não encontrada."}), 404

    if Favorite.query.filter_by(user_id=user_id, work_id=work_id).first():
        return jsonify({"message": "A obra já está nos favoritos."})

    db.session.add(Favorite(user_id=user_id, work_id=work_id))
    db.session.commit()
    return jsonify({"message": "Adicionada aos favoritos!"}), 201


@interactions_bp.route("/favorites/<int:work_id>", methods=["DELETE"])
@jwt_required()
def remove_favorite(work_id):
    user_id = int(get_jwt_identity())
    fav = Favorite.query.filter_by(user_id=user_id, work_id=work_id).first()
    if not fav:
        return jsonify({"error": "A obra não está nos favoritos."}), 404

    db.session.delete(fav)
    db.session.commit()
    return jsonify({"message": "Removida dos favoritos."})


# ---------- AVALIAÇÕES ----------

@interactions_bp.route("/works/<int:work_id>/ratings", methods=["GET"])
def list_ratings(work_id):
    if not db.session.get(Work, work_id):
        return jsonify({"error": "Obra não encontrada."}), 404

    rows = (
        db.session.query(Rating, User.name)
        .join(User, User.id == Rating.user_id)
        .filter(Rating.work_id == work_id)
        .order_by(Rating.created_at.desc())
        .all()
    )
    return jsonify([
        {
            "id": r.id,
            "user_name": name,
            "score": r.score,
            "comment": r.comment,
            "created_at": r.created_at.isoformat(),
        }
        for r, name in rows
    ])


@interactions_bp.route("/works/<int:work_id>/ratings", methods=["POST"])
@jwt_required()
def rate_work(work_id):
    user_id = int(get_jwt_identity())
    if not db.session.get(Work, work_id):
        return jsonify({"error": "Obra não encontrada."}), 404

    data = request.get_json() or {}
    comment = data.get("comment", "").strip()
    try:
        score = int(data.get("score"))
    except (ValueError, TypeError):
        return jsonify({"error": "A nota deve ser um número de 1 a 5."}), 400
    if score < 1 or score > 5:
        return jsonify({"error": "A nota deve ser de 1 a 5."}), 400

    # se o usuário já avaliou, atualiza; senão, cria
    rating = Rating.query.filter_by(user_id=user_id, work_id=work_id).first()
    if rating:
        rating.score = score
        rating.comment = comment
        message = "Avaliação atualizada!"
        status = 200
    else:
        db.session.add(Rating(user_id=user_id, work_id=work_id, score=score, comment=comment))
        message = "Avaliação registrada!"
        status = 201
    db.session.commit()

    work = db.session.get(Work, work_id)
    return jsonify({"message": message, "work": work_to_dict(work)}), status


@interactions_bp.route("/works/<int:work_id>/ratings", methods=["DELETE"])
@jwt_required()
def delete_my_rating(work_id):
    user_id = int(get_jwt_identity())
    rating = Rating.query.filter_by(user_id=user_id, work_id=work_id).first()
    if not rating:
        return jsonify({"error": "Você ainda não avaliou esta obra."}), 404

    db.session.delete(rating)
    db.session.commit()
    return jsonify({"message": "Avaliação removida."})


# ---------- STATUS DO USUÁRIO NA OBRA ----------

@interactions_bp.route("/works/<int:work_id>/me", methods=["GET"])
@jwt_required()
def my_status(work_id):
    """Diz se a obra está nos favoritos e qual nota o usuário deu.
    O front-end usa isso para pintar o coração e as estrelas."""
    user_id = int(get_jwt_identity())
    fav = Favorite.query.filter_by(user_id=user_id, work_id=work_id).first()
    rating = Rating.query.filter_by(user_id=user_id, work_id=work_id).first()
    return jsonify({
        "is_favorite": fav is not None,
        "my_score": rating.score if rating else None,
        "my_comment": rating.comment if rating else None,
    })