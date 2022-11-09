var  coursetypeBtnList = document.querySelector(".courstype-btn-list").children
var  recipetypeBtnList = document.querySelector(".recipetype-btn-list").children
var favoritesBtn = document.querySelector('.favorites-btn')
var previousdayBtn = document.querySelector('.previous-day-btn')
var nextdayBtn = document.querySelector('.next-day-btn')
var addItemToCalendarBtn = document.querySelectorAll('.add-item-to-calendar')
var recipesRepresentationUl = document.querySelector('.recipes-representation-bar')

document.addEventListener('click', e =>{
    let nextRecipeBtn = document.querySelector(".next-recipe-btn")
    // if add item to calendar button was clicked - select field to add to (add class .active-calendar-field)
    for (let item of addItemToCalendarBtn){
        if (e.target == item){
            let activeCalendarField = item.parentElement
            if (item.classList.contains('activated-add-button')){
                item.classList.remove('activated-add-button')
                activeCalendarField.classList.remove('active-calendar-field')
            }
            else{
                let previouslyActivatedCalendarField = document.querySelector('.active-calendar-field')
                if(previouslyActivatedCalendarField){
                    previouslyActivatedCalendarField.classList.remove('active-calendar-field')
                    let previouslyActivatedBtn = previouslyActivatedCalendarField.querySelector('.add-item-to-calendar')
                    previouslyActivatedBtn.classList.remove('activated-add-button')
                }
                item.classList.add('activated-add-button')
                activeCalendarField.classList.add('active-calendar-field')
            }
            
            // color parent element as active
            // listen for click on PARENT (recipes-representation-bar) children
            // if child was clicked = get all data from this item
            // to PARENTFIELD appendChild (create new input field) save value
            // if parentfield has 4 children - btn display none
        }
    }
    // recipe-delete from input is clicked
    var deleteRecipeInputBtn = document.querySelectorAll('.deleteRecipeInputBtn')
    deleteRecipeInputBtn.forEach(button =>{
      if (e.target == button){
         addRecipeBtn = button.parentElement.parentElement.firstElementChild
        if (addRecipeBtn.classList.contains('not-displayed')){
            addRecipeBtn.classList.remove('not-displayed')
            addRecipeBtn.classList.remove('activated-add-button')
        }
        button.parentElement.remove()
      }
    })

    // clicked on recipe-mini-card
    if (e.target.closest('ul') == recipesRepresentationUl){
        let liElement = e.target.parentElement
        let recipeName = liElement.firstChild.innerHTML
        let recipeId = liElement.firstChild.classList[1].split('=')[1]
        let previouslyActivatedCalendarField = document.querySelector('.active-calendar-field')
        if (previouslyActivatedCalendarField){
            addRecipeToCalendar(previouslyActivatedCalendarField, recipeName, recipeId)
        }
    }

    // check if coursetypeBtn was clicked
    for (let item of coursetypeBtnList) {
        if (e.target == item) {
            coursetypeName = item.getAttribute('name')
            sessionStorage.setItem("queryNumber", 1);
            queryCoursetypeRecipes(coursetypeName, 1).then(data =>{
                createRecipesRepresentation(data, 'coursetype')
                })
        }
    }
    // check if recipetypeBtn was clicked
    for (let item of recipetypeBtnList) {
        if (e.target == item) {
            recipetypeName = item.getAttribute('name')
            sessionStorage.setItem("queryNumber", 1);
            queryRecipetypeRecipes(recipetypeName, 1).then(data =>{
                createRecipesRepresentation(data, 'recipetype')
                })
        }
    }
    // check if favoritesBtn was clicked
    if (e.target == favoritesBtn) {
        sessionStorage.setItem("queryNumber", 1);
        queryfavoriteRecipes(1).then(data =>{
            createRecipesRepresentation(data, 'favorite')
            })
    }
    // person wants to see more recipes from the same category 
    if (e.target == nextRecipeBtn){
        let queryNumber =  parseInt(sessionStorage.getItem("queryNumber"));
        let modifiedQueryNumber = queryNumber + 1
        sessionStorage.setItem("queryNumber", modifiedQueryNumber)

        if (nextRecipeBtn.getAttribute('name') == 'coursetype'){
            queryCoursetypeRecipes(coursetypeName, modifiedQueryNumber).then(data =>{
                createRecipesRepresentation(data, 'coursetype')
                })
        }
        if (nextRecipeBtn.getAttribute('name') == 'recipetype'){
            queryRecipetypeRecipes(recipetypeName, modifiedQueryNumber).then(data =>{
                createRecipesRepresentation(data, 'recipetype')
                })
        }
        if (nextRecipeBtn.getAttribute('name') == 'favorite'){
            queryfavoriteRecipes(modifiedQueryNumber).then(data =>{
                createRecipesRepresentation(data, 'favorite')
                })
        }
    }
    // clicked on see-next-day-column
    if (e.target == nextdayBtn){
        let noWrappedItems = document.querySelectorAll('.no-wrapped')
        let firstNoWrappedItem = noWrappedItems[0]    
        let lastNoWrappedItem = noWrappedItems[noWrappedItems.length - 1]  
        let elementToShow = lastNoWrappedItem.nextElementSibling
        if (elementToShow){
            elementToShow.classList.add('no-wrapped')        
            elementToShow.classList.remove('wrapped')        
            let elementToHide = firstNoWrappedItem
            elementToHide.classList.remove('no-wrapped')        
            elementToHide.classList.add('wrapped') 
        }
    }
    // clicked on see-previous-day-column
    if (e.target == previousdayBtn){
        let noWrappedItems = document.querySelectorAll('.no-wrapped')
        let firstNoWrappedItem = noWrappedItems[0]    
        let lastNoWrappedItem = noWrappedItems[noWrappedItems.length - 1]  
        let elementToShow = firstNoWrappedItem.previousElementSibling
        if (elementToShow){
            elementToShow.classList.add('no-wrapped')        
            elementToShow.classList.remove('wrapped')        
            let elementToHide = lastNoWrappedItem
            elementToHide.classList.remove('no-wrapped')        
            elementToHide.classList.add('wrapped') 
        }
    }

})

