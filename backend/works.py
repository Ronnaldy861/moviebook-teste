from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models import db, User, Work, Genre, Rating, Favorite

works_bp = Blueprint("works", __name__, url_prefix="/api")

AGE_RATINGS = ("Livre", "10", "12", "15", "18")


def optional_int(value, field_name):
    """Converte para inteiro. Vazio vira None; texto inválido gera ValueError."""
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        raise ValueError(f"O campo {field_name} deve ser um número inteiro.")


def parse_work_payload(data):
    """Valida e limpa os dados de uma obra.
    Devolve (campos, None) se estiver tudo certo, ou (None, mensagem_de_erro)."""
    title = str(data.get("title") or "").strip()
    work_type = str(data.get("type") or "").strip().lower()
    synopsis = str(data.get("synopsis") or "").strip()
    cover_url = str(data.get("cover_url") or "").strip()
    creator = str(data.get("creator") or "").strip()
    company = str(data.get("company") or "").strip()
    age_rating = str(data.get("age_rating") or "Livre").strip()
    genre_ids = data.get("genre_ids") or []

    if not title:
        return None, "O título é obrigatório."
    if work_type not in ("filme", "livro"):
        return None, "O tipo deve ser 'filme' ou 'livro'."
    if len(synopsis) > 600:
        return None, "A sinopse pode ter no máximo 600 caracteres."
    if age_rating not in AGE_RATINGS:
        return None, "Classificação indicativa inválida."
    if cover_url:
        if not (cover_url.startswith("data:image/") or cover_url.startswith("http")):
            return None, "Capa inválida."
        if len(cover_url) > 700_000:
            return None, "A imagem da capa é grande demais."

    try:
        year = optional_int(data.get("year"), "ano")
        length = optional_int(data.get("length"), "duração/páginas")
    except ValueError as error:
        return None, str(error)
    if year is not None and not (1 <= year <= 2100):
        return None, "Informe um ano válido."
    if length is not None and length < 1:
        return None, "Duração/páginas deve ser maior que zero."

    if not isinstance(genre_ids, list):
        return None, "Os gêneros devem ser enviados como uma lista."
    try:
        genre_ids = list(dict.fromkeys(int(g) for g in genre_ids))  # sem repetidos
    except (ValueError, TypeError):
        return None, "Um ou mais gêneros são inválidos."
    genres = Genre.query.filter(Genre.id.in_(genre_ids)).all() if genre_ids else []
    if len(genres) != len(genre_ids):
        return None, "Um ou mais gêneros não existem."

    return {
        "title": title,
        "type": work_type,
        "synopsis": synopsis,
        "year": year,
        "cover_url": cover_url or None,
        "creator": creator or None,
        "company": company or None,
        "length": length,
        "age_rating": age_rating,
        "genres": genres,
    }, None


def work_to_dict(work):
    avg = db.session.query(func.avg(Rating.score)).filter_by(work_id=work.id).scalar()
    total = Rating.query.filter_by(work_id=work.id).count()
    genres = sorted(work.genres, key=lambda g: g.name)
    return {
        "id": work.id,
        "title": work.title,
        "type": work.type,
        "synopsis": work.synopsis,
        "year": work.year,
        "cover_url": work.cover_url,
        "genre": " / ".join(g.name for g in genres) or None,
        "genres": [g.name for g in genres],
        "genre_ids": [g.id for g in genres],
        "creator": work.creator,
        "company": work.company,
        "length": work.length,
        "age_rating": work.age_rating,
        "created_by": work.created_by,
        "rating_avg": round(float(avg), 1) if avg is not None else None,
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
        query = query.filter(Work.genres.any(Genre.id == genre_id))
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
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    fields, error = parse_work_payload(request.get_json() or {})
    if error:
        return jsonify({"error": error}), 400

    work = Work(**fields, created_by=user.id)
    db.session.add(work)
    db.session.commit()
    return jsonify({"message": "Obra cadastrada!", "work": work_to_dict(work)}), 201


@works_bp.route("/works/<int:work_id>", methods=["PUT"])
@jwt_required()
def update_work(work_id):
    user = db.session.get(User, int(get_jwt_identity()))
    work = db.session.get(Work, work_id)

    if not work:
        return jsonify({"error": "Obra não encontrada."}), 404
    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404
    if work.created_by != user.id and not user.is_admin:
        return jsonify({"error": "Você só pode editar obras que cadastrou."}), 403

    fields, error = parse_work_payload(request.get_json() or {})
    if error:
        return jsonify({"error": error}), 400

    for key, value in fields.items():
        setattr(work, key, value)
    db.session.commit()
    return jsonify({"message": "Obra atualizada!", "work": work_to_dict(work)})


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