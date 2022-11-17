# from symbol import import_as_name
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from sqlalchemy import inspect, create_engine
from flask_mail import Mail

db = SQLAlchemy()
DATABASE_NAME = "database.db"
UPLOAD_FOLDER = '/Users/auguste/Desktop/git/Meal-prep-web/flaskr/static/uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}
mail = Mail()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'Su>{PeRSECRETmYWeb?site180some'
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DATABASE_NAME}'
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    # app.config['EMAIL_PORT'] = 7777
    app.config['MAIL_SERVER']='smtp.gmail.com'
    app.config['MAIL_PORT'] = 465
    app.config['MAIL_USE_SSL'] = True
    app.config['MAIL_USERNAME'] = 'savaites.meniu.planas@gmail.com'
    app.config['MAIL_PASSWORD'] = 'mcwdzlttcfluwusm'
    mail.init_app(app)
    
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

