from app import create_app
from models import db, Genre, Work

GENEROS = ["Ação", "Aventura", "Comédia", "Drama", "Ficção Científica",
           "Fantasia", "Terror", "Romance", "Suspense", "Animação"]

OBRAS = [
    ("Interestelar", "filme", 2014, "Ficção Científica",
     "Exploradores viajam através de um buraco de minhoca em busca de um novo lar para a humanidade."),
    ("Dom Casmurro", "livro", 1899, "Romance",
     "Bentinho conta sua história e a dúvida sobre a fidelidade de Capitu."),
    ("O Senhor dos Anéis", "livro", 1954, "Fantasia",
     "Um hobbit recebe a missão de destruir um anel que pode acabar com o mundo."),
    ("Cidade de Deus", "filme", 2002, "Drama",
     "A vida de jovens em uma comunidade do Rio de Janeiro entre as décadas de 60 e 80."),
]

app = create_app()

with app.app_context():
    for nome in GENEROS:
        if not Genre.query.filter_by(name=nome).first():
            db.session.add(Genre(name=nome))
    db.session.commit()

    for titulo, tipo, ano, genero, sinopse in OBRAS:
        if not Work.query.filter_by(title=titulo).first():
            g = Genre.query.filter_by(name=genero).first()
            db.session.add(Work(title=titulo, type=tipo, year=ano,
                                synopsis=sinopse, genre_id=g.id))
    db.session.commit()
    print("Gêneros e obras de exemplo criados!")