from flask import Blueprint, Flask, session, render_template, redirect, request, url_for, jsonify, Response
from flask_login import current_user
from . import UPLOAD_FOLDER, db, ALLOWED_EXTENSIONS, public_pages
import os, math, json
from werkzeug.utils import secure_filename
from .model import Coursetype, User, Product, Calendars, Groceries, Foodtype, favoriteRecipes, productMeasurements, Measurement, recipeIngredients, productFoodtypes, Ingredient,recipeCoursetype, Recipe, recipeTypes

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
    
    myCalendars = Calendars.query.filter(Calendars.user_id==current_user.id, 
        Calendars.calendarName!='currentCalendar').all()

    return render_template('/pages/private/calendar.html', 
    CoursetypeNames=CoursetypeNames,
    foodtypeNames=foodtypeNames, myCalendars=myCalendars)

@private_pages.route('/groc_list')
def groclist():
    groceriesList = Groceries.query.filter_by(user_id=current_user.id).all()
    relatedProductsDict = {}
    if groceriesList:
        for productItem in groceriesList:
            productItemID = productItem.product_id
            productItemName = Product.query.filter_by(id=productItemID).first().name
            relatedProductsDict[productItem.id] = productItemName
    return render_template('/pages/private/groc_list.html', 
    relatedProductsDict=relatedProductsDict, groceriesList= groceriesList)

@private_pages.route('/groceries-check-update', methods=['POST'])
def updateCheckStatus():
    if request.method == 'POST':
        checkedItemsListData= request.get_json()
        checkedItemsList = json.loads(checkedItemsListData)
        for key in checkedItemsList:
            groceriesId= key
            groceriesToUpdate = Groceries.query.filter_by(id=groceriesId).first()
            if checkedItemsList[groceriesId] == 'checked':
                groceriesToUpdate.check_status = 1
            else:
                groceriesToUpdate.check_status = 0
            db.session.add(groceriesToUpdate)
        db.session.commit()
    return Response('', 200)

@private_pages.route('/confirm-recipes-for-shopping', methods=['POST'])
def createGroceriesList():
    if request.method == "POST":
        shop_weekday = request.form.get('shopping-weekday')
        final_weekday = request.form.get('final-weekday')
        currentCalendarData = Calendars.query.filter_by(calendarName='currentCalendar', user_id=current_user.id).first().calendarData
        currentCalendar = json.loads(currentCalendarData)
        indexOfShopWeekday = list(currentCalendar.keys()).index(shop_weekday)
        indexOfFinWeekday = list(currentCalendar.keys()).index(final_weekday)
        indexToItterate = indexOfShopWeekday
        weekdaysIncludedInShopping = []
        while not indexToItterate == indexOfFinWeekday:
            nameOfOneDay = list(currentCalendar)[indexToItterate]
            weekdaysIncludedInShopping.append(nameOfOneDay)
    
            if indexToItterate == 6:
                indexToItterate = 0
            else:
                indexToItterate += 1
        weekdaysIncludedInShopping.append(list(currentCalendar)[indexOfFinWeekday])

        weekdayDictLt = {
            "Monday":"Pirmadienis",
            "Tuesday":"Antradienis",
            "Wednesday":"Trečiadienis",
            "Thursday":"Ketvirtadienis",
            "Friday":"Penktadienis",
            "Saturday":"Šeštadienis",
            "Sunday":"Sekmadienis",
            }

    return render_template('/pages/private/groc_list.html', 
    weekdaysIncludedInShopping=weekdaysIncludedInShopping, currentCalendar=currentCalendar,weekdayDictLt=weekdayDictLt
    )

@private_pages.route('/final-groceries-list', methods=['POST','GET'])
def finalGroceriesList():
    if request.method == "POST":
        # clear groceries list
        if (request.form.get('delete-groceries-list')):
            Groceries.query.filter_by(user_id=current_user.id).delete()
            db.session.commit()
            return redirect(url_for('private_pages.groclist'))

        listOfSelectedRecipesID = request.form.getlist('recipe-checkbox')
        groceriesDict = {}
        for recipeID in listOfSelectedRecipesID:
            recipeToAnalyze = Recipe.query.filter_by(id=recipeID).first()
            chosenPortionsOfRecipe = int(request.form.get(f"recipe-portions{recipeID}"))
            defaultPortionsOfRecipe = recipeToAnalyze.portions            
            # turn ingredient measurment to grams
            ingredientItems = recipeToAnalyze.recipeIngredients
            for ingredient in ingredientItems:
                idofproduct = ingredient.product_id
                gramConversionKoeficient = db.session.query(productMeasurements).filter_by(
                    product_measurement_id=ingredient.measurement_id, product_id=idofproduct).first(
                    ).product_conversion_to_gram
                defaultAmountInGrams = gramConversionKoeficient * ingredient.amount
                # calculate amount based on portions needed
                amountInGrams = round(defaultAmountInGrams * chosenPortionsOfRecipe / defaultPortionsOfRecipe)
                if idofproduct in groceriesDict:
                    groceriesDict[idofproduct] += amountInGrams
                else:
                    groceriesDict[idofproduct] = amountInGrams

        # load to db
        for keys in groceriesDict:
            newGroceries = Groceries(user_id=current_user.id, product_id=keys, 
                product_amount_in_grams=groceriesDict[keys], check_status=0)
            db.session.add(newGroceries)
        db.session.commit()

        return redirect(url_for('private_pages.groclist'))


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

