var searchedRecipesParentUL = document.querySelector('.searched-recipes-ul')
var searchInputField = document.querySelector('#search-input')


searchInputField.addEventListener('input', e=>{
    // check if there are already recipes displayed and make it empty
    searchedRecipesParentUL.innerHTML = ""
    let buttonForMoreItems = searchedRecipesParentUL.nextElementSibling
    if (buttonForMoreItems){
        buttonForMoreItems.parentElement.removeChild(buttonForMoreItems)        
    }
    var inputValue = searchInputField.value

    if (inputValue.length > 0){
       
        sessionStorage.setItem("queryNumber", 1);
            filterQueryToDb(inputValue, 1, 'search').then(data =>{
            createRecipesRepresentation(data, 'search')
        })
    }
    else {searchedRecipesParentUL.innerHTML = ""}
    
})

document.addEventListener('click', e=>{
        let nextRecipeBtn = document.querySelector(".next-recipe-btn")
        if (e.target==nextRecipeBtn){
            var inputValue = searchInputField.value
            let queryNumber =  parseInt(sessionStorage.getItem("queryNumber"));
            let modifiedQueryNumber = queryNumber + 1
            sessionStorage.setItem("queryNumber", modifiedQueryNumber)
            console.log(modifiedQueryNumber, "modifiedQueryNumber")
            filterQueryToDb(inputValue, modifiedQueryNumber, 'search').then(data =>{
                createRecipesRepresentation(data, 'search')
            })
        }
    })

async function filterQueryToDb(name, queryNumber, referrer){
    let url = '/recipe-search?input=' + name

    const response = await fetch(
        url + '&querynumber=' + queryNumber,
    {    
        method: 'GET',
    }
    );
    return response.json();
}

async function createRecipesRepresentation(data, origin){
    let ulParentContainer = searchedRecipesParentUL.parentNode
    // next-recipe Btn = ulSibling
    let ulSibling = searchedRecipesParentUL.nextElementSibling
    if (ulSibling){
        ulParentContainer.removeChild(ulSibling)
    }
    searchedRecipesParentUL.innerHTML = ""
    data.forEach(recipeItem =>{

        let a = document.createElement('a')
        a.setAttribute('class', 'recipe-card-cube')
        a.setAttribute('href', `/single_recipe?recipeID=${recipeItem.id}`)
        let h3 = document.createElement('h3')
        h3.appendChild(document.createTextNode(recipeItem.name))
        h3.setAttribute('class', `recipe-title recipe-id=${recipeItem.id} text-unimportant-title`)
        let img = document.createElement('img')
        img.setAttribute('src', recipeItem.picture)
        a.appendChild(h3)
        a.appendChild(img)
        searchedRecipesParentUL.appendChild(a)
        // if infromation from backend suggests that all recipes have been shown, restart items display from the start
        if (recipeItem.listlength == 0 ){
            sessionStorage.setItem("queryNumber", 1);
        }
    })
    // create "NEXT" button, only if more than 5 elements exist (bug on small screen, but otherwise - recipe repeat on page)
    if (data.length > 4){
        let nextRecipeBtn = document.createElement('button')
        nextRecipeBtn.appendChild(document.createTextNode('>>'))
        nextRecipeBtn.setAttribute('class', 'button next-recipe-btn')
        nextRecipeBtn.setAttribute('type', 'button')
        nextRecipeBtn.setAttribute('name', `${origin}`)
        ulParentContainer.appendChild(nextRecipeBtn)
    }
    
}