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
var productSearchString = ""
var inputAreaProductSearch = document.querySelector('#product-search-input');
var parentUlItem = document.querySelector('.product-search');
console.log(inputAreaProductSearch)


inputAreaProductSearch.addEventListener( "input",  e => {
    productSearchString = e.target.value;
    if (productSearchString.length > 0) {
        checkForProductInDb(productSearchString).then((data)=> {
            parentUlItem.innerHTML = "";
            data.forEach(item =>{
                createListItemWithProductName(item.name)
            })
        })
    }
    else{
        parentUlItem.innerHTML = "";
    }  
})


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
    return response.json();
}

function createListItemWithProductName (item) {
    var li = document.createElement('li');
    li.appendChild(document.createTextNode(item))
    li.setAttribute("class", "product-search-li-item")
    parentUlItem.appendChild(li)
}

// select element from list, saving it's value inside input and hiding list suggestions
parentUlItem.addEventListener("click", e =>{
    console.log(e.target.innerText)
    console.log(inputAreaProductSearch)

    inputAreaProductSearch.value = e.target.innerText
    parentUlItem.innerHTML = ""
    // TODO ATRAKINTI KITUS DU INPUTO FIELDUS

})

// on button click, get ingredient related elements (name, amount, measurement)
function createIngredientDictItem (){
    productName = document.querySelector("#product-search-input").value
    productAmount = document.querySelector("#product-amount-input").value
    productMeasurement = document.querySelector("#product-measurement-input").value
    ingredientDict = {"name":productName, "amount": productAmount, "measurement":productMeasurement}
    addIngredientToTable(ingredientDict)
}

var addIngredientButton = document.querySelector("#add_ingredient_to_recipe")
addIngredientButton.addEventListener("click", createIngredientDictItem)
// console.log(ingredientDict)

// adding ingredients to buffer table = Ingredients
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