@private_pages.route('/create-ingredient-dictionary', methods=['GET'])
def createIngredientDict():
    if request.method == 'GET':
        recipeToModifyId = request.args.get('recipeID')
        recipeToModify = Recipe.query.filter_by(id=recipeToModifyId).first().recipeIngredients
        ingredientDictList = []
        i = 0
        for ingredientItem in recipeToModify:
            ingredientDict = {'name': ingredientItem.name, 'amount': ingredientItem.amount, 
                'measurement':  Measurement.query.filter_by(id = ingredientItem.measurement_id).first().name, 'index': i }
            ingredientDictList.append(ingredientDict)
            i += 1

    return ingredientDictList

@private_pages.route('/ingredient-add-to-recipe', methods=['GET', 'POST'])
def add_ingredient():
    if request.method == "POST":

        data = request.get_json()
        for keys in data:
            if userCanModify(Recipe, int(keys)) == True:
                idOfRecipeToModify = int(keys)
        recipeToAddIngredientTo = Recipe.query.filter_by(id=idOfRecipeToModify).first()

        if recipeToAddIngredientTo == None:
            recipeToAddIngredientTo = Recipe(name="inprogress")
            db.session.add(recipeToAddIngredientTo)
            db.session.commit()
        else:
            recipeToAddIngredientTo.name = "inprogress"
            Ingredient.query.filter_by(recipe_id=idOfRecipeToModify).delete()
            db.session.query(recipeIngredients).filter_by(recipe_id=idOfRecipeToModify).delete()
            db.session.commit()
        for ingredientItem in data[keys]:
            product_id = Product.query.filter_by(name=ingredientItem['name']).first().id
            measurement_id = Measurement.query.filter_by(name=ingredientItem['measurement']).first().id
            recipe_id = recipeToAddIngredientTo.id
            new_ingredient = Ingredient(name = ingredientItem['name'], subtitle =ingredientItem['subtitle'], amount=ingredientItem['amount'], measurement_id=measurement_id, product_id=product_id, recipe_id=recipe_id)
            db.session.add(new_ingredient)
            db.session.commit()
            
    return Response('', 200)

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

@private_pages.route('/check_if_favorite', methods=['POST'])
def checkIfFavorite():
    if request.method == 'POST':
        data = request.get_json()
        for keys in data:
            recipeID = keys
            action = data[keys]

        if action == "YES":
            statement = favoriteRecipes.insert().values(user_id = current_user.id, recipe_id=recipeID)
            db.session.execute(statement)
        else:
            db.session.query(favoriteRecipes).filter_by(user_id = current_user.id, recipe_id=recipeID).delete()
    db.session.commit()
    return Response('', 200)

@private_pages.route('/delete-recipe/<recipeID>', methods=['DELETE'])
def deleteRecipe(recipeID):
    if request.method == 'DELETE':
        if userCanModify(Recipe, recipeID) == True:
            Recipe.query.filter_by(id=recipeID).delete()
            db.session.commit()
    return Response('', 200)

@private_pages.route('/load-calendar-to-db', methods=['POST'])
def loadCalendarTodb():
    if request.method == "POST":
        data = request.get_json()
        currentCalendar = Calendars.query.filter_by(calendarName='currentCalendar', user_id=current_user.id).first()
        for keys in data:
            calendarName = keys
            calendarData = data[keys]
            if not currentCalendar or not calendarName == 'currentCalendar':
                newCalendar = Calendars(user_id=current_user.id, calendarData=calendarData, calendarName=calendarName)
                db.session.add(newCalendar)
            else:
                if userCanModify(Calendars, currentCalendar.id) == True:
                    currentCalendar.calendarData = calendarData
            db.session.commit()

    return Response('', 200)

@private_pages.route('/delete-calendar-from-db/<id>', methods=['DELETE'])
def deleteCalendarFromDb(id):
    if request.method == "DELETE":
        if userCanModify(Calendars, id) == True:
            calendarIDtoDelete = id
            Calendars.query.filter_by(id=calendarIDtoDelete).delete()
            db.session.commit()
    return Response('', 200)


@private_pages.route('/load-calendar-from-db', methods=['GET'])
def loadCalendarFromDb():
    if request.method == "GET":
        calendarIDtoLoad = request.args.get('calendarID')
        if userCanModify(Calendars, calendarIDtoLoad) == True:
            calendarToLoad = Calendars.query.filter_by(id=calendarIDtoLoad).first().calendarData
    return calendarToLoad

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convertDbTableDataToQueryList(dataRowWithRecipeID, limitValue, offsetValue):
    # ar veikia su <recipe list>?
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

def userCanModify(model, itemid):
    userId = model.query.filter_by(id=itemid).first().user_id
    if userId == current_user.id:
        return True
    else:
        return False

