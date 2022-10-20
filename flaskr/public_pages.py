from flask import Blueprint, render_template, redirect
from flask_login import current_user
from .model import User

public_pages = Blueprint('public_pages', __name__)

@public_pages.route('/')
def home():
    if current_user.is_authenticated:
        modified_name = name_modification_for_greeting(current_user.name)

        return render_template('pages/private/personal_home.html', name=modified_name)
    else:
        return render_template('pages/public/index.html')

@public_pages.route('/recipes')
def recipes():
    return render_template('pages/public/recipes.html')

@public_pages.route('/search')
def search():
    return render_template('pages/public/search.html')


def name_modification_for_greeting(name):
    last_two_letters = name[-2:]
    last_letter = name[-1:]
    if last_two_letters == 'as':
        modified_name = name[:-1] + 'i'
    elif last_two_letters == 'us':
        modified_name = name[:-2] + 'au'  
    elif last_two_letters == 'is':
        modified_name = name[:-1]
    elif last_letter == 'ė':
        modified_name = name[:-1] + 'e'
    else:
        modified_name = name
    return modified_name
