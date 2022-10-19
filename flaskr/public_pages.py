from flask import Blueprint, render_template, redirect
from flask_login import current_user
from .model import User

public_pages = Blueprint('public_pages', __name__)

@public_pages.route('/')
def home():
    if current_user.is_authenticated:
        name = current_user.name
        return render_template('pages/private/personal_home.html', name=name)
    else:
        return render_template('pages/public/index.html')

@public_pages.route('/recipes')
def recipes():
    return render_template('pages/public/recipes.html')

@public_pages.route('/search')
def search():
    return render_template('pages/public/search.html')