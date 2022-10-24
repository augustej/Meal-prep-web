from . import db 
from flask_login import UserMixin
from sqlalchemy.sql import func


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key = True)
    email = db.Column(db.String(100), unique=True)
    name = db.Column(db.String(100))
    password = db.Column(db.String(150))  
  

class Measurement(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(100))

class Foodtype(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(100))

productMeasurements = db.Table('productmeasurements',
    db.Column('product_measurement_id', db.Integer, db.ForeignKey('measurement.id'), primary_key=True),
    db.Column('product_id', db.Integer, db.ForeignKey('product.id'), primary_Key=True)
)

productFoodtypes = db.Table('productfoodtypes',
    db.Column('product_foodtype_id', db.Integer, db.ForeignKey('foodtype.id'), primary_key=True),
    db.Column('product_id', db.Integer, db.ForeignKey('product.id'), primary_Key=True)
)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(100))
    description = db.Column(db.String(10000))
    shoparea = db.Column(db.String(100))
    productFoodtypes = db.relationship('Foodtype', secondary=productFoodtypes, lazy=True)
    productMeasurements = db.relationship('Measurement', secondary=productMeasurements, lazy=True)

ingredients = db.Table('ingredients',
    db.Column('ingredients_id', db.Integer, db.ForeignKey('ingredient.id'), primary_key=True),
    db.Column('recipe_id', db.Integer, db.ForeignKey('recipe.id'), primary_key=True)
)

recipetypes = db.Table('recipetypes',
    db.Column('recipe_foodtype_id', db.Integer, db.ForeignKey('foodtype.id'), primary_key=True),
    db.Column('recipe_id', db.Integer, db.ForeignKey('recipe.id'), primary_key=True),
)

class Ingredient(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(100))
    amount = db.Column(db.Integer)
    measurement_id = db.Column(db.Integer, db.ForeignKey('measurement.id'))
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipe.id'))

class Recipe(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(100))
    ingredients = db.relationship('Ingredient', secondary=ingredients, lazy=True)
    instruction = db.Column(db.String(10000))
    # picture = db.image_attachment('RecipeImage')
    cookingtime = db.Column(db.Integer)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    description = db.Column(db.String(10000))
    recipetypes = db.relationship('Foodtype', secondary=recipetypes, lazy=True)

