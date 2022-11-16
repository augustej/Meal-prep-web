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

        if (allGroceriesItems.length > 1){
            allGroceriesItems.forEach(grocItem =>{
                let groceriesItemname = grocItem.getAttribute('name')
                let groceriesItemID = groceriesItemname.slice('groceries-itemID'.length)
                if (sessionStorage.getItem('groceriesDictForCheckboxes')){
                    groceriesDictForCheckboxes = JSON.parse(sessionStorage.getItem('groceriesDictForCheckboxes'))
                    if (groceriesDictForCheckboxes[groceriesItemID] == 'checked')
                    {
                        if (!grocItem.classList.contains('line-through')){
                            grocItem.classList.add('line-through')
                        }
                    }
                }
                // create sessionStorage
                else{
                    groceriesDictForCheckboxes[groceriesItemID] = "unchecked"
                }
            })
            sessionStorage.setItem('groceriesDictForCheckboxes', JSON.stringify(groceriesDictForCheckboxes))
        }
    }

})

document.addEventListener('click', e=>{
    // listen for clicks on checkboxes 
    allCheckboxes.forEach(checkbox =>{
        if (e.target == checkbox){
            let liElementOfProduct = checkbox.parentElement
            let IDofItem = liElementOfProduct.getAttribute('name').slice('groceries-itemID'.length)
            let groceriesDictForCheckboxes = JSON.parse(sessionStorage.getItem('groceriesDictForCheckboxes'))
            // create click-unclick functionality
            if (groceriesDictForCheckboxes[IDofItem] == 'checked'){
                groceriesDictForCheckboxes[IDofItem] = 'unchecked'
                liElementOfProduct.classList.remove('line-through')
            }
            else{
                groceriesDictForCheckboxes[IDofItem] = 'checked'
                liElementOfProduct.classList.add('line-through')
            }
            sessionStorage.setItem('groceriesDictForCheckboxes', JSON.stringify(groceriesDictForCheckboxes))
            
        }
    })
    // listen for cerate new list button
    if (e.target == newGroceriesList){
        sessionStorage.removeItem('groceriesDictForCheckboxes')
    }
})

// async function loadChecklistToDb(jsonBody){
//     let response = await fetch('/load-checklist-to-db',
//         {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//                 },
//             body: JSON.stringify(jsonBody)
//         })
//     return response
// }