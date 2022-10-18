from flask import Blueprint, render_template

private_pages = Blueprint('private_pages', __name__)

@private_pages.route('/profile')
def profile():
    return render_template('/pages/private/profile.html')

@private_pages.route('/calendar')
def calendar():
    return render_template('/pages/private/calendar.html')

@private_pages.route('/groc_list')
def groclist():
    return render_template('/pages/private/groc_list.html')