
from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models import db, User, Work, Genre, Favorite, Rating
from works import work_to_dict

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def admin_required(fn):
    """Exige login E que o usuário seja administrador."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = db.session.get(User, int(get_jwt_identity()))
        if not user or not user.is_admin:
            return jsonify({"error": "Acesso restrito a administradores."}), 403
        return fn(*args, **kwargs)
    return wrapper


# ---------- OBRAS ----------

@admin_bp.route("/works/<int:work_id>", methods=["PUT"])
@admin_required
def edit_work(work_id):
    work = db.session.get(Work, work_id)

    if not work:
        return jsonify({"error": "Obra não encontrada."}), 404

    data = request.get_json() or {}

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "O título não pode ficar vazio."}), 400
        work.title = title

    if "type" in data:
        work_type = (data.get("type") or "").strip().lower()
        if work_type not in ("filme", "livro"):
            return jsonify({"error": "O tipo deve ser 'filme' ou 'livro'."}), 400
        work.type = work_type

    if "synopsis" in data:
        work.synopsis = (data.get("synopsis") or "").strip()

    if "author" in data:
        author = (data.get("author") or "").strip()
        work.author = author if work.type == "livro" else None

    if "cover_url" in data:
        work.cover_url = (data.get("cover_url") or "").strip()

    if "year" in data:
        try:
            work.year = int(data["year"]) if data["year"] not in (None, "") else None
        except (ValueError, TypeError):
            return jsonify({"error": "O ano deve ser um número."}), 400

    if "genre_id" in data:
        genre_id = data["genre_id"]
        if genre_id and not db.session.get(Genre, genre_id):
            return jsonify({"error": "Gênero inválido."}), 400
        work.genre_id = genre_id or None

    # Filmes não possuem autor.
    if work.type == "filme":
        work.author = None

    db.session.commit()

    return jsonify({
        "message": "Obra atualizada!",
        "work": work_to_dict(work)
    })


# ---------- GÊNEROS ----------

@admin_bp.route("/genres", methods=["POST"])
@admin_required
def create_genre():
    name = (request.get_json() or {}).get("name", "").strip()

    if not name:
        return jsonify({"error": "O nome do gênero é obrigatório."}), 400

    if Genre.query.filter(func.lower(Genre.name) == name.lower()).first():
        return jsonify({"error": "Esse gênero já existe."}), 409

    genre = Genre(name=name)
    db.session.add(genre)
    db.session.commit()

    return jsonify({
        "message": "Gênero criado!",
        "genre": {"id": genre.id, "name": genre.name}
    }), 201


@admin_bp.route("/genres/<int:genre_id>", methods=["PUT"])
@admin_required
def rename_genre(genre_id):
    genre = db.session.get(Genre, genre_id)

    if not genre:
        return jsonify({"error": "Gênero não encontrado."}), 404

    name = (request.get_json() or {}).get("name", "").strip()

    if not name:
        return jsonify({"error": "O nome do gênero é obrigatório."}), 400

    other = Genre.query.filter(func.lower(Genre.name) == name.lower()).first()

    if other and other.id != genre.id:
        return jsonify({"error": "Já existe um gênero com esse nome."}), 409

    genre.name = name
    db.session.commit()

    return jsonify({
        "message": "Gênero atualizado!",
        "genre": {"id": genre.id, "name": genre.name}
    })


@admin_bp.route("/genres/<int:genre_id>", methods=["DELETE"])
@admin_required
def delete_genre(genre_id):
    genre = db.session.get(Genre, genre_id)

    if not genre:
        return jsonify({"error": "Gênero não encontrado."}), 404

    em_uso = Work.query.filter_by(genre_id=genre_id).count()

    if em_uso > 0:
        return jsonify({
            "error": f"Não é possível excluir: {em_uso} obra(s) usam este gênero."
        }), 409

    db.session.delete(genre)
    db.session.commit()

    return jsonify({"message": "Gênero excluído."})


# ---------- ESTATÍSTICAS ----------

@admin_bp.route("/stats", methods=["GET"])
@admin_required
def stats():
    # Obras por gênero (inclui gêneros com 0 obras).
    por_genero = (
        db.session.query(Genre.name, func.count(Work.id))
        .outerjoin(Work, Work.genre_id == Genre.id)
        .group_by(Genre.id, Genre.name)
        .order_by(func.count(Work.id).desc())
        .all()
    )

    # Mais bem avaliadas.
    mais_bem_avaliadas = (
        db.session.query(
            Work.id,
            Work.title,
            func.avg(Rating.score),
            func.count(Rating.id)
        )
        .join(Rating, Rating.work_id == Work.id)
        .group_by(Work.id, Work.title)
        .order_by(
            func.avg(Rating.score).desc(),
            func.count(Rating.id).desc()
        )
        .limit(5)
        .all()
    )

    # Mais favoritadas.
    mais_favoritadas = (
        db.session.query(
            Work.id,
            Work.title,
            func.count(Favorite.id)
        )
        .join(Favorite, Favorite.work_id == Work.id)
        .group_by(Work.id, Work.title)
        .order_by(func.count(Favorite.id).desc())
        .limit(5)
        .all()
    )

    return jsonify({
        "totals": {
            "users": User.query.count(),
            "works": Work.query.count(),
            "movies": Work.query.filter_by(type="filme").count(),
            "books": Work.query.filter_by(type="livro").count(),
            "genres": Genre.query.count(),
            "favorites": Favorite.query.count(),
            "ratings": Rating.query.count(),
        },
        "works_by_genre": [
            {"genre": g, "total": t}
            for g, t in por_genero
        ],
        "top_rated": [
            {
                "id": i,
                "title": t,
                "avg": round(float(a), 1),
                "count": c
            }
            for i, t, a, c in mais_bem_avaliadas
        ],
        "most_favorited": [
            {"id": i, "title": t, "total": c}
            for i, t, c in mais_favoritadas
        ],
    })
