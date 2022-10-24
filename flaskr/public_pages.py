from flask import Blueprint, render_template, redirect, request, url_for, jsonify, Response
from flask_login import current_user
from .model import User, Product, Foodtype, productMeasurements, Measurement, productFoodtypes, Ingredient, Recipe
import csv
from . import db
from flask_sqlalchemy import SQLAlchemy

public_pages = Blueprint('public_pages', __name__)

@public_pages.route('/')
def home():
    if current_user.is_authenticated:
        modified_name = name_modification_for_greeting(current_user.name)
        # initialDbLoad()
        return render_template('pages/private/personal_home.html', name=modified_name)
    else:
        return render_template('pages/public/index.html')

@public_pages.route('/recipes', methods=['GET', 'POST'])
def recipes():
    return render_template('pages/public/recipes.html')

@public_pages.route('/search_product_by_name')
def product_search_on_type():
    if request.method == 'GET':
        typped_in_product_name = request.args.get('product-search-input')
        products = Product.query.filter(Product.name.startswith(typped_in_product_name)).all()
        # data modification, because sqlalchemy response can't be jsonified
        products_list = []
        for item in products:
            # for each product, find valid measurments from productMeasurments table
            tableLinesWithMeasurmentsOfCurrentProduct = db.session.query(productMeasurements).filter(productMeasurements.c.product_id == item.id).all()
            measurement_name_list = []
            for tableLine in tableLinesWithMeasurmentsOfCurrentProduct:
                measurement_item = Measurement.query.filter_by(id=tableLine.product_measurement_id).first().name
                measurement_name_list.append(measurement_item)
            new_product = {"name":item.name, "measurement": measurement_name_list}
            products_list.append(new_product)
    return products_list

@public_pages.route('/ingredient-add-to-recipe', methods=['GET', 'POST'])
def add_ingredient():
    if request.method == "POST":
        data = request.get_json()
        recipeToAddIngredientTo = Recipe.query.filter_by(name="inprogress").first()
        if recipeToAddIngredientTo == None:
            recipeToAddIngredientTo = Recipe(name="inprogress")
            db.session.add(recipeToAddIngredientTo)
            db.session.commit()
        product_id = Product.query.filter_by(name=data['name']).first().id
        measurement_id = Measurement.query.filter_by(name=data['measurement']).first().id
        recipe_id = recipeToAddIngredientTo.id
        new_ingredient = Ingredient(name = data['name'], amount=data['amount'], measurement_id=measurement_id, product_id=product_id, recipe_id=recipe_id)
        db.session.add(new_ingredient)
        db.session.commit()
        answer= {"name": "true"}
    else: 
        answer= {"name": "else"}
    return answer
        

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

def initialDbLoad():
    with open('/Users/auguste/Desktop/git/Meal-prep-web/flaskr/static/type.csv') as typefile:
        csv_type_reader = csv.reader(typefile, delimiter=",")
        for row in csv_type_reader:
            new_type = Foodtype(name=row[0])
            db.session.add(new_type)
        db.session.commit()

    with open('/Users/auguste/Desktop/git/Meal-prep-web/flaskr/static/Measurement.csv') as measurementfile:
        csv_measur_reader = csv.reader(measurementfile, delimiter=",")
        for row in csv_measur_reader:
            new_measurement = Measurement(name=row[0])
            db.session.add(new_measurement)
        db.session.commit()

    with open('/Users/auguste/Desktop/git/Meal-prep-web/flaskr/static/products.csv') as productfile:
        csv_reader = csv.reader(productfile, delimiter=",")
        i = 1
        for row in csv_reader:
            current_product_id = i
            new_product = Product(name=row[0], description=row[1], shoparea=row[2])
            # loading types table of a product
            new_product_array_of_types = row[3].split(";")
            all_types_possible = Foodtype.query.all()
            for single_type in all_types_possible:
                for product_type in new_product_array_of_types:
                    if (single_type.name == product_type):
                        print(single_type.id, "single_type.id")
                        print(single_type.name, "single_type.name")
                        insertStatment1 = productFoodtypes.insert().values(product_foodtype_id=single_type.id, product_id=current_product_id)
                        db.session.execute(insertStatment1)
                        db.session.commit()                        

            # loading measurents table of a product
            new_product_array_of_measurements = row[4].split(";")
            all_measurements_possible = Measurement.query.all()
            for single_measurement in all_measurements_possible:
                for product_measurement in new_product_array_of_measurements:
                    if (single_measurement.name == product_measurement):
                        insertStatment2 = productMeasurements.insert().values(product_measurement_id=single_measurement.id, product_id=current_product_id)
                        db.session.execute(insertStatment2)
                        db.session.commit()
            db.session.add(new_product)
            i += 1 
        db.session.commit()
