var allCheckboxes = document.querySelectorAll('.groceries-checkbox')
var newGroceriesList = document.querySelector('.create-new-groc-list-button')

window.addEventListener('load', event =>{
    var shoppingTimeForm = document.querySelector('.shopping-time-form')
    var recipesConfirmationForm = document.querySelector('.recipes-confirmation-container')

    // hide first form and show second one, after first one is submited
    if (window.location.href == `${window.location.origin}/confirm-recipes-for-shopping`){
        recipesConfirmationForm.classList.remove('invisible')
        shoppingTimeForm.classList.add('invisible')
        var portionsInputField = document.querySelector('#default-portions-for-all')
        portionsInputField.addEventListener('input', e=>{
            let inputDefaultValue = portionsInputField.value
            console.log(inputDefaultValue)
            let allInputsForPortions = document.querySelectorAll('.portions-of-recipe')
            allInputsForPortions.forEach(portionField =>{
                portionField.setAttribute('value', inputDefaultValue)
            })
        })
    }
    // hide second form after it is submited
    if (window.location.href == `${window.location.origin}/final-groceries-list`){
        recipesConfirmationForm.classList.add('invisible')
        shoppingTimeForm.classList.add('invisible')
    }
    // take data from session storage and line through already checked products
    if (window.location.href == `${window.location.origin}/groc_list`){
        var groceriesDictForCheckboxes = {}
        let allGroceriesItems = document.querySelectorAll('.groceries-item-in-list')
        
        // update sessionStorage from db FIRST
        getChecklistFromDb().then( data =>{
            if (Object.keys(data).length != 0){
                sessionStorage.setItem('groceriesDictForCheckboxes', JSON.stringify(data))
            }

            if (allGroceriesItems.length > 0){
                allGroceriesItems.forEach(grocItem =>{
                    let groceriesItemname = grocItem.getAttribute('name')
                    let groceriesItemID = groceriesItemname.slice('groceries-itemID'.length)
                    if (sessionStorage.getItem('groceriesDictForCheckboxes')){
                        groceriesDictForCheckboxes = JSON.parse(sessionStorage.getItem('groceriesDictForCheckboxes'))
                        if (groceriesDictForCheckboxes[groceriesItemID] == 'checked')
                        {
                            if (!grocItem.classList.contains('line-through')){
                                grocItem.classList.add('line-through')
                                let checkbox = grocItem.querySelector('.groceries-checkbox')
                                checkbox.setAttribute('checked', 'True')
                            }
                        }
                    }
                    // create sessionStorage
                    else{
                        groceriesDictForCheckboxes[groceriesItemID] = "unchecked"
                    }
                })
            }
            sessionStorage.setItem('groceriesDictForCheckboxes', JSON.stringify(groceriesDictForCheckboxes))
        })
            
    }
    
})

document.addEventListener('click', e=>{
    // listen for clicks on groceries checkboxes 
    allCheckboxes.forEach(checkbox =>{
        if (e.target == checkbox){
            let liElementOfProduct = checkbox.parentElement
            let IDofItem = liElementOfProduct.getAttribute('name').slice('groceries-itemID'.length)
            let groceriesDictForCheckboxes = JSON.parse(sessionStorage.getItem('groceriesDictForCheckboxes'))

            // if session storage checked-uncheck is already created
            if (groceriesDictForCheckboxes != null){
                if (groceriesDictForCheckboxes[IDofItem] == 'checked'){
                    // if person clicked on already checked element - uncheck it
                    groceriesDictForCheckboxes[IDofItem] = 'unchecked'
                    liElementOfProduct.classList.remove('line-through')
                }
                else{
                    // if person clicked on NOT checked element - check it
                    groceriesDictForCheckboxes[IDofItem] = 'checked'
                    liElementOfProduct.classList.add('line-through')
                }
            }
            // if session storage checked-uncheck is NOT created
            else{
                groceriesDictForCheckboxes = {}
            }
            // update session Storage in any case
            sessionStorage.setItem('groceriesDictForCheckboxes', JSON.stringify(groceriesDictForCheckboxes))
            updateCheckStatus(JSON.stringify(groceriesDictForCheckboxes))
        }
    })
    // listen for create new list button
    if (e.target == newGroceriesList){
        sessionStorage.removeItem('groceriesDictForCheckboxes')
    }
})

async function getChecklistFromDb(){
    let jsonBody = {}
    let response = await fetch('/get-checklist-from-db',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                },
            body: JSON.stringify(jsonBody)
        })
    return response.json()
}

async function updateCheckStatus(jsonBody){
    let response = await fetch('/groceries-check-update',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                },
            body: JSON.stringify(jsonBody)
        })
    return response
}