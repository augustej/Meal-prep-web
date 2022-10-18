from flask import render_template, Blueprint, request

auth = Blueprint('auth', __name__)

@auth.route('/login', methods=['POST', 'GET'])
def login():
    if request.method == 'GET':
        return render_template('auth/login.html')
    else:
        typed_email = request.form.get('login-email')
        typed_pass = request.form.get('login-password')
        print(typed_email, typed_pass)
        return render_template('auth/login.html')



@auth.route('/sign_up')
def signup():
    return render_template('auth/signup.html')
