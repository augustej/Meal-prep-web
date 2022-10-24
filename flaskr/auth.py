from flask import render_template, Blueprint, request, flash, url_for, redirect
from .model import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_required, login_user, current_user, logout_user
from . import db
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text


auth = Blueprint('auth', __name__)

@auth.route('/login', methods=['POST', 'GET'])
def login():
    if request.method == 'GET':
        vartotojas = User.query.all()
        print(vartotojas, "VARTOTOJAS")
        return render_template('auth/login.html')
    else:
        typed_email = request.form.get('login-email')
        typed_pass = request.form.get('login-password')
        user = User.query.filter_by(email=typed_email).first()
        if user:
            if check_password_hash(user.password, typed_pass):
                login_user(user, remember=True)
                return redirect(url_for('public_pages.home'))
            else:
                flash('Neteisingas slaptažodis', category="error")
                return render_template('auth/login.html')
        else:
            flash('Nėra tokio vartotojo', category="error")
        return render_template('auth/login.html')

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('public_pages.home'))

@auth.route('/register', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form.get('signup-email')
        name = request.form.get('signup-name')
        password1 = request.form.get('signup-password1')
        password2 = request.form.get('signup-password2')
        user = User.query.filter_by(email=email).first()

        if user:          
            flash('El. pašto adresas užimtas.', category="Error")
        elif len(email) < 4:
            flash('El. pašto adresas negali būti trumpesnis nei 4 simboliai.', category="Error")
        elif len(name) < 2:
            flash('Vardas negali būti trumpesnis nei 2 simboliai.', category="Error")
        elif password1 != password2:
            flash('Slaptažodžiai nesutampa', category="Error")
        elif len(password1) < 7:
            flash('Slaptažodio ilgis turi būti bent 7 simboliai.', category="Error")
        else:
            flash('Registracija sėkminga', category="Success")
            new_user = User(email=email, name=name, password=generate_password_hash(password1))    
            db.session.add(new_user)
            db.session.commit()
            return redirect(url_for('auth.login'))
    

    return render_template('auth/signup.html')
