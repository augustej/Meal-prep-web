var favoritesBtn = document.querySelector('.favorites-btn')
var recipesRepresentationUl = document.querySelector('.recipes-representation-bar')
var saveCalendarBtn = document.querySelector('.save-calendar')
var calendarNameInputField = document.querySelector('#calendar-name')
var recipeSearchInCalendarInputField = document.querySelector('.recipe-search-input-calendar')
var planValue = JSON.parse(sessionStorage.getItem('plan'))
var familyCalendar = document.querySelector('.familyCalendar')

// detects wrapped elements on window load
window.addEventListener('load', (event) => {
    detectWrap('.week-day')
});

//   detects wrapped elements on window resize
window.addEventListener('resize', (event) => {
    if (window.innerWidth > 427){
        detectWrap('.week-day')
    }
});

// alert before leaving page
window.onbeforeunload = function(){
    return 'Ar išsaugojote Savaitės plano pakeitimus ir norite palikti svetainę?';
};

// on load, check if this is family member
if  (familyCalendar){
    if (familyCalendar.classList.contains('not-loaded')){
        familyCalendar.classList.remove('not-loaded')
        let calendarID = parseInt(familyCalendar.value)
        sendGetRequestAwaitforResponse('/load-calendar-from-db?calendarID=', calendarID)
            .then(data =>{
                sessionStorage.setItem('plan', JSON.stringify(data))
                getDataFromSessionStorage(planValue)
            })
    }
}
// on window load get items from db
else{
    if ((`${window.location.origin}/calendar` == window.location.href) != 
    (`${window.location.origin}/calendar` == document.referrer)){
        
        loadFromDb().then(data =>{
            sessionStorage.setItem('plan', JSON.stringify(data))
            planValue = JSON.parse(sessionStorage.getItem('plan'))
            getDataFromSessionStorage(planValue)
        })
    }
    else{
        getDataFromSessionStorage(planValue)
    } 
}

// highlight todays column
let allWeekdaysColumns = document.querySelectorAll('.week-day-ul')
let weekdayArray = Array.from(allWeekdaysColumns)
let getDayIndex = date.getDay()
let todaysWeekdayIndex = 6
if (getDayIndex != 0){
    todaysWeekdayIndex = getDayIndex - 1
}
let UlToModiify = weekdayArray[todaysWeekdayIndex]
UlToModiify.parentElement.classList.add('todays-day-in-calendar')
UlToModiify.previousElementSibling.classList.add('todays-day-in-calendar-title')

document.addEventListener('input', e =>{

    // search for recipes in calendar
    if (e.target == recipeSearchInCalendarInputField){
        let buttonForMoreItems = recipesRepresentationUl.nextElementSibling

        // check if person has typed in anything in search
        inputValue = recipeSearchInCalendarInputField.value
        
        if (inputValue.length > 0){
            sessionStorage.setItem("queryNumber", 1);
            filterQueryToDb(inputValue, 1, 'search').then(data =>{
                createRecipesRepresentation(data, 'search')
            })
        }
        else{
            recipesRepresentationUl.innerHTML = ""
            if (buttonForMoreItems){
                buttonForMoreItems.parentElement.removeChild(buttonForMoreItems)        
            }
        }
    }

    // lock-unlock save-calendar btn
    if (e.target == calendarNameInputField){
        let newCalendarName = calendarNameInputField.value
        if (newCalendarName.length > 0){
            saveCalendarBtn.removeAttribute('disabled')
        }
        else{
            if (!saveCalendarBtn.hasAttribute('disabled')){
                saveCalendarBtn.setAttribute('disabled', 'True')
            }
        }
    }
})

