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

@private_pages.route('/calendar')
def calendar():
    CoursetypeQuery = Coursetype.query.all()
    CoursetypeNames =[]
    for item in CoursetypeQuery:
        if not item.name == "Garnyras":
            if item.name == 'Pietūs/Vakarienė':
                coursetypeName = 'Pietūs'
                CoursetypeNames.append(coursetypeName)
                coursetypeName = 'Vakarienė'
                CoursetypeNames.append(coursetypeName)
            else:    
                coursetypeName = item.name
                CoursetypeNames.append(coursetypeName)

    foodtypeQuery = Foodtype.query.all()
    foodtypeNames = []
    for item in foodtypeQuery:
        foodtypeName = item.name
        foodtypeNames.append(foodtypeName)

    return render_template('/pages/private/calendar.html', 
    CoursetypeNames=CoursetypeNames,
    foodtypeNames=foodtypeNames)

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
        myfavoriteRecipes = convertDbTableDataToQueryList(myfavoriteRecipesdata, 5, 0)

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

        myFavoriteRecipes = convertDbTableDataToQueryList(myFavoriteRecipesData, pageSize, 0)
        myFavoriteRecipesPictDict = createPictDictWithModifiedPaths(myFavoriteRecipes)

        if myFavoriteRecipesAmount > pageSize:
            numberOfPages = math.ceil(myFavoriteRecipesAmount/pageSize)
        else:
            numberOfPages = 1

    return render_template('pages/private/myfavorites.html', 
    myRecipes=myFavoriteRecipes, 
    myRecipesPictDict=myFavoriteRecipesPictDict, numberOfPages=numberOfPages)

@private_pages.route('/coursetype-filter', methods=['GET'])
def coursetypeFilter():
    coursetypeBtnText = request.args.get('coursetype')
    if coursetypeBtnText == 'Pietūs' or coursetypeBtnText == 'Vakarienė':
        courstypeName = 'Pietūs/Vakarienė'
    else:
        courstypeName = request.args.get('coursetype')
    queryNumber = int(request.args.get('querynumber'))
    limitValue=5
    offsetValue = queryNumber -1
    currentCoursetype_id = Coursetype.query.filter_by(name=courstypeName).first().id
    filteredRecipeData = db.session.query(recipeCoursetype).filter_by(coursetype_id=currentCoursetype_id).all()
    recipeOfCoursetypeList = filteredRecipeDataConvertionToJsonList(filteredRecipeData, limitValue, offsetValue, queryNumber)

    return recipeOfCoursetypeList

@private_pages.route('/recipetype-filter', methods=['GET'])
def recipetypeFilter():
    recipetypeName = request.args.get('recipetype')
    queryNumber = int(request.args.get('querynumber'))
    limitValue=5
    offsetValue = queryNumber -1
    currentRecipetype_id = Foodtype.query.filter_by(name=recipetypeName).first().id
    filteredRecipeData = db.session.query(recipeTypes).filter_by(recipe_foodtype_id=currentRecipetype_id).all()
    print(filteredRecipeData, "filteredRecipeData")

    recipesOfRecipetypeList = filteredRecipeDataConvertionToJsonList(filteredRecipeData, limitValue, offsetValue, queryNumber)
    print(recipesOfRecipetypeList, "recipesOfRecipetypeList")
    return recipesOfRecipetypeList

@private_pages.route('/favorite-filter', methods=['GET'])
def favoriteFilter():
    queryNumber = int(request.args.get('querynumber'))
    limitValue=5
    offsetValue = queryNumber -1
    filteredRecipeData = db.session.query(favoriteRecipes).filter_by(user_id=current_user.id).all()
    favoriteRecipesList = filteredRecipeDataConvertionToJsonList(filteredRecipeData, limitValue, offsetValue, queryNumber)

    return favoriteRecipesList


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convertDbTableDataToQueryList(dataRowWithRecipeID, limitValue, offsetValue):
    recipeIDList = []
    for recipeItem in  dataRowWithRecipeID:
        recipeID = recipeItem.recipe_id
        recipeIDList.append(recipeID)
    # check if recipe is allowed for this user
    admin_ID = User.query.filter_by(role_name = 'admin').first().id
    allowedID = [current_user.id, admin_ID]
    RecipesList = Recipe.query.filter(Recipe.id.in_(recipeIDList), Recipe.user_id.in_(allowedID)).offset(offsetValue).limit(limitValue).all()
    return RecipesList
        
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

def filteredRecipeDataConvertionToJsonList(filteredRecipeData, limitValue, offsetValue, queryNumber):
    recipesList = convertDbTableDataToQueryList(filteredRecipeData, limitValue, offsetValue)
    # make sure not to run out of recipe items due to offset 
    amountOfRecipes = len(recipesList)
    if queryNumber > 1 and amountOfRecipes < 5:
        numberOfRecipesToAddFromStart = limitValue - amountOfRecipes
        additionalRecipesList = convertDbTableDataToQueryList(filteredRecipeData, numberOfRecipesToAddFromStart, 0)
        for RecipeItem in additionalRecipesList:
            recipesList.append(RecipeItem)

    jsonResponseRecipeList = []

    for RecipeItem in recipesList:
        fullPicturePath = RecipeItem.picture
        if fullPicturePath:
            modifiedPicturePath =  '..' + fullPicturePath.split("flaskr")[1]
        else:
            modifiedPicturePath=''

        recipeItemDict={}
        recipeItemDict['id'] = RecipeItem.id
        recipeItemDict['name'] = RecipeItem.name
        recipeItemDict['picture'] = modifiedPicturePath
        recipeItemDict['link'] = '/single_recipe?recipeID=' + str(RecipeItem.id)
        # extra info for JS to reset session.storage, if amountOfRecipes == 0:
        recipeItemDict['listlength'] = amountOfRecipes
        jsonResponseRecipeList.append(recipeItemDict)
    
    return jsonResponseRecipeList
