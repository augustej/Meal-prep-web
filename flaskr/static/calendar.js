

document.addEventListener('click', e =>{
    coursetypeBtnList = document.querySelector(".courstype-btn-list").children
    nextRecipeBtn = document.querySelector(".next-recipe-btn")
    for (let item of coursetypeBtnList) {
        if (e.target == item) {
            coursetypeName = item.getAttribute('name')
            sessionStorage.setItem("queryNumber", 1);
            queryCoursetypeRecipes(coursetypeName, 1).then(data =>{
                createRecipesRepresentation(data)
                })
        }
    }
    if (e.target == nextRecipeBtn){
        let queryNumber =  parseInt(sessionStorage.getItem("queryNumber"));
        let modifiedQueryNumber = queryNumber + 1
        sessionStorage.setItem("queryNumber", modifiedQueryNumber)
        queryCoursetypeRecipes(coursetypeName, modifiedQueryNumber).then(data =>{
            createRecipesRepresentation(data)
            })
    }
})

async function queryCoursetypeRecipes(coursetypeName, queryNumber){
    const response = await fetch(
        '/coursetype-filter?coursetype=' + coursetypeName + 
        '&querynumber=' + queryNumber,
    {    
        method: 'GET',
    }
    );
    return response.json();

}

async function createRecipesRepresentation(data){
    let recipesRepresentationUl = document.querySelector('.recipes-representation-bar')
    let ulParentContainer = recipesRepresentationUl.parentNode
    let ulSibling = recipesRepresentationUl.nextElementSibling
    if (ulSibling){
        ulParentContainer.removeChild(ulSibling)
    }
    recipesRepresentationUl.innerHTML = ""
    data.forEach(recipeItem =>{
        let li = document.createElement('li')
        let p = document.createElement('p')
        li.setAttribute('class', 'mini-recipe-card')
        p.appendChild(document.createTextNode(recipeItem.name))
        p.setAttribute('class', `recipe-title recipe-id=${recipeItem.id} simple-text-small`)
        let img = document.createElement('img')
        img.setAttribute('src', recipeItem.picture)
        li.appendChild(p)
        li.appendChild(img)
        recipesRepresentationUl.appendChild(li)
        // restart items display from the start
        if (recipeItem.listlength == 0 ){
            sessionStorage.setItem("queryNumber", 1);
        }
    })
    // create "NEXT" button, only if more than 5 elements exist (bug on small screen, but otherwise - recipe repeat on page)
    if (data.length > 4){
        let nextRecipeBtn = document.createElement('button')
        nextRecipeBtn.appendChild(document.createTextNode('KITAS'))
        nextRecipeBtn.setAttribute('class', 'button next-recipe-btn')
        nextRecipeBtn.setAttribute('type', 'button')
        ulParentContainer.appendChild(nextRecipeBtn)
    }
    
}
