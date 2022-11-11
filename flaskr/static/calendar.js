var  coursetypeBtnList = document.querySelectorAll(".courstype-btn")
var  recipetypeBtnList = document.querySelectorAll(".recipetype-btn")
var favoritesBtn = document.querySelector('.favorites-btn')
var previousdayBtn = document.querySelector('.previous-day-btn')
var nextdayBtn = document.querySelector('.next-day-btn')
var addItemToCalendarBtn = document.querySelectorAll('.add-item-to-calendar')
var recipesRepresentationUl = document.querySelector('.recipes-representation-bar')
var saveCalendarBtn = document.querySelector('.save-calendar')
var cleanCalendarBtn = document.querySelector('.cleanCurrentCalendar')
var sideDishBtn = document.querySelector('.side-dish-button')
var calendarNameInputField = document.querySelector('#calendar-name')
var recipeSearchInCalendarInputField = document.querySelector('.recipe-search-input-calendar')

// search in calendar
recipeSearchInCalendarInputField.addEventListener('input', event =>{
    let inputValue = recipeSearchInCalendarInputField.value
    recipesRepresentationUl.innerHTML = ""
    if (recipesRepresentationUl.nextElementSibling){
        let buttonForMoreItems = recipesRepresentationUl.nextElementSibling
        recipesRepresentationUl.nextElementSibling.parentElement.removeChild(buttonForMoreItems)        
        }
    let invisibleElement = document.querySelector('.invisible-element')
    if (inputValue.length > 0){
        recipesRepresentationUl.innerHTML = ""
    // invisible element prevents from flashing screen 
        // (doesn't allow recipe-representation-bar to colapse on each input)
        if (!invisibleElement){
            let p = document.createElement('p')
            p.setAttribute('class', 'invisible-element')
            recipesRepresentationUl.parentElement.appendChild(p)
        }
        recipeSearch(inputValue).then(recipesList =>{
            for (recipeDict of recipesList){
                let li = document.createElement('li')
                let p = document.createElement('p')
                li.setAttribute('class', 'mini-recipe-card')
                p.appendChild(document.createTextNode(recipeDict['recipeName']))
                p.setAttribute('class', `recipe-title recipe-id=${recipeDict['recipeId']} simple-text-small`)
                let img = document.createElement('img')
                img.setAttribute('src', recipeDict['recipePath'])
                li.appendChild(p)
                li.appendChild(img)
                recipesRepresentationUl.appendChild(li)
            }
        })
    }
    else{
        if (invisibleElement){
            invisibleElement.remove()
        }
    }
    

})

// get list of matching recipes from db
async function recipeSearch(inputvalue){
    let response = await fetch('/recipe-search?input=' + inputvalue,
    {
        method: 'GET'
    })
    return response.json()
}

// on window load get items from sessionStorage
var planValue = JSON.parse(sessionStorage.getItem('plan'))
getDataFromSessionStorage(planValue)

//   detects wrapped elements, on window resize
window.addEventListener('resize', (event) => {
    detectWrap('.week-day')
  });

// detects wrapped elements on window load
detectWrap('.week-day')

