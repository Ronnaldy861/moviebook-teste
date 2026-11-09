
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


# Tabela de associação: permite vários gêneros por obra
work_genre = db.Table(
    "work_genre",
    db.Column(
        "work_id",
        db.Integer,
        db.ForeignKey("work.id"),
        primary_key=True
    ),
    db.Column(
        "genre_id",
        db.Integer,
        db.ForeignKey("genre.id"),
        primary_key=True
    )
)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    phone = db.Column(db.String(15))
    age = db.Column(db.Integer)


class Genre(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)


class Work(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(10), nullable=False)
    synopsis = db.Column(db.Text)
    year = db.Column(db.Integer)

    # Novos campos
    creator = db.Column(db.String(150))
    company = db.Column(db.String(150))
    length = db.Column(db.Integer)
    age_rating = db.Column(db.String(5), default="Livre")

    # Capa
    cover_url = db.Column(db.Text)

    # Relacionamento com vários gêneros
    genres = db.relationship(
        "Genre",
        secondary=work_genre,
        lazy="selectin"
    )

    # Campos antigos mantidos temporariamente
    # para compatibilidade com outras partes do sistema
    author = db.Column(db.String(255))
    genre_id = db.Column(db.Integer, db.ForeignKey("genre.id"))
    genre = db.relationship("Genre", foreign_keys=[genre_id])

    created_by = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    work_id = db.Column(db.Integer, db.ForeignKey("work.id"), nullable=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "work_id"),
    )


class Rating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    work_id = db.Column(db.Integer, db.ForeignKey("work.id"), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_id", "work_id"),
    )
