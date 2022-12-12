# Meal-prep-web

Meal-prep-web helps to plan your meals for the whole week.

## Functions:
1. Create/modify/delete your own recipes.
2. Add recipes to favorites (your own or admin's).
3. Create meal plan for the week (fiilters available).
5. See calories of each day.
6. Create smart groceries list.
7. Search among recipes.
8. Invite others as viewers. Invited user can only check products on groceries list.
9. If you wish to test this application, you can use tester account: testas@gmail.com || testas123

## How to run the page on your local machine
1. Download files.
2. Create .env file inside Meal-prep-web folder. 
3. Inside .env declare variables:
a) SECRET_KEY = " {your-key-here} "
b) MAIL_SERVER="smtp.gmail.com"
c) MAIL_PORT = 465
d) MAIL_USE_SSL = True
e) MAIL_USERNAME = "{websites-gmail-account}@gmail.com"
f) MAIL_PASSWORD = " {password-generated} " - read below
g) ADMIN_EMAIL = " {admin-email-here} "
4. In terminal run python3 main.py. Once page loads, register first user with admin email.

#### How to create gmail app password
1. Create 2 step verification on your gmail account.
2. Go to your Google Account and Select Security.
3. Under "Signing in to Google," select App Passwords.
4. At the bottom, choose Select app and choose the app you using and then Select device and choose the device you’re using and then Generate. (I picked Mail as app and Other as device (typed in Web app - {app name}).
5. This is the password you need for the app.