document.addEventListener('click', e =>{
    // clean calendar
    if (e.target == cleanCalendarBtn){
        sessionStorage.removeItem('plan')
        location.reload()
    }

    // save calendar to db
    if (e.target == saveCalendarBtn){
        let calendarName = document.querySelector('#calendar-name').value
        let jsonBody = {}
        jsonBody[calendarName] = sessionStorage.getItem('plan')

        fetch('/load-calendar-to-db',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                },
            body: JSON.stringify(jsonBody)
        })
        location.reload()
    }

    // delete calendar from db
    var alldeleteCalendarBtns = document.querySelectorAll('.deleteCalendarFromDb')
    alldeleteCalendarBtns.forEach(deleteCalendarBtn =>{
    if (e.target == deleteCalendarBtn){
        let calendarID = deleteCalendarBtn.parentElement.getAttribute('name')

        fetch('/delete-calendar-from-db?' + calendarID,
        {
            method: 'GET'
        })
        deleteCalendarBtn.parentElement.remove()
    }
   })

   // load calendar from db
   var allloadCalendarBtns = document.querySelectorAll('.loadCalendarFromDbToSession')
   allloadCalendarBtns.forEach(LoadCalendarBtn =>{
   if (e.target == LoadCalendarBtn){
       let calendarID = LoadCalendarBtn.parentElement.getAttribute('name')
       getCalendarDataFromDb(calendarID).then(data =>{
        sessionStorage.setItem('plan', JSON.stringify(data))
        location.reload()
       })
    }
  })

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
            
        }
    }
    // recipe-delete from calendar is clicked
    var deleteRecipeInputBtn = document.querySelectorAll('.deleteRecipeInputBtn')
    deleteRecipeInputBtn.forEach(button =>{
      if (e.target == button){
        let recipeNameItem = button.previousElementSibling.getAttribute('name')
        let nameIteself = recipeNameItem.substring(0, recipeNameItem.indexOf('ID='))
        let idIteself = recipeNameItem.substring(recipeNameItem.indexOf('ID=')+ 'ID='.length)        
        addRecipeBtn = button.parentElement.parentElement.firstElementChild
        let currentCoursetype = addRecipeBtn.parentElement.getAttribute('name')
        let currentWeekday = addRecipeBtn.parentElement.parentElement.getAttribute('name')
        if (addRecipeBtn.classList.contains('not-displayed')){
            addRecipeBtn.classList.remove('not-displayed')
            addRecipeBtn.classList.remove('activated-add-button')
        }
        updateSessionStorage(currentWeekday, currentCoursetype , nameIteself, idIteself, 'remove')

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
    coursetypeBtnList.forEach(item =>{
        if (e.target == item) {
            coursetypeName = item.getAttribute('name')
            sessionStorage.setItem("queryNumber", 1);
            queryCoursetypeRecipes(coursetypeName, 1).then(data =>{
                createRecipesRepresentation(data, 'coursetype')
                })
        }
    })


    // check if recipetypeBtn was clicked
    recipetypeBtnList.forEach(item =>{
        if (e.target == item) {
            recipetypeName = item.getAttribute('name')
            sessionStorage.setItem("queryNumber", 1);
            queryRecipetypeRecipes(recipetypeName, 1).then(data =>{
                createRecipesRepresentation(data, 'recipetype')
                })
        }
    })
    // check if favoritesBtn was clicked
    if (e.target == favoritesBtn || e.target.parentElement == favoritesBtn) {
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
        showAndHideWrappedElements('last')
    }
    // clicked on see-previous-day-column
    if (e.target == previousdayBtn){
        showAndHideWrappedElements('first')
    }

})

// lock-unlock save-calendar btn
calendarNameInputField.addEventListener('input', event =>{
    let newCalendarName = calendarNameInputField.value
    if (newCalendarName.length > 0){
        saveCalendarBtn.removeAttribute('disabled')
    }
    else{
        if (!saveCalendarBtn.hasAttribute('disabled')){
            saveCalendarBtn.setAttribute('disabled', 'True')
        }
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
    // next-recipe Btn = ulSibling
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
        nextRecipeBtn.appendChild(document.createTextNode('>>'))
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
    let Coursetype = previouslyActivatedCalendarField.getAttribute('name')
    let weekday = previouslyActivatedCalendarField.parentElement.getAttribute('name')

    createDOMElementsInCalendar (previouslyActivatedCalendarField, recipeId, recipeName)
    updateSessionStorage(weekday, Coursetype , recipeName, recipeId, 'add')
    hideAddRecipeBtnFromCalendarIfNeeded (previouslyActivatedCalendarField)
}

function createSessionStorageTemplate(){
    let listOfWeekDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    let listOfCourseTypes = ['Pusryčiai', 'Pietūs', 'Vakarienė', 'Užkandžiai', 'Desertas']
    let value = {}

    for (dayName of listOfWeekDayNames){

        let Coursetype = []

        for (courseTypeName of listOfCourseTypes){
            let CoursetypeDic = {}
            CoursetypeDic[courseTypeName] = []
            Coursetype.push(CoursetypeDic)
        }

        value[dayName] = Coursetype
    }

    return value
}

function updateSessionStorage(weekday, Coursetype , recipeName, recipeId, addOrRemove){

    // sessionStorage.removeItem('plan')

    // add chosen recipe to sessionStorage
    if (!sessionStorage.getItem('plan')){
        var planValue = createSessionStorageTemplate()
        sessionStorage.setItem('plan', JSON.stringify(planValue))
    }
    else{
        var planValue = JSON.parse(sessionStorage.getItem('plan'))
    }

    if (addOrRemove == 'add'){
        for (item of planValue[weekday]){
            if (Object.keys(item)[0] == Coursetype){
                var  recipeItemDict = {}
                var listOfAddedRecipes = Object.values(item)[0]
                recipeItemDict['recipeName'] = recipeName
                recipeItemDict['recipeId'] = recipeId
                listOfAddedRecipes.push(recipeItemDict)
                sessionStorage.setItem('plan', JSON.stringify(planValue))
            }
        }
    }
    // remove chosen recipe from sessionStorage
    if (addOrRemove == 'remove'){
        for (item of planValue[weekday]){
            if (Object.keys(item)[0] == Coursetype){
                var listOfAddedRecipes = Object.values(item)[0]
                for (item of listOfAddedRecipes){
                if (item['recipeId'] == recipeId){
                    let index = listOfAddedRecipes.indexOf(item)
                    listOfAddedRecipes.splice(index, 1)
                    sessionStorage.setItem('plan', JSON.stringify(planValue))
                }
                }
            }
        }
    }
    
}

function hideAddRecipeBtnFromCalendarIfNeeded (parentElement){

       // remove add-button from calendar
       if (parentElement.children.length > 3){
        let button = parentElement.querySelector('.activated-add-button')
        button.classList.add('not-displayed')
        parentElement.classList.remove('active-calendar-field')
    }
}

function showAndHideWrappedElements(show)
{
    let noWrappedItems = document.querySelectorAll('.no-wrapped')
    let firstNoWrappedItem = noWrappedItems[0]    
    let lastNoWrappedItem = noWrappedItems[noWrappedItems.length - 1]  

    if (show == 'first'){
        var elementToShow = firstNoWrappedItem.previousElementSibling
        var elementToHide = lastNoWrappedItem
    }
    else{
        var elementToShow = lastNoWrappedItem.nextElementSibling
        var elementToHide = firstNoWrappedItem
    }
    
    if (elementToShow){
        elementToShow.classList.add('no-wrapped')        
        elementToShow.classList.remove('wrapped')        
        elementToHide.classList.remove('no-wrapped')        
        elementToHide.classList.add('wrapped') 
    }
}

function getDataFromSessionStorage(SessionStoragedata){

    var allWeekdaysColumns = document.querySelectorAll('.week-day-ul')

    for (weekdayName in SessionStoragedata){
        allWeekdaysColumns.forEach(oneWeekdayColumn =>{
            if (oneWeekdayColumn.getAttribute('name') == weekdayName){
                var calendarCellsOfOneColumn = oneWeekdayColumn.querySelectorAll('.calendar-cell')
                for (calendarCell of calendarCellsOfOneColumn){
                    let CoursetypeofCalendarCell = calendarCell.getAttribute('name')
                    let SessionListOfCoursetypeDictionaries = SessionStoragedata[weekdayName]
                    for (coursetypeDict of SessionListOfCoursetypeDictionaries){
                        let SessionStorageCoursetype = Object.keys(coursetypeDict)[0]
                        if (SessionStorageCoursetype == CoursetypeofCalendarCell){
                            let StorageArrayToGetDataFrom = Object.values(coursetypeDict)[0]
                            for (recipeItem of StorageArrayToGetDataFrom){
                                let nameOfRecipe = recipeItem['recipeName']
                                let idOfRecipe = recipeItem['recipeId']
                                createDOMElementsInCalendar (calendarCell, idOfRecipe, nameOfRecipe)
                                if (StorageArrayToGetDataFrom.length > 2){
                                    let button = calendarCell.querySelector('.add-item-to-calendar')
                                    button.classList.add('not-displayed')
                                }
                            }
                        }
                    }
                }
            }
        })
    }
}

function createDOMElementsInCalendar (parentElementforCreat, recipeIdforCreat, recipeNameforCreat){
    let pAndDeleteLiElement = document.createElement('li')
    let deleteBtnElement = document.createElement('button')
    deleteBtnElement.setAttribute('class', 'deleteRecipeInputBtn')
    deleteBtnElement.setAttribute('type', 'button')
    deleteBtnElement.appendChild(document.createTextNode('X'))
    let aElement = document.createElement('a')
    aElement.setAttribute('href', `single_recipe?recipeID=${recipeIdforCreat}`)
    aElement.setAttribute('class', 'recipe-added-to-calendar simple-text-small')
    aElement.setAttribute('name', `${recipeNameforCreat}ID=${recipeIdforCreat}`)
    aElement.appendChild(document.createTextNode(recipeNameforCreat))
    pAndDeleteLiElement.appendChild(aElement)
    pAndDeleteLiElement.appendChild(deleteBtnElement)
    parentElementforCreat.appendChild(pAndDeleteLiElement)
}

async function getCalendarDataFromDb(
    calendarID
){
    const response = await fetch(
        '/load-calendar-from-db?' + calendarID, 
        {
            method: 'GET',
        }
    );
    return response.json();
}