document.addEventListener('click', e =>{

    // if add item to calendar button was clicked - select field to add to (add class .active-calendar-field)
    let nextRecipeBtn = document.querySelector(".next-recipe-btn")
    let addItemToCalendarBtns = document.querySelectorAll('.add-item-to-calendar')
    for (let addItemBtn of addItemToCalendarBtns){
        if (e.target == addItemBtn){
            let activeCalendarField = addItemBtn.parentElement
            let previouslyActivatedCalendarField = document.querySelector('.active-calendar-field')
            addItemBtn.classList.toggle('activated-add-button')
            activeCalendarField.classList.toggle('active-calendar-field')

            if(previouslyActivatedCalendarField){
                previouslyActivatedCalendarField.classList.remove('active-calendar-field')
                let previouslyActivatedBtn = previouslyActivatedCalendarField.querySelector('.add-item-to-calendar')
                previouslyActivatedBtn.classList.remove('activated-add-button')
            } 
        }
    }

    // recipe-delete from calendar is clicked
    let deleteRecipeInputBtns = document.querySelectorAll('.deleteRecipeInputBtn')
    deleteRecipeInputBtns.forEach(button =>{
      if (e.target == button){
        let recipeNameItem = button.previousElementSibling.getAttribute('name')
        let nameIteself = recipeNameItem.substring(0, recipeNameItem.indexOf('ID='))
        let idIteself = recipeNameItem.substring(recipeNameItem.indexOf('ID=')+ 'ID='.length)        
        let addRecipeBtn = button.parentElement.parentElement.firstElementChild
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
    let  coursetypeBtnList = document.querySelectorAll(".courstype-btn")
    coursetypeBtnList.forEach(item =>{
        if (e.target == item) {
            recipeSearchInCalendarInputField.value=""
            coursetypeName = item.getAttribute('name')
            sessionStorage.setItem("queryNumber", 1);
            filterQueryToDb(coursetypeName, 1, 'coursetype').then(data =>{
                createRecipesRepresentation(data, 'coursetype')
            })
        }
    })

    // check if recipetypeBtn was clicked
    let recipetypeBtnList = document.querySelectorAll(".recipetype-btn")
    recipetypeBtnList.forEach(item =>{
        if (e.target == item) {
            recipeSearchInCalendarInputField.value=""
            recipetypeName = item.getAttribute('name')
            sessionStorage.setItem("queryNumber", 1);
            filterQueryToDb(recipetypeName, 1, 'recipetype').then(data =>{
                createRecipesRepresentation(data, 'recipetype')
            })
        }
    })

    // check if favoritesBtn was clicked
    if (e.target == favoritesBtn || e.target.parentElement == favoritesBtn) {
        recipeSearchInCalendarInputField.value=""
        sessionStorage.setItem("queryNumber", 1);
        filterQueryToDb('favorite', 1, 'favorite').then(data =>{
            createRecipesRepresentation(data, 'favorite')
        })
    }

    // person wants to see more recipes from the same category 
    if (e.target == nextRecipeBtn){
        let queryNumber =  parseInt(sessionStorage.getItem("queryNumber"));
        let modifiedQueryNumber = queryNumber + 1
        sessionStorage.setItem("queryNumber", modifiedQueryNumber)

        if (nextRecipeBtn.getAttribute('name') == 'coursetype'){
            filterQueryToDb(coursetypeName, modifiedQueryNumber, 'coursetype').then(data =>{
                createRecipesRepresentation(data, 'coursetype')
            })
        }
        if (nextRecipeBtn.getAttribute('name') == 'recipetype'){
            filterQueryToDb(recipetypeName, modifiedQueryNumber, 'recipetype').then(data =>{
                createRecipesRepresentation(data, 'recipetype')
            })
        }
        if (nextRecipeBtn.getAttribute('name') == 'favorite'){
            filterQueryToDb('favorite', modifiedQueryNumber, 'favorite').then(data =>{
                createRecipesRepresentation(data, 'favorite')
            })
        }
        if (nextRecipeBtn.getAttribute('name') == 'search'){
            filterQueryToDb(inputValue, modifiedQueryNumber, 'search').then(data =>{
                createRecipesRepresentation(data, 'search')
            })
        }
    }

    // clicked on see-next-day-column
    let nextdayBtn = document.querySelector('.next-day-btn')
    if (e.target == nextdayBtn){
        showAndHideWrappedElements('last')
    }

    // clicked on see-previous-day-column
    let previousdayBtn = document.querySelector('.previous-day-btn')
    if (e.target == previousdayBtn){
        showAndHideWrappedElements('first')
    }

    // clean calendar
    let cleanCalendarBtn = document.querySelector('.cleanCurrentCalendar')
    if (e.target == cleanCalendarBtn){
        sessionStorage.removeItem('plan')
        location.reload()
    }

    // save changes of current calendar
    let saveCalendarChangesBtn = document.querySelector(".save-calendar-changes")
    if (e.target == saveCalendarChangesBtn){
        let calendarName = "currentCalendar"
        let jsonBody = prepareSessionDataForDbLoad(calendarName)
        loadCalendarToDb(jsonBody)
    }

    // save calendar to db
    if (e.target == saveCalendarBtn){
        let calendarName = calendarNameInputField.value
        prepareSessionDataForDbLoad(calendarName)
        loadCalendarToDb(jsonBody).then(data =>{
            location.reload()
        })
    }

    // delete calendar from db
    let alldeleteCalendarBtns = document.querySelectorAll('.deleteCalendarFromDb')
    alldeleteCalendarBtns.forEach(deleteCalendarBtn =>{
        if (e.target == deleteCalendarBtn){
            let calendarID = deleteCalendarBtn.parentElement.getAttribute('name').slice('calendarID='.length)
            fetch('/delete-calendar-from-db/' + calendarID,
            {
                method: 'DELETE'
            })
            deleteCalendarBtn.parentElement.remove()
        }
    })

   // load calendar from db
   let allloadCalendarBtns = document.querySelectorAll('.loadCalendarFromDbToSession')
   allloadCalendarBtns.forEach(LoadCalendarBtn =>{
        if (e.target == LoadCalendarBtn){
            let calendarID = LoadCalendarBtn.parentElement.getAttribute('name')
            sendGetRequestAwaitforResponse('/load-calendar-from-db?', calendarID)
            .then(data =>{
                sessionStorage.setItem('plan', JSON.stringify(data))
                location.reload()
            })
            }
    })
})

function prepareSessionDataForDbLoad(calendarName){
    let jsonBody = {}
    jsonBody[calendarName] = sessionStorage.getItem('plan')
    // if user tries to save just emptied calendar - create an empty template
    if (jsonBody[calendarName] == null ){
        planValue = createSessionStorageTemplate()
        sessionStorage.setItem('plan', JSON.stringify(planValue))
        jsonBody[calendarName] = sessionStorage.getItem('plan')
    }
    return jsonBody
}

async function filterQueryToDb(name, queryNumber, referrer){
    let url = ""
    if (referrer == 'coursetype'){
        url = '/coursetype-filter?coursetype=' + name
    }
    else if (referrer == 'recipetype'){
        url = '/recipetype-filter?recipetype=' + name
    }
    else if (referrer == 'favorite')
        { url = '/favorite-filter?='}
    else {
        url = '/recipe-search?input=' + name
    }

    const response = await fetch(
        url + '&querynumber=' + queryNumber,
    {    
        method: 'GET',
    }
    );
    return response.json();
}


async function createRecipesRepresentation(data, origin){
    let ulParentContainer = recipesRepresentationUl.parentNode
    // next-recipe Btn = ulSibling
    let ulSibling = recipesRepresentationUl.nextElementSibling
    if (ulSibling){
        ulParentContainer.removeChild(ulSibling)
    }
    recipesRepresentationUl.innerHTML = ""
    data.forEach(recipeItem =>{
        let li = document.createElement('li')
        li.setAttribute('class', 'mini-recipe-card')
        let p = document.createElement('p')
        p.appendChild(document.createTextNode(recipeItem.name))
        p.setAttribute('class', `recipe-title recipe-id=${recipeItem.id} simple-text-small`)
        let img = document.createElement('img')
        if (recipeItem.picture){
            img.setAttribute('src', recipeItem.picture)
        }
        else{
            img.setAttribute('src', "../static/images/intro1s.jpg" )
        }
        li.appendChild(p)
        li.appendChild(img)
        recipesRepresentationUl.appendChild(li)
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
    let coursetype = previouslyActivatedCalendarField.getAttribute('name')
    let weekday = previouslyActivatedCalendarField.parentElement.getAttribute('name')

    createDOMElementsInCalendar (previouslyActivatedCalendarField, recipeId, recipeName)
    updateSessionStorage(weekday, coursetype , recipeName, recipeId, 'add')
    hideAddRecipeBtnFromCalendarIfNeeded (previouslyActivatedCalendarField)
}

function createSessionStorageTemplate(){
    let listOfWeekDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    let listOfCourseTypes = ['Pusryčiai', 'Pietūs', 'Vakarienė', 'Užkandžiai', 'Desertas']
    let value = {}

    for (dayName of listOfWeekDayNames){

        let Coursetype = []

        for (let courseTypeName of listOfCourseTypes){
            let CoursetypeDic = {}
            CoursetypeDic[courseTypeName] = []
            Coursetype.push(CoursetypeDic)
        }

        value[dayName] = Coursetype
    }

    return value
}

function updateSessionStorage(weekday, Coursetype , recipeName, recipeId, addOrRemove){

    // add chosen recipe to sessionStorage
    if (!sessionStorage.getItem('plan')){
        planValue = createSessionStorageTemplate()
        sessionStorage.setItem('plan', JSON.stringify(planValue))
    }
    else{
        planValue = JSON.parse(sessionStorage.getItem('plan'))
    }
    
    for (let daymeal of planValue[weekday]){
        // for every daymeal, check if name matches with coursetype's name 
        if (Object.keys(daymeal)[0] == Coursetype){
            let listOfAddedRecipes = Object.values(daymeal)[0]
            if (addOrRemove == 'remove'){
                for (let item of listOfAddedRecipes){
                    if (item['recipeId'] == recipeId){
                        let index = listOfAddedRecipes.indexOf(item)
                        listOfAddedRecipes.splice(index, 1)
                        sessionStorage.setItem('plan', JSON.stringify(planValue))
                    }
                }
            }
            else{
                let  recipeItemDict = {}
                recipeItemDict['recipeName'] = recipeName
                recipeItemDict['recipeId'] = recipeId
                listOfAddedRecipes.push(recipeItemDict)
                sessionStorage.setItem('plan', JSON.stringify(planValue))
            }
        }
    }

}


function hideAddRecipeBtnFromCalendarIfNeeded (parentElement){
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

    let allWeekdaysColumns = document.querySelectorAll('.week-day-ul')
    var dailyRecipesDict = {}

    for (weekdayName in SessionStoragedata){
        allWeekdaysColumns.forEach(oneWeekdayColumn =>{
            if (oneWeekdayColumn.getAttribute('name') == weekdayName){
                var daysRecipesList = []

                let calendarCellsOfOneColumn = oneWeekdayColumn.querySelectorAll('.calendar-cell')
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
                                daysRecipesList.push(idOfRecipe)
                                createDOMElementsInCalendar (calendarCell, idOfRecipe, nameOfRecipe)
                                if (StorageArrayToGetDataFrom.length > 2){
                                    let button = calendarCell.querySelector('.add-item-to-calendar')
                                    button.classList.add('not-displayed')
                                }
                            }
                        }
                    }
                }
                dailyRecipesDict[weekdayName] = daysRecipesList
            }
        })
    }
    getDailyCalories(dailyRecipesDict).then(data =>{
        if (data != 'error'){
            for (weekday of Object.keys(data)){
                let dayToAddCalories = document.querySelector(`.${weekday}-calories`)
                let pEl = document.createElement('p')
                pEl.appendChild(document.createTextNode(data[weekday]))
                dayToAddCalories.appendChild(pEl)
            }
        }
    })
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
    if (!familyCalendar){
        pAndDeleteLiElement.appendChild(deleteBtnElement)
    }
    parentElementforCreat.appendChild(pAndDeleteLiElement)
}


async function sendGetRequestAwaitforResponse(url, data){
    let response = await fetch(url + data,
    {
        method: 'GET'
    })
    return response.json()
}

async function loadFromDb(){
    let response = await fetch('/load-calendar-from-db?calendarID=current')
    return response.json()
}


async function loadCalendarToDb(jsonBody){
    let response = await fetch('/load-calendar-to-db',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                },
            body: JSON.stringify(jsonBody)
        })
    return response
}

async function getDailyCalories(jsonBody){
    let response = await fetch('/get-daily-calories',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                },
            body: JSON.stringify(jsonBody)
        })
    return response.json()
}
