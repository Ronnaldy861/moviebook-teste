from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models import db, User, Work, Genre, Rating, Favorite

works_bp = Blueprint("works", __name__, url_prefix="/api")


def work_to_dict(work):
    avg = db.session.query(func.avg(Rating.score)).filter_by(work_id=work.id).scalar()
    total = Rating.query.filter_by(work_id=work.id).count()
    return {
        "id": work.id,
        "title": work.title,
        "type": work.type,
        "synopsis": work.synopsis,
        "year": work.year,
        "cover_url": work.cover_url,
        "genre": work.genre.name if work.genre else None,
        "genre_id": work.genre_id,
        "created_by": work.created_by,
        "rating_avg": round(float(avg), 1) if avg else None,
        "rating_count": total,
    }


@works_bp.route("/genres", methods=["GET"])
def list_genres():
    genres = Genre.query.order_by(Genre.name).all()
    return jsonify([{"id": g.id, "name": g.name} for g in genres])


@works_bp.route("/works", methods=["GET"])
def list_works():
    q = request.args.get("q", "").strip()
    genre_id = request.args.get("genre", type=int)
    work_type = request.args.get("type", "").strip().lower()

    query = Work.query
    if q:
        query = query.filter(Work.title.ilike(f"%{q}%"))
    if genre_id:
        query = query.filter_by(genre_id=genre_id)
    if work_type in ("filme", "livro"):
        query = query.filter_by(type=work_type)

    works = query.order_by(Work.created_at.desc()).all()
    return jsonify([work_to_dict(w) for w in works])


@works_bp.route("/works/<int:work_id>", methods=["GET"])
def get_work(work_id):
    work = db.session.get(Work, work_id)
    if not work:
        return jsonify({"error": "Obra não encontrada."}), 404
    return jsonify(work_to_dict(work))


@works_bp.route("/works", methods=["POST"])
@jwt_required()
def create_work():
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    work_type = data.get("type", "").strip().lower()
    synopsis = data.get("synopsis", "").strip()
    cover_url = data.get("cover_url", "").strip()
    year = data.get("year")
    genre_id = data.get("genre_id")

    if not title:
        return jsonify({"error": "O título é obrigatório."}), 400
    if work_type not in ("filme", "livro"):
        return jsonify({"error": "O tipo deve ser 'filme' ou 'livro'."}), 400
    if year is not None:
        try:
            year = int(year)
        except (ValueError, TypeError):
            return jsonify({"error": "O ano deve ser um número."}), 400
    if genre_id and not db.session.get(Genre, genre_id):
        return jsonify({"error": "Gênero inválido."}), 400

    work = Work(
        title=title,
        type=work_type,
        synopsis=synopsis,
        year=year,
        cover_url=cover_url,
        genre_id=genre_id or None,
        created_by=int(get_jwt_identity()),
    )
    db.session.add(work)
    db.session.commit()
    return jsonify({"message": "Obra cadastrada!", "work": work_to_dict(work)}), 201


@works_bp.route("/works/<int:work_id>", methods=["DELETE"])
@jwt_required()
def delete_work(work_id):
    user = db.session.get(User, int(get_jwt_identity()))
    work = db.session.get(Work, work_id)

    if not work:
        return jsonify({"error": "Obra não encontrada."}), 404
    if work.created_by != user.id and not user.is_admin:
        return jsonify({"error": "Você só pode excluir obras que cadastrou."}), 403

    # apaga favoritos e avaliações ligados à obra antes de apagá-la
    Favorite.query.filter_by(work_id=work.id).delete()
    Rating.query.filter_by(work_id=work.id).delete()
    db.session.delete(work)
    db.session.commit()
    return jsonify({"message": "Obra excluída."})