from flask import Blueprint, Flask, render_template, redirect, request, url_for, jsonify, Response
from flask_login import current_user
from . import UPLOAD_FOLDER, db, ALLOWED_EXTENSIONS, public_pages
import os, math
from werkzeug.utils import secure_filename
from .model import Coursetype, User, Product, Foodtype, favoriteRecipes, productMeasurements, Measurement, recipeIngredients, productFoodtypes, Ingredient,recipeCoursetype, Recipe, recipeTypes


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
        for ingredientItem in data:
            product_id = Product.query.filter_by(name=ingredientItem['name']).first().id
            measurement_id = Measurement.query.filter_by(name=ingredientItem['measurement']).first().id
            recipe_id = recipeToAddIngredientTo.id
            new_ingredient = Ingredient(name = ingredientItem['name'], subtitle =ingredientItem['subtitle'], amount=ingredientItem['amount'], measurement_id=measurement_id, product_id=product_id, recipe_id=recipe_id)
            db.session.add(new_ingredient)
            db.session.commit()
        answer= {}
        answer['ingredientId'] = new_ingredient.id
    else: 
        answer= {"name": "else"}
    return answer

@private_pages.route('/confirmed-recipe', methods=['POST'])
def add_recipe():
    name = request.form.get('new-recipe-title')
    instruction = request.form.get('recipe-preparation')
    user_id=current_user.id
    cookingtime = request.form.get('preparation-time')
    portions = request.form.get('portions')
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
    current_recipe.portions=portions

    allProductsOfRecipe = Ingredient.query.filter_by(recipe_id=current_recipe.id).all()
    numberOfIngredients = len(allProductsOfRecipe)
    foodDict ={}
    for oneProductOfRecipe in allProductsOfRecipe:
        singleProductId = oneProductOfRecipe.product_id
        singleIngredientId=oneProductOfRecipe.id
        insertStatementIngredient =recipeIngredients.insert().values(ingredients_id=singleIngredientId, recipe_id=current_recipe.id)
        db.session.execute(insertStatementIngredient)
        db.session.commit()
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
    
    recipesCourseTypeList = request.form.getlist('coursetype')
    for courseTypeItem in recipesCourseTypeList:
        current_CourseType = Coursetype.query.filter_by(name=courseTypeItem.strip()).first()
        CourseTypeID = current_CourseType.id
        insertStatement1 = recipeCoursetype.insert().values(recipe_id = current_recipe.id, coursetype_id=CourseTypeID)
        db.session.execute(insertStatement1)

    db.session.add(current_recipe)
    db.session.commit()
    return redirect(url_for('private_pages.recipes'))

@private_pages.route('/check_if_favorite', methods=['GET'])
def checkIfFavorite():
    if request.method == 'GET':
        recipeID = request.args.get('recipeID')
        addToFavorites = request.args.get('addToFavorites')

        if addToFavorites == "YES":
            statement = favoriteRecipes.insert().values(user_id = current_user.id, recipe_id=recipeID)
            db.session.execute(statement)
        else:
            db.session.query(favoriteRecipes).filter_by(user_id = current_user.id, recipe_id=recipeID).delete()
    db.session.commit()
    return addToFavorites


@private_pages.route('/recipes', methods=['GET', 'POST'])
def recipes():
    if request.method == 'GET':
        myRecipes = Recipe.query.filter_by(user_id=current_user.id).order_by(-Recipe.id).limit(5).all()
        admin_ID = User.query.filter_by(role_name = 'admin').first().id
        adminRecipes = Recipe.query.filter_by(user_id=admin_ID).order_by(-Recipe.id).limit(5).all()
        myfavoriteRecipesdata = db.session.query(favoriteRecipes).filter_by(user_id=current_user.id).all()
        myfavoriteRecipes = convertDbTableDataToQueryList(myfavoriteRecipesdata)

        # combining myrecipes and my favorite recipes into one list, to create one picture dictionary for template
        inMyRecipes = set(myRecipes)
        inMyFavorites = set(myfavoriteRecipes)
        inMyRecipesNotFavorites = inMyRecipes - inMyFavorites
        fullListofRecipesForPicturesDict = list(inMyRecipesNotFavorites) + myfavoriteRecipes
        myRecipesPictDict = createPictDictWithModifiedPaths(fullListofRecipesForPicturesDict)
        adminRecipesPictDict = createPictDictWithModifiedPaths(adminRecipes)
        
    return render_template('pages/private/recipes.html', adminRecipes=adminRecipes, myRecipes=myRecipes, myfavoriteRecipes=myfavoriteRecipes, 
        myRecipesPictDict=myRecipesPictDict, adminRecipesPictDict=adminRecipesPictDict)

@private_pages.route('/my-recipes', methods=['GET'])
def myRecipes():
    if request.method == 'GET':
        myRecipesAmount = Recipe.query.filter_by(user_id = current_user.id).count()
        pageNumber = request.args.get('page')
        pageSize = 10
        if not pageNumber:
            myRecipes = Recipe.query.filter_by(user_id = current_user.id).order_by(-Recipe.id).limit(pageSize).all()
        else:
            pageNumber = int(pageNumber)
            myRecipes = Recipe.query.filter_by(user_id = current_user.id).order_by(-Recipe.id).offset((pageNumber-1) * pageSize).limit(pageSize).all()

        myRecipesPictDict = createPictDictWithModifiedPaths(myRecipes)

        if myRecipesAmount > pageSize:
            numberOfPages = math.ceil(myRecipesAmount/pageSize)
        else:
            numberOfPages = 1

    return render_template('pages/private/myrecipes.html', 
    myRecipes=myRecipes, 
    myRecipesPictDict=myRecipesPictDict, numberOfPages=numberOfPages)


@private_pages.route('/my-favorites', methods=['GET'])
def myFavoriteRecipes():
    if request.method == 'GET':
        myFavoriteRecipesAmount = db.session.query(favoriteRecipes).filter_by(user_id=current_user.id).count()
        pageNumber = request.args.get('page')
        pageSize = 10
        if not pageNumber:
            myFavoriteRecipesData = db.session.query(favoriteRecipes).filter_by(user_id=current_user.id).limit(pageSize).all()
        else:
            pageNumber = int(pageNumber)
            myFavoriteRecipesData = db.session.query(favoriteRecipes).filter_by(user_id=current_user.id).offset((pageNumber-1) * pageSize).limit(pageSize).all()

        myFavoriteRecipes = convertDbTableDataToQueryList(myFavoriteRecipesData)
        myFavoriteRecipesPictDict = createPictDictWithModifiedPaths(myFavoriteRecipes)

        if myFavoriteRecipesAmount > pageSize:
            numberOfPages = math.ceil(myFavoriteRecipesAmount/pageSize)
        else:
            numberOfPages = 1

    return render_template('pages/private/myfavorites.html', 
    myRecipes=myFavoriteRecipes, 
    myRecipesPictDict=myFavoriteRecipesPictDict, numberOfPages=numberOfPages)



def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def convertDbTableDataToQueryList(myfavoriteRecipesdata):
    recipeIDList = []
    for recipeItem in  myfavoriteRecipesdata:
        recipeID = recipeItem.recipe_id
        recipeIDList.append(recipeID)
    myfavoriteRecipes = Recipe.query.filter(Recipe.id.in_(recipeIDList)).limit(5).all()
    return myfavoriteRecipes
        
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