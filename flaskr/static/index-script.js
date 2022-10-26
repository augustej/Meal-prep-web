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

// variables for add-recipe modal functionality
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

//Event listener for product search in add-recipe functionality
var addRecipeArea = document.querySelector('#recipe-creation-div')
var productSearchString = ""
var inputAreaProductSearch = document.querySelector('#product-search-input');
var inputAreaProductAmount = document.querySelector('#product-amount-input');
var inputAreaProductMeasurement = document.querySelector('#product-measurement-input')
var productMeasurmentParentUlItem = document.querySelector(".product-measurement")
var productSearchParentUlItem = document.querySelector('.product-search');
var addIngredientButton = document.querySelector("#add_ingredient_to_recipe")

addRecipeArea.addEventListener("input", e => {
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
    //add file style decoration
})

addRecipeArea.addEventListener("click", e => {
    console.log("CLICKED")
    console.log(e.target)
    var deleteIngredientButton = document.querySelectorAll(".deleteIngredientBtn")
    console.log(deleteIngredientButton)



    // select element from list, saving it's value inside input and hiding list suggestions
    if (e.target.closest('ul') == productSearchParentUlItem){
        inputAreaProductSearch.value = e.target.innerText
        productSearchParentUlItem.innerHTML = ""
        unLockNextInputFields("True")
    }
    // displaying proper measurement units for picked product
    if (e.target == inputAreaProductMeasurement){
        productMeasurmentParentUlItem.innerHTML = ""
        measurmentField = document.querySelector("#product-measurement-input")
        if (!measurmentField.hasAttribute('readonly')){
            currentProductData.then((data)=> {
                data.forEach(item =>{
                    array = item.measurement
                    for (element of array) {
                        createListItemInDom(element, productMeasurmentParentUlItem, "product-measurment-li-item")
                    }
                })
            })
        }
    }
    if (e.target.closest('ul') == productMeasurmentParentUlItem){
        if (e.target !=productMeasurmentParentUlItem){
            inputAreaProductMeasurement.value = e.target.innerText
            productMeasurmentParentUlItem.innerHTML = ""
        }   
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
    if (deleteIngredientButton){
        deleteIngredientButton.forEach(item => {
            if (item == e.target){
                let itemID = item.id
                let prefixlength = 'deleteIngredientBtn'.length
                let ingredientsID = itemID.substring(prefixlength)
                console.log(ingredientsID)
                // TODO CONTACT BACKEND to delete item from Ingredients, where id = ingredientsID
                // TODO delete item's parent node

            }
        })
    }
})

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

function createListItemInDom (item, parentElement, className) {
    var li = document.createElement('li');
    li.appendChild(document.createTextNode(item))
    li.setAttribute("class", className)
    parentElement.appendChild(li)
}

// once product is chosen, further input fields are unlocked
function unLockNextInputFields(boolStatment) {
    amountField = document.querySelector("#product-amount-input")
    measurmentField = document.querySelector("#product-measurement-input")
    if (boolStatment == "True"){
        if (amountField.hasAttribute('readonly')){
            amountField.removeAttribute('readonly')
            measurmentField.removeAttribute('readonly')
        }
    }
    else{
        if (!amountField.hasAttribute('readonly')){
            amountField.setAttribute('readonly', 'True')
            measurmentField.setAttribute('readonly', 'True')
        }    
    }
}

function enableORdisableIngredientSubmitButton(){
    button = document.querySelector('#add_ingredient_to_recipe')
    if (
        (inputAreaProductSearch.value.length > 0) && 
        (inputAreaProductAmount.value.length > 0) && 
        (inputAreaProductMeasurement.value.length > 0) ){

        if (productMeasurmentParentUlItem.innerHTML == productSearchParentUlItem.innerHTML){
            button.removeAttribute('disabled')
            return
        }
    }
    if (!button.hasAttribute('disabled')){
        button.setAttribute('disabled', 'True')
    }
}

// on button click, get ingredient related elements (name, amount, measurement)
function createIngredientDictItem (){
    productName = document.querySelector("#product-search-input").value
    productAmount = document.querySelector("#product-amount-input").value
    productMeasurement = document.querySelector("#product-measurement-input").value
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

async function creatingDomForConfirmedIngredients(currentIngredientsId){
    // creating DOM items for confirmed element
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