from flask import Blueprint, Flask, render_template, redirect, request, url_for, jsonify, Response
from flask_login import current_user
from . import UPLOAD_FOLDER, db, ALLOWED_EXTENSIONS
import os
from werkzeug.utils import secure_filename
from .model import User, Product, Foodtype, productMeasurements, Measurement, recipeIngredients, productFoodtypes, Ingredient, Recipe, recipeTypes


private_pages = Blueprint('private_pages', __name__)

@private_pages.route('/profile')
def profile():
    return render_template('/pages/private/profile.html')

@private_pages.route('/add_recipe')
def addRecipe():
    return render_template('/pages/private/add_recipe.html')

@private_pages.route('/calendar')
def calendar():
    return render_template('/pages/private/calendar.html')

@private_pages.route('/groc_list')
def groclist():
    return render_template('/pages/private/groc_list.html')


@private_pages.route('/search_product_by_name')
def product_search_on_type():
    if request.method == 'GET':
        typped_in_product_name = request.args.get('product-search-input')
        products = Product.query.filter(Product.name.startswith(typped_in_product_name)).all()
        # data modification, because sqlalchemy response can't be jsonified
        products_list = []
        for item in products:
            # for each product, find valid measurments 
            measurement_name_list = []
            measurement_objects_list = item.productMeasurements
            for measurObject in measurement_objects_list:
                measurement_name_list.append(measurObject.name)
            new_product = {"name":item.name, "measurement": measurement_name_list}
            products_list.append(new_product)
    return products_list

@private_pages.route('/ingredient-add-to-recipe', methods=['GET', 'POST'])
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
        answer= {}
        answer['ingredientId'] = new_ingredient.id
        print(answer, "ANSWER")
    else: 
        answer= {"name": "else"}
    return answer

@private_pages.route('/confirmed-recipe', methods=['POST'])
def add_recipe():
    name = request.form.get('new-recipe-title')
    instruction = request.form.get('recipe-preparation')
    user_id=current_user.id
    cookingtime = request.form.get('preparation-time')
    current_recipe = Recipe.query.filter_by(name="inprogress").first()

    # adding image
    if 'recipe-image' in request.files:
        file = request.files['recipe-image']
        if file.filename != '':
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filePath=os.path.join(UPLOAD_FOLDER, filename)
                file.save(filePath)
                current_recipe.picture = filePath    

    current_recipe.name = name
    current_recipe.instruction=instruction
    current_recipe.user_id = user_id
    current_recipe.cookingtime=cookingtime
    allProductsOfRecipe = Ingredient.query.filter_by(recipe_id=current_recipe.id).all()
    numberOfIngredients = len(allProductsOfRecipe)
    foodDict ={}
    for oneProductOfRecipe in allProductsOfRecipe:
        singleProductId = oneProductOfRecipe.product_id
        singleIngredientId=oneProductOfRecipe.id
        insertStatementIngredient =recipeIngredients.insert().values(ingredients_id=singleIngredientId, recipe_id=current_recipe.id)
        db.session.execute(insertStatementIngredient)
        db.session.commit()
    # for singleProductId in allProductIdOfRecipe:
        productObject = Product.query.filter_by(id=singleProductId).first()

         # check each ingredient to determine food type recipetypes
        foodtypeObjectList = productObject.productFoodtypes
        foodTypesList=[]
        for singleFoodTypeObject in foodtypeObjectList:
            if (singleFoodTypeObject.name == 'mėsa') or (singleFoodTypeObject.name == 'žuvis'):
                if not singleFoodTypeObject.id in foodTypesList:
                    foodTypesList.append(singleFoodTypeObject.id)
            elif singleFoodTypeObject.id in foodDict:
                foodDict[singleFoodTypeObject.id] += 1
            else:
                foodDict[singleFoodTypeObject.id] = 1
    for keys in foodDict:
        if foodDict[keys] == numberOfIngredients:
            foodTypesList.append(keys)

    for value in foodTypesList:
        insertStatement =recipeTypes.insert().values(recipe_foodtype_id=value, recipe_id=current_recipe.id)
        db.session.execute(insertStatement)
        db.session.commit()
    
    db.session.add(current_recipe)
    db.session.commit()
    return render_template('pages/public/recipes.html')


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS