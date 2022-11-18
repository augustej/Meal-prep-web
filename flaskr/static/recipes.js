// ADD RECIPE FUNCTIONS____________________________________________________________

//add-recipe modal functionality
var modal = document.querySelector("#recipe-creation-div");
var addRecipeBtn = document.querySelector("#add-recipe-button");
var closeAddRecipeBtn = document.querySelector("#close-add-recipe");
if (addRecipeBtn){
    addRecipeBtn.onclick = function() {
        modal.style.display = "block";
    }
}
if (closeAddRecipeBtn){
    closeAddRecipeBtn.onclick = function() {
        modal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == modal) {
        modal.style.display = "none";
        }
    }
}

//Event listeners for add-recipe functionality
var productSearchString = ""
var inputAreaProductSearch = document.querySelector('#product-search-input');
var inputAreaProductAmount = document.querySelector('#product-amount-input');
var inputAreaProductMeasurement = document.querySelector('#product-measurement-input')
var productMeasurmentParentUlItem = document.querySelector(".product-measurement")
var productSearchParentUlItem = document.querySelector('.product-search');
var addIngredientButton = document.querySelector("#add_ingredient_to_recipe")
var addIngredientSubtitleButton = document.querySelector("#add-ingredient-subtitle")
var confirmedIngredientsParentUlItem = document.querySelector(".confirmed-ingredients-ul")
var confirmRecipeBtn = document.querySelector(".confirm-recipe")
var mealCategoryParentUlItem = document.querySelector('.meal-category-ul')
var mealCategoryInput = document.querySelector("#meal-category-input")
var ingredientDictList = []
var addRecipeForm = document.querySelector("#add-recipe-form")
sessionStorage.setItem("indexOfIngredient", 0);

if (modal){
modal.addEventListener("input", e => {
    // searching for a product and modifying DOM to display that
    if (e.target == inputAreaProductSearch){
        productSearchString = e.target.value;
        if (productSearchString.length > 0) {
            currentProductData = checkForProductInDb(productSearchString)
            currentProductData.then((data)=> {
                productSearchParentUlItem.innerHTML = "";
                data.forEach(item =>{
                    createListItemInDom(item.name, productSearchParentUlItem, "product-search-li-item")
                    unLockNextInputFields("False")
                })
            })
        }
        else{
            productSearchParentUlItem.innerHTML = "";
            unLockNextInputFields("False")
        } 
    }
    // if form has all input, enable "submit" button
    enableORdisableIngredientSubmitButton()
})

modal.addEventListener("click", e => {
    var deleteIngredientButton = document.querySelectorAll(".deleteIngredientBtn")
    var deleteSubtitleBtn = document.querySelectorAll(".deleteSubtitleBtn")

    if (e.target == addIngredientSubtitleButton){
        let ingredientSubtitleDropdown = document.querySelector('.ingredient-subtitle-dropdown-area')
        if (ingredientSubtitleDropdown.style.display == "block"){
            displayIngredientSubtitle()
            ingredientSubtitleDropdown.style.display = "none"
        }
        else {
            ingredientSubtitleDropdown.style.display = "block"
        }
    }

    // select element from list, saving it's value inside input and hiding list suggestions
    if (e.target.closest('ul') == productSearchParentUlItem){
        inputAreaProductSearch.value = e.target.innerText
        productSearchParentUlItem.innerHTML = ""
        unLockNextInputFields("True")
    }
        // displaying proper measurement units list (dropdown) for picked product
    if (e.target == inputAreaProductMeasurement){
        productMeasurmentParentUlItem.innerHTML = ""
        if (!inputAreaProductAmount.hasAttribute('readonly')){
            currentProductData.then((data)=> {
                data.forEach(item =>{
                    let array = item.measurement
                    for (let element of array) {
                        createListItemInDom(element, productMeasurmentParentUlItem, "product-measurment-li-item")
                    }
                })
            })
        }
    }

    // if person clicks on measurment units dropdown item - display value
    if (e.target.closest('ul') == productMeasurmentParentUlItem){
        // extra condition to avoid productMeasurmentParentUlItem.innerHTML value getting used
        if (e.target !=productMeasurmentParentUlItem){
            inputAreaProductMeasurement.value = e.target.innerText
            productMeasurmentParentUlItem.innerHTML = ""
        } 
    }
    //if clicks somewhere else - hide measurment units dropdown
    else {
        productMeasurmentParentUlItem.innerHTML = ""
    }

    enableORdisableIngredientSubmitButton()
    // adding ingredient to ingredientDictList and showing it on the screen
    if (e.target == addIngredientButton){
        createIngredientDictItem()
        ingredientDictList.push(ingredientDict)
        indexOfDictItem = ingredientDict['index']
        creatingDomForConfirmedIngredients(indexOfDictItem)
    }

    // delete ingredient from Ingredients table and removing it from the screen
    if (deleteIngredientButton){
        deleteIngredientButton.forEach(item => {
            if (item == e.target){
                let itemID = item.id
                let prefixlength = 'deleteIngredientBtn'.length
                let ingredientsID = itemID.substring(prefixlength)
                item.parentElement.remove()                
                deleteIngredient(ingredientsID)
            }
        })
    }

    if (e.target == confirmRecipeBtn){
        analyseIngredientSubtitles()
        if (confirmRecipeBtn.getAttribute('name')){
            IdOfRecipe = confirmRecipeBtn.getAttribute('name').slice('recipeID='.length)
        } else{IdOfRecipe = 0}
        addIngredientToTable(ingredientDictList, IdOfRecipe).then((data) =>{
            addRecipeForm.submit()
        })
       
    }
    // delete subtitles
    if (deleteSubtitleBtn){
        deleteSubtitleBtn.forEach(suvtitleItem =>{
            if (e.target == suvtitleItem){
                suvtitleItem.parentElement.remove()
            }
        })
    }
})
}

