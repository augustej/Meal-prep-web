from flask import Blueprint, Flask, render_template, redirect, request, url_for, jsonify, Response
from flask_login import current_user
from .model import User, Role, Product, Foodtype, productMeasurements, favoriteRecipes, Coursetype, recipeCoursetype, Measurement, recipeIngredients, productFoodtypes, Ingredient, Recipe, recipeTypes
import csv, math
from . import db
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, or_
from sqlalchemy.sql import text




public_pages = Blueprint('public_pages', __name__)

@public_pages.route('/')
def home():
    if current_user.is_authenticated:
        modified_name = name_modification_for_greeting(current_user.name)
        # initialDbLoad()
        return render_template('pages/private/personal_home.html', name=modified_name)
    else:
        return render_template('pages/public/index.html')

@public_pages.route('/search')
def search():
    return render_template('pages/public/search.html')

@public_pages.route('/single_recipe')
def render_single_recipe():
    IDofRecipe = request.args.get('recipeID')
    recipeToVisualize = Recipe.query.filter_by(id=IDofRecipe).first()
    adminUserId = User.query.filter_by(role_name = 'admin').first().id
    # protect recipes created by other users:
    if not (recipeToVisualize.user_id == current_user.id or recipeToVisualize.user_id == adminUserId):
        return redirect(url_for('private_pages.recipes'))

    fullPicturePath = recipeToVisualize.picture
    modifiedPicturePath=""
    if fullPicturePath:
        modifiedPicturePath = '..' + fullPicturePath.split("flaskr")[1]

    # calculate calories of a recipe
    ingredientItems = recipeToVisualize.recipeIngredients
    portionsOfRecipe =recipeToVisualize.portions
    kcalOfRecipe = 0
    for ingredient in ingredientItems:
        idofproduct = ingredient.product_id
        idofMeasurm = ingredient.measurement_id
        ingredientAmount = ingredient.amount
        kcalKoeficient = db.session.query(productMeasurements).filter_by(
            product_measurement_id=idofMeasurm, product_id=idofproduct).first(
            ).product_conversion_to_gram
        kcalOfIngredient = kcalKoeficient * ingredientAmount
        kcalOfRecipe += kcalOfIngredient
    kcalPerPortion = round(kcalOfRecipe/portionsOfRecipe)

    # modify recipe instructions to get each row
    sentenceList = []
    sentence = ""
    for letter in recipeToVisualize.instruction:
        if "\n" != letter :
            sentence += letter
        else:
            sentenceList.append(sentence)
            sentence = ""
    if sentence != "":
        sentenceList.append(sentence)
    subtitleList = []
    for ingredientItem in recipeToVisualize.recipeIngredients:
        subtitleItem = ingredientItem.subtitle
        if subtitleItem not in subtitleList:
            subtitleList.append(subtitleItem)
    
    # prepare ingredient measurement name dict
    measurmentDict = {}
    allMeasurements = Measurement.query.all()
    for item in allMeasurements:
        measurmentDict[item.id] = item.name

    #check if recipe is favorited
    ifFavorited=db.session.query(favoriteRecipes).filter_by(recipe_id=recipeToVisualize.id, user_id=current_user.id).first()
    if ifFavorited:
        favoriteValue=" favorited"
    else:
        favoriteValue=""

    return render_template('pages/public/singleRecipe.html', 
        favoriteValue=favoriteValue,
        recipe=recipeToVisualize, 
        subtitlelist=subtitleList, 
        picturepath=modifiedPicturePath, 
        sentencelist=sentenceList,
        calories=kcalPerPortion,
        measurmentDict=measurmentDict
        )

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

    admin_user = User.query.filter_by(email = 'ajanickaite@gmail.com').first()
    admin_role = Role(name='admin')
    chef_role = Role(name='chef')
    family_member_role=Role(name='family_member')
    db.session.add(admin_role)
    db.session.add(chef_role)
    db.session.add(family_member_role)
    admin_user.role_name = 'admin'
    db.session.commit()

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

    with open('/Users/auguste/Desktop/git/Meal-prep-web/flaskr/static/CourseType.csv') as coursetypefile:
        csv_course_reader = csv.reader(coursetypefile, delimiter=",")
        for row in csv_course_reader:
            new_course = Coursetype(name=row[0])
            db.session.add(new_course)
        db.session.commit()

    with open('/Users/auguste/Desktop/git/Meal-prep-web/flaskr/static/products.csv') as productfile:
        csv_reader = csv.reader(productfile, delimiter=",")
        i = 1
        for row in csv_reader:
            current_product_id = i
            new_product = Product(name=row[0], description=row[1], shoparea=row[2], kcal=row[6])
            # loading types table of a product
            new_product_array_of_types = row[3].split(";")
            all_types_possible = Foodtype.query.all()
            for single_type in all_types_possible:
                for product_type in new_product_array_of_types:
                    if (single_type.name == product_type):
                        insertStatment1 = productFoodtypes.insert().values(product_foodtype_id=single_type.id, product_id=current_product_id)
                        db.session.execute(insertStatment1)
                        db.session.commit()                        

            # loading measurents table of a product
            new_product_array_of_measurements = row[4].split(";")
            new_product_array_of_conversion_to_grams = row[5].split(";")
            all_measurements_possible = Measurement.query.all()
            for single_measurement in all_measurements_possible:
                for product_measurement in new_product_array_of_measurements:
                    if (single_measurement.name == product_measurement):
                        index = new_product_array_of_measurements.index(product_measurement)
                        conversionToGramValue = new_product_array_of_conversion_to_grams[index]
                        insertStatment2 = productMeasurements.insert().values(product_measurement_id=single_measurement.id, product_id=current_product_id, product_conversion_to_gram=conversionToGramValue)
                        db.session.execute(insertStatment2)
                        db.session.commit()
            db.session.add(new_product)
            i += 1 
        db.session.commit()


