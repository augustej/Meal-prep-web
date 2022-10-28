// Creating navigation burger
function mobileNavTransformation() {
    var mobileNavItems = document.querySelectorAll('.web-mob, .mobile, .nav-ul');

    mobileNavItems.forEach( function (item) {
        if (item.classList.contains('responsive')) {
            item.classList.remove('responsive');

        } else {
            item.classList.add('responsive');
        }
    })
}

// Importing current date into HTML
var dateElementInHtml = document.querySelector('#date');
var date = new Date();
var year = date.getFullYear();
dateElementInHtml.textContent = year;

// Listening for fileInputs in all document, to style "Choose file" button
var fileInputs = document.querySelectorAll(".input")
fileInputs.forEach(input =>{
    input.addEventListener('change', e =>{
        let fileAdded = e.target
        let fileAddedID = fileAdded.id
        let buttonClicked = e.target.closest('label')
        let buttonClickedID=buttonClicked.id
        onFileAddShowName(buttonClickedID, fileAddedID)
    })
})
//style changes of "choose file" button
function onFileAddShowName(buttonClickedID, fileAddedID){
    let buttonClicked = document.getElementById(buttonClickedID)
    let fileInput = document.getElementById(fileAddedID);   
    let filename = fileInput.files[0].name;
    let p = document.createElement('p')
    p.setAttribute('class','addedFilename')
    p.appendChild(document.createTextNode(filename))
    if (buttonClicked.nextElementSibling){
        //delete sibliing
        let element =buttonClicked.nextElementSibling
        buttonClicked.parentNode.removeChild(element)
    }
    buttonClicked.parentNode.appendChild(p)
}

// ADD RECIPE FUNCTIONS____________________________________________________________

//add-recipe modal functionality
var modal = document.querySelector("#recipe-creation-div");
var addRecipeBtn = document.querySelector("#add-recipe-button");
var closeAddRecipeBtn = document.querySelector("#close-add-recipe");
addRecipeBtn.onclick = function() {
    modal.style.display = "block";
  }
closeAddRecipeBtn.onclick = function() {
    modal.style.display = "none";
  }
window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
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

    // select element from list, saving it's value inside input and hiding list suggestions
    if (e.target.closest('ul') == productSearchParentUlItem){
        inputAreaProductSearch.value = e.target.innerText
        productSearchParentUlItem.innerHTML = ""
        unLockNextInputFields("True")
    }
    // displaying proper measurement units list (dropdown) for picked product
    if (e.target == inputAreaProductMeasurement){
        productMeasurmentParentUlItem.innerHTML = ""
        if (!inputAreaProductMeasurement.hasAttribute('readonly')){
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
    // adding ingredient to Ingredients table and showing it on the screen
    if (e.target == addIngredientButton){
        createIngredientDictItem()
        addIngredientToTable(ingredientDict).then((data)=> {
            currentIngredientsId = data.ingredientId
             creatingDomForConfirmedIngredients(currentIngredientsId)
        })
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
})


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
    var li = document.createElement('li');
    li.appendChild(document.createTextNode(item))
    li.setAttribute("class", className)
    parentElement.appendChild(li)
}

// once product is choosen, further input fields are unlocked
function unLockNextInputFields(boolStatment) {
    if (boolStatment == "True"){
        if (inputAreaProductAmount.hasAttribute('readonly')){
            inputAreaProductAmount.removeAttribute('readonly')
            inputAreaProductMeasurement.removeAttribute('readonly')
        }
    }
    else{
        if (!inputAreaProductAmount.hasAttribute('readonly')){
            inputAreaProductAmount.setAttribute('readonly', 'True')
            inputAreaProductMeasurement.setAttribute('readonly', 'True')
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
    ingredientDict = {"name":productName, "amount": productAmount, "measurement":productMeasurement}
    return ingredientDict
}

// adding ingredients to Ingredients table, returns Ingredients table id
async function addIngredientToTable(ingredientDict
){
    const response = await fetch(
        '/ingredient-add-to-recipe', 
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
              },
            body: JSON.stringify(ingredientDict)
        }
    );
    return response.json();
}


// creating DOM items for a confirmed Ingredient
async function creatingDomForConfirmedIngredients(currentIngredientsId){
    let confirmedIngredientsParentUlItem = document.querySelector(".confirmed-ingredients-ul")
    let firstpElement = document.createElement('p');
    firstpElement.appendChild(document.createTextNode(inputAreaProductSearch.value))
    let secondpElement = document.createElement('p');
    secondpElement.appendChild(document.createTextNode(inputAreaProductAmount.value + ' ' + inputAreaProductMeasurement.value))
    let liElement = document.createElement('li');
    let thirdElement = document.createElement('button');
    thirdElement.appendChild(document.createTextNode('X'))
    thirdElement.setAttribute('class', 'deleteIngredientBtn')
    thirdElement.setAttribute('id', `deleteIngredientBtn${currentIngredientsId}`)
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

// delete Ingredient from table
function deleteIngredient(IngredientsID){
    fetch(
        '/delete-ingredient?ingredientid=' + IngredientsID,
        {
            method: 'GET',
        }
    )
    return
}

// END OF ADD RECIPE FUNCTIONS____________________________________________________________

