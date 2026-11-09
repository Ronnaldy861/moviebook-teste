import sys
from app import create_app
from models import db, User
from werkzeug.security import generate_password_hash

# uso: python create_user.py email senha [admin]
if len(sys.argv) < 3:
    print("Uso: python create_user.py email senha [admin]")
    sys.exit(1)

email = sys.argv[1].strip().lower()
password = sys.argv[2]
is_admin = len(sys.argv) > 3 and sys.argv[3] == "admin"

app = create_app()

with app.app_context():
    user = User.query.filter_by(email=email).first()
    if user:
        # se já existe, só redefine a senha
        user.password_hash = generate_password_hash(password)
        user.is_admin = is_admin or user.is_admin
        db.session.commit()
        print(f"Usuário {email} já existia: senha redefinida.")
    else:
        db.session.add(User(
            name=email.split("@")[0].capitalize(),
            email=email,
            password_hash=generate_password_hash(password),
            is_admin=is_admin,
        ))
        db.session.commit()
        print(f"Usuário {email} criado!")