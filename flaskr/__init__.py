# from symbol import import_as_name
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from sqlalchemy import inspect, create_engine


db = SQLAlchemy()
DATABASE_NAME = "database.db"

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'Su>{PeRSECRETmYWeb?site180some'
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DATABASE_NAME}'
    db.init_app(app)

    from .public_pages import public_pages
    from .private_pages import private_pages
    from .auth import auth

    app.register_blueprint(public_pages, url_prefix ='/')
    app.register_blueprint(private_pages, url_prefix = '/')
    app.register_blueprint(auth, url_prefix = '/')

    from .model import User, Product

    with app.app_context():
        db.create_all()
        # db.drop_all()

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(id):
        return User.query.get(int(id))
        
    return app

