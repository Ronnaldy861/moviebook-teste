from app import create_app
from models import db, User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    email = "admin@moviebook.com"
    if User.query.filter_by(email=email).first():
        print("Admin já existe.")
    else:
        admin = User(
            name="Administrador",
            email=email,
            password_hash=generate_password_hash("admin123"),
            is_admin=True,
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin criado!")