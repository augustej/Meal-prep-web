from flask import render_template, Blueprint, request, Response, flash, url_for, redirect
from .model import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_required, login_user, current_user, logout_user
from . import db, mail
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from flask_mail import Message
from datetime import datetime, timedelta
import os



auth = Blueprint('auth', __name__)

@auth.route('/login', methods=['POST', 'GET'])
def login():
    if request.method == 'GET':
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
                flash('Neteisingas slaptažodis', category="Error")
                return render_template('auth/login.html')
        else:
            flash('Nėra tokio vartotojo', category="Error")
        return render_template('auth/login.html')

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('public_pages.home'))

@auth.route('/register', methods=['GET', 'POST'])
def signup():
    if request.method == 'GET':
        chefID = request.args.get('user')
        # simple user access
        if not chefID:
            return render_template('auth/signup.html', role_name='chef')

        # if person is accessing via chef's link
        chef = User.query.filter_by(id=int(chefID)).first()
        if not chef:
            return Response("User to connect your account to was not found.", 404)
        token = request.args.get('token')
        if check_password_hash(token, (chef.email + chef.name)):
            return render_template('auth/signup.html', role_name='family_member', chef_id=int(chefID))
        else:
            return Response("Connection not allowed", 404)

    if request.method == 'POST':
        email = request.form.get('signup-email')
        name = request.form.get('signup-name')
        password1 = request.form.get('signup-password1')
        password2 = request.form.get('signup-password2')
        user = User.query.filter_by(email=email).first()
        role_name = request.form.get('role_name')
        chef_id= request.form.get('chef_id')
        if not chef_id:
            chef_id=0

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
            new_user = User(email=email, name=name, password=generate_password_hash(password1), 
            role_name=role_name, chef_id=chef_id)    
            db.session.add(new_user)
            db.session.commit()
            return redirect(url_for('auth.login'))
    
        return render_template('auth/signup.html', role_name=role_name, chef_id=chef_id)

@auth.route('/forgotten-pass', methods=['GET'])
def forgottenPass():
    if request.method == 'GET':

        return render_template('/auth/passreset.html')


@auth.route('/password-reset', methods=['POST', 'GET'])
def recoverPassword():
    if request.method == 'GET':
        hashedToken = request.args.get('token')
        userID = request.args.get('user')
        user = User.query.filter_by(id=userID).first()
        if user:
            if (check_password_hash(hashedToken, (user.email + user.tokenTime))):
                if (datetime.utcnow() < user.expTime): 
                    return render_template('/auth/newPass.html', user=user)
                else:
                    return Response("Password reset link has expired.", 404)
            else:
                return Response("Not allowed.", 404)
        return Response("User not found.", 404)


    if request.method == 'POST':
        email = request.form.get('reset-pass-email')
        user = User.query.filter_by(email=email).first()
        if user:
            time = datetime.utcnow()
            user.tokenTime = str(time)
            expTime = time + timedelta(minutes=30)
            user.expTime = expTime
            token = generate_password_hash(email + user.tokenTime)
            link = request.url + '?token=' + token + '&user=' + str(user.id)
            greeting = name_modification_for_greeting(user.name)
            msg = Message()
            msg.subject = "Savaitės meniu slaptažodžio atkūrimas"
            msg.recipients = [email]
            msg.sender = (os.getenv("MAIL_USERNAME"))
            msg.html = render_template('/auth/reset_email.html',
                                        greeting=greeting, link=link)
            mail.send(msg)
            db.session.add(user)
            db.session.commit()
            return redirect(url_for('public_pages.home'))
        else:
            return Response("user not found", 404)

@auth.route('/new-password', methods=['POST'])
def newPassword():
    if request.method == 'POST':
        password1 = request.form.get('new-password')
        password2 = request.form.get('new-password-confirm')
        userID = request.form.get('user')
        user = User.query.filter_by(id=userID).first()
        if password1 != password2:
            flash('Slaptažodžiai nesutampa', category="Error")
            return render_template('auth/newPass.html', user=user)

        elif len(password1) < 7:
            flash('Slaptažodio ilgis turi būti bent 7 simboliai.', category="Error")
            return render_template('auth/newPass.html', user=user)

        else:
            newpassword = generate_password_hash(request.form.get('new-password'))
            user.password = newpassword
            user.tokenTime = ""
            db.session.add(user)
            db.session.commit()
            return redirect(url_for('auth.login'))
    
    return render_template('auth/newPass.html', user=user)

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

@auth.route('/send-invitation-email', methods=['POST'])
def sendInvitation():
    if request.method == 'POST':
        familyMemberEmail = request.form.get('family-member-email')
        chefID = request.form.get('user') 
        chef = User.query.filter_by(id=chefID).first()
        token = generate_password_hash(chef.email + chef.name)
        link = request.url_root + 'register?user=' + str(chefID) + '&token=' + token
        msg = Message()
        msg.subject = "Pakvietimas prisijungti prie Savaitės Meniu"
        msg.recipients = [familyMemberEmail]
        msg.sender = (os.getenv("MAIL_USERNAME"))
        msg.html = render_template('/auth/invite_email.html', link=link, chef=chef)
        mail.send(msg)
    return redirect(url_for('private_pages.profile'))