
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models import db, User, Work, Genre, Rating, Favorite

works_bp = Blueprint("works", __name__, url_prefix="/api")

AGE_RATINGS = ("Livre", "10", "12", "15", "18")


def optional_int(value, field_name):
    if value is None or value == "":
        return None

    try:
        return int(value)
    except (ValueError, TypeError):
        raise ValueError(f"O campo {field_name} deve ser um número inteiro.")


def work_to_dict(work):
    avg = db.session.query(func.avg(Rating.score)).filter_by(
        work_id=work.id
    ).scalar()

    total = Rating.query.filter_by(work_id=work.id).count()

    genres = [
        {"id": genre.id, "name": genre.name}
        for genre in work.genres
    ]

    return {
        "id": work.id,
        "title": work.title,
        "type": work.type,
        "synopsis": work.synopsis,
        "year": work.year,
        "creator": work.creator,
        "company": work.company,
        "length": work.length,
        "age_rating": work.age_rating or "Livre",
        "author": work.author,
        "cover_url": work.cover_url,
        "genres": genres,
        "genre_ids": [genre.id for genre in work.genres],
        "genre": ", ".join(genre.name for genre in work.genres),
        "genre_id": work.genre_id,
        "created_by": work.created_by,
        "rating_avg": round(float(avg), 1) if avg else None,
        "rating_count": total,
    }


@works_bp.route("/genres", methods=["GET"])
def list_genres():
    genres = Genre.query.order_by(Genre.name).all()

    return jsonify([
        {"id": genre.id, "name": genre.name}
        for genre in genres
    ])


@works_bp.route("/works", methods=["GET"])
def list_works():
    q = request.args.get("q", "").strip()
    genre_id = request.args.get("genre", type=int)
    work_type = request.args.get("type", "").strip().lower()

    query = Work.query

    if q:
        query = query.filter(Work.title.ilike(f"%{q}%"))

    if genre_id:
        query = query.filter(
            Work.genres.any(Genre.id == genre_id)
        )

    if work_type in ("filme", "livro"):
        query = query.filter_by(type=work_type)

    works = query.order_by(Work.created_at.desc()).all()

    return jsonify([work_to_dict(work) for work in works])


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

    title = (data.get("title") or "").strip()
    work_type = (data.get("type") or "").strip().lower()
    synopsis = (data.get("synopsis") or "").strip()
    creator = (data.get("creator") or "").strip()
    company = (data.get("company") or "").strip()
    cover_url = (data.get("cover_url") or "").strip()
    age_rating = (data.get("age_rating") or "Livre").strip()

    try:
        year = optional_int(data.get("year"), "ano")
        length = optional_int(data.get("length"), "duração/páginas")
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    genre_ids = data.get("genre_ids", [])

    if not isinstance(genre_ids, list):
        return jsonify({"error": "Os gêneros devem ser enviados como uma lista."}), 400

    try:
        genre_ids = list(dict.fromkeys(int(value) for value in genre_ids))
    except (ValueError, TypeError):
        return jsonify({"error": "Um ou mais gêneros são inválidos."}), 400

    if not title:
        return jsonify({"error": "O título é obrigatório."}), 400

    if work_type not in ("filme", "livro"):
        return jsonify({"error": "O tipo deve ser 'filme' ou 'livro'."}), 400

    if age_rating not in AGE_RATINGS:
        return jsonify({"error": "Classificação indicativa inválida."}), 400

    if len(cover_url) > 700000:
        return jsonify({"error": "A imagem enviada é muito grande."}), 400

    if year is not None and (year < 1 or year > 9999):
        return jsonify({"error": "Informe um ano válido."}), 400

    if length is not None and length < 1:
        return jsonify({"error": "A duração ou quantidade de páginas deve ser positiva."}), 400

    genres = Genre.query.filter(Genre.id.in_(genre_ids)).all() if genre_ids else []

    if len(genres) != len(genre_ids):
        return jsonify({"error": "Um ou mais gêneros não existem."}), 400

    user = db.session.get(User, int(get_jwt_identity()))

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    work = Work(
        title=title,
        type=work_type,
        synopsis=synopsis,
        year=year,
        creator=creator or None,
        company=company or None,
        length=length,
        age_rating=age_rating,
        cover_url=cover_url or None,
        genres=genres,
        # Compatibilidade temporária com o campo antigo
        author=creator if work_type == "livro" else None,
        genre_id=genre_ids[0] if genre_ids else None,
        created_by=user.id,
    )

    db.session.add(work)
    db.session.commit()

    return jsonify({
        "message": "Obra cadastrada!",
        "work": work_to_dict(work)
    }), 201


@works_bp.route("/works/<int:work_id>", methods=["DELETE"])
@jwt_required()
def delete_work(work_id):
    user = db.session.get(User, int(get_jwt_identity()))
    work = db.session.get(Work, work_id)

    if not work:
        return jsonify({"error": "Obra não encontrada."}), 404

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    if work.created_by != user.id and not user.is_admin:
        return jsonify({"error": "Você só pode excluir obras que cadastrou."}), 403

    Favorite.query.filter_by(work_id=work.id).delete()
    Rating.query.filter_by(work_id=work.id).delete()

    db.session.delete(work)
    db.session.commit()

    return jsonify({"message": "Obra excluída."})
