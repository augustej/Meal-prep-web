from flask import Blueprint, render_template, redirect

public_pages = Blueprint('public_pages', __name__)

@public_pages.route('/')
def home():
    return render_template('pages/public/index.html')

@public_pages.route('/recipes')
def recipes():
    return render_template('pages/public/recipes.html')

@public_pages.route('/search')
def search():
    return render_template('pages/public/search.html')