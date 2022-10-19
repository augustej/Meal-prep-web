# from symbol import import_as_name
from flask import Flask, render_template

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'Su>{PeRSECRETmYWeb?site180some'

    from .public_pages import public_pages
    from .private_pages import private_pages
    from .auth import auth

    app.register_blueprint(public_pages, url_prefix ='/')
    app.register_blueprint(private_pages, url_prefix = '/')
    app.register_blueprint(auth, url_prefix = '/')

    return app

