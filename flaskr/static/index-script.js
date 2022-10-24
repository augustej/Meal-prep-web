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

})

addRecipeArea.addEventListener("click", e => {
    console.log(e.target)
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
        inputAreaProductMeasurement.value = e.target.innerText
        productMeasurmentParentUlItem.innerHTML = ""
    }
    enableORdisableIngredientSubmitButton()
    // adding ingredient to Ingredients table
    if (e.target == addIngredientButton){
        createIngredientDictItem()
    }
    
})


// product search for recipe, to add ingredients
async function checkForProductInDb(
    productSearchString
){
    console.log(productSearchString, "funkcijoj")
    const response = await fetch(
        '/search_product_by_name?product-search-input=' + productSearchString, 
        {
            method: 'GET',
        }
    );
    console.log("FUNKCIJOJE")
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
    addIngredientToTable(ingredientDict)
}

// adding ingredients to Ingredients table
async function addIngredientToTable(ingredientDict
){
    console.log(ingredientDict, 'funkcijoj')
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
    console.log(response.body)
    return response.json();
}