// product search for recipe, to add ingredients
async function checkForProductInDb(
    productSearchString
){
    const response = await fetch(
        '/search_product_by_name?product-search-input=' + productSearchString, 
        {
            method: 'GET',
        }
    );
    return response.json();
}

// Creating items in DOM for dropdowns
function createListItemInDom (item, parentElement, className) {
    let li = document.createElement('li');
    li.appendChild(document.createTextNode(item))
    li.setAttribute("class", className)
    parentElement.appendChild(li)
}

// once product is choosen, further input fields are unlocked
function unLockNextInputFields(boolStatment) {
    if (boolStatment == "True"){
        if (inputAreaProductAmount.hasAttribute('readonly')){
            inputAreaProductAmount.removeAttribute('readonly')
            // inputAreaProductMeasurement.removeAttribute('readonly')
        }
    }
    else{
        if (!inputAreaProductAmount.hasAttribute('readonly')){
            inputAreaProductAmount.setAttribute('readonly', 'True')
            // inputAreaProductMeasurement.setAttribute('readonly', 'True')
        }    
    }
}

// ingredient submit button enable/disable function
function enableORdisableIngredientSubmitButton(){
    if (
        (inputAreaProductSearch.value.length > 0) && 
        (inputAreaProductAmount.value.length > 0) && 
        (inputAreaProductMeasurement.value.length > 0) ){

        if (productMeasurmentParentUlItem.innerHTML == productSearchParentUlItem.innerHTML){
            addIngredientButton.removeAttribute('disabled')
            return
        }
    }
    if (!addIngredientButton.hasAttribute('disabled')){
        addIngredientButton.setAttribute('disabled', 'True')
    }
}

// on ingredient submit button click, get ingredient related elements (name, amount, measurement)
function createIngredientDictItem (){
    productName = inputAreaProductSearch.value
    productAmount = inputAreaProductAmount.value
    productMeasurement = inputAreaProductMeasurement.value
    let data =  parseInt(sessionStorage.getItem("indexOfIngredient"));

    ingredientDict = {"name":productName, "amount": productAmount, "measurement":productMeasurement, "index":data}
    updatedIndex = data + 1
    sessionStorage.setItem("indexOfIngredient", updatedIndex);
    return ingredientDict
}


async function addIngredientToTable(ingredientDictList, idOfRecipe){
    let dictionaryToSend = {}
    dictionaryToSend[idOfRecipe] = ingredientDictList
    let response = await fetch(
        '/ingredient-add-to-recipe', 
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                },
            body: JSON.stringify(dictionaryToSend)
        }
    );
    return response
}

// creating DOM items for an Ingredient

function creatingDomForConfirmedIngredients(indexOfDictItem){
    let firstpElement = document.createElement('p');
    firstpElement.appendChild(document.createTextNode(inputAreaProductSearch.value))
    let secondpElement = document.createElement('p');
    secondpElement.appendChild(document.createTextNode(inputAreaProductAmount.value + ' ' + inputAreaProductMeasurement.value))
    let liElement = document.createElement('li');
    let thirdElement = document.createElement('button');
    thirdElement.appendChild(document.createTextNode('X'))
    thirdElement.setAttribute('class', 'deleteIngredientBtn')
    thirdElement.setAttribute('id', `deleteIngredientBtn${indexOfDictItem}`)
    thirdElement.setAttribute('type', 'button')
    liElement.appendChild(firstpElement)
    liElement.appendChild(secondpElement)
    liElement.appendChild(thirdElement)
    liElement.setAttribute('class', 'confirmed-ingredients-li')
    confirmedIngredientsParentUlItem.appendChild(liElement)
    inputAreaProductAmount.value = ""
    inputAreaProductSearch.value = ""
    inputAreaProductMeasurement.value = ""
    enableORdisableIngredientSubmitButton()
    unLockNextInputFields("False")
}

// delete Ingredient from ingredientDictList
function deleteIngredient(IngredientsID){
    for (dictItem of ingredientDictList){
        if (dictItem.index == IngredientsID){
            dictItemIndex = ingredientDictList.indexOf(dictItem)
            ingredientDictList.splice(dictItemIndex, 1)
        }
    }
}

function displayIngredientSubtitle(){
    let ingredientSubtitleInput = document.querySelector("#ingredient-subtitle-input")
    if (ingredientSubtitleInput.value.length > 0){       
        let li = document.createElement('li');
        let buttonElement = document.createElement('button');
        buttonElement.appendChild(document.createTextNode('X'))
        buttonElement.setAttribute('class', 'deleteSubtitleBtn')
        buttonElement.setAttribute('type', 'button')
        li.appendChild(document.createTextNode(ingredientSubtitleInput.value))
        li.appendChild(buttonElement)
        li.setAttribute("class", "ingredient-subtitle confirmed-ingredients-li")
        confirmedIngredientsParentUlItem.appendChild(li)
        ingredientSubtitleInput.value = ""
    }
}
 
function analyseIngredientSubtitles(){
    let confirmedIngredientsLiItems = document.querySelectorAll(".confirmed-ingredients-li")
    let subtitleText = ""
    ingredientSubtitleList = []
    let i = 0
    confirmedIngredientsLiItems.forEach(NodeItem => {
        if (NodeItem.classList.contains('ingredient-subtitle')){
                subtitleChild = NodeItem.innerText
                // cut inner text of button ("X")
                subtitleText = subtitleChild.substring(0, subtitleChild.length - 2)
            }
            else {
                ingredientDictList[i]['subtitle'] = subtitleText
                i += 1
            }
        })
    return ingredientDictList
 }

// END OF ADD RECIPE FUNCTIONS____________________________________________________________