//   detects wrapped elements, on window resize
window.addEventListener('resize', (event) => {
    detectWrap('.week-day')
  });

// detects wrapped elements on window load
detectWrap('.week-day')

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

async function queryRecipetypeRecipes(recipetypeName, queryNumber){
    const response = await fetch(
        '/recipetype-filter?recipetype=' + recipetypeName + 
        '&querynumber=' + queryNumber,
    {    
        method: 'GET',
    }
    );
    return response.json();
}

async function queryfavoriteRecipes(queryNumber){
    const response = await fetch(
        '/favorite-filter?querynumber=' + queryNumber,
    {    
        method: 'GET',
    }
    );
    return response.json();
}

async function createRecipesRepresentation(data, origin){
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
        nextRecipeBtn.setAttribute('name', `${origin}`)
        ulParentContainer.appendChild(nextRecipeBtn)
    }
    
}

// detect wrapped elements
function detectWrap(className) {
  
    let wrappedItems = [];
    let prevItem = {};
    let currItem = {};
    let items = document.querySelectorAll(className);
    let itemWrapHappened = false
    items.forEach(item =>{
        item.classList.remove('wrapped')
        if (!item.classList.contains('no-wrapped')){
            item.classList.add('no-wrapped')
        }
        currItem = item.getBoundingClientRect();
        if (itemWrapHappened == true){
            wrappedItems.push(item);
        }
        else if (prevItem && prevItem.top < currItem.top) {
            wrappedItems.push(item);
            itemWrapHappened = true
        }
          prevItem = currItem;
    })

    wrappedItems.forEach(item =>{
        item.classList.remove('no-wrapped')
        item.classList.add('wrapped')
    })
    return
  }


  function addRecipeToCalendar(previouslyActivatedCalendarField, recipeName, recipeId){
    let inputAndDeleteLiElement = document.createElement('li')
    let deleteBtnElement = document.createElement('button')
    deleteBtnElement.setAttribute('class', 'deleteRecipeInputBtn')
    deleteBtnElement.setAttribute('type', 'button')
    deleteBtnElement.appendChild(document.createTextNode('X'))
    let inputElement = document.createElement('input')
    inputElement.setAttribute('class', 'recipe-added-to-calendar')
    inputElement.setAttribute('value', recipeName)
    inputElement.setAttribute('name', `recipeId=${recipeId}`)
    inputAndDeleteLiElement.appendChild(inputElement)
    inputAndDeleteLiElement.appendChild(deleteBtnElement)
    previouslyActivatedCalendarField.appendChild(inputAndDeleteLiElement)

    if (previouslyActivatedCalendarField.children.length > 3){
        let button = previouslyActivatedCalendarField.querySelector('.activated-add-button')
        button.classList.add('not-displayed')
        previouslyActivatedCalendarField.classList.remove('active-calendar-field')
    }
  }