@public_pages.route('/various-recipes', methods=['GET'])
def variousRecipes():
    if request.method == 'GET':
        adminUserId = User.query.filter_by(role_name = 'admin').first().id
        variousRecipesAmount = Recipe.query.filter_by(user_id=adminUserId).count()
        pageNumber = request.args.get('page')
        pageSize = 10
        if not pageNumber:
            variousRecipesList = Recipe.query.filter_by(user_id=adminUserId).limit(pageSize).all()
        else:
            pageNumber = int(pageNumber)
            variousRecipesList = Recipe.query.filter_by(user_id=adminUserId).offset((pageNumber-1) * pageSize).limit(pageSize).all()

        myFavoriteRecipesPictDict = createPictDictWithModifiedPaths(variousRecipesList)

        if variousRecipesAmount > pageSize:
            numberOfPages = math.ceil(variousRecipesAmount/pageSize)
        else:
            numberOfPages = 1

    return render_template('pages/public/variousrecipes.html', 
    myRecipes=variousRecipesList, 
    myRecipesPictDict=myFavoriteRecipesPictDict, numberOfPages=numberOfPages)

def createPictDictWithModifiedPaths(recipeList):
    myRecipesPictDict ={}
    for singlerecipe in recipeList:
        fullPicturePath = singlerecipe.picture
        if fullPicturePath:
            modifiedPicturePath =  '..' + fullPicturePath.split("flaskr")[1]
        else:
            modifiedPicturePath=''
        myRecipesPictDict[singlerecipe.id]=modifiedPicturePath
    return myRecipesPictDict

@public_pages.route('/recipe-search', methods=['GET'])
def searchRecipe():
    if request.method == 'GET':
        # problem with lithuanian letters on sql query. this escapes finding only lower or upper letters
        recipeLower = request.args.get('input').lower()
        recipeUpper = request.args.get('input').upper()

        admin_ID = User.query.filter_by(role_name = 'admin').first().id
        allowedID = [current_user.id, admin_ID]

        listOfRecipesStartingWith = Recipe.query.filter(or_(Recipe.name.ilike(f"%{recipeLower}%"), Recipe.name.ilike(f"%{recipeUpper}%")), Recipe.user_id.in_(allowedID) ).all()
        recipesList = []
        for recipeItem in listOfRecipesStartingWith:
            recipeDict = {}
            recipeDict['recipeName'] = recipeItem.name
            recipeDict['recipeId'] = recipeItem.id

            fullPicturePath = recipeItem.picture
            if fullPicturePath:
                modifiedPicturePath =  '..' + fullPicturePath.split("flaskr")[1]
            else:
                modifiedPicturePath=''

            recipeDict['recipePath'] = modifiedPicturePath

            recipesList.append(recipeDict)
        response = recipesList
            
    return response