var allCheckboxes = document.querySelectorAll('.groceries-checkbox')
var newGroceriesList = document.querySelector('.create-new-groc-list-button')

window.addEventListener('load', event =>{
    var shoppingTimeForm = document.querySelector('.shopping-time-form')
    var recipesConfirmationForm = document.querySelector('.final-part-of-groceries-list-creation')

    // hide first form and show second one, after first one is submited
    if (window.location.href == `${window.location.origin}/create-groceries-list`){
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
        if (sessionStorage.getItem('checkedItemsList')){
            let checkedItemsList = JSON.parse(sessionStorage.getItem('checkedItemsList'))
            let allGroceriesItems = document.querySelectorAll('.groceries-item-in-list')
            allGroceriesItems.forEach(grocItem =>{
                let groceriesItemname = grocItem.getAttribute('name')
                let groceriesItemID = groceriesItemname.slice('groceries-itemID'.length)
                if (checkedItemsList.includes(groceriesItemID)){
                    if (!grocItem.classList.contains('line-through')){
                        grocItem.classList.add('line-through')
                        let checkbox = grocItem.querySelector('.groceries-checkbox')
                        checkbox.setAttribute('checked', 'True')
                    }
                }
            })
        }
    }

})

document.addEventListener('click', e=>{
    // listen for clicks on checkboxes 
    allCheckboxes.forEach(checkbox =>{
        if (e.target == checkbox){
            let liElementOfProduct = checkbox.parentElement
            let IDofItem = liElementOfProduct.getAttribute('name').slice('groceries-itemID'.length)
            if (sessionStorage['checkedItemsList']){
                // get data from session storage iif the list already exists
                let checkedItemsList = JSON.parse(sessionStorage.getItem('checkedItemsList'))
                // create click-unclick functionality
                if (checkedItemsList.includes(IDofItem)){
                    let index = checkedItemsList.indexOf(IDofItem)
                    checkedItemsList.splice(index, 1)
                    liElementOfProduct.classList.remove('line-through')
                }
                else{
                    checkedItemsList.push(IDofItem)
                    liElementOfProduct.classList.add('line-through')

                }
                sessionStorage.setItem('checkedItemsList', JSON.stringify(checkedItemsList))
            }
            else{
                // create session storage if is not not created
                let checkedItemsList = []
                checkedItemsList.push(IDofItem)
                liElementOfProduct.classList.add('line-through')
                sessionStorage.setItem('checkedItemsList', JSON.stringify(checkedItemsList))
            }
        }
    })
    // listen for cerate new list button
    if (e.target == newGroceriesList){
        sessionStorage.removeItem('checkedItemsList')
    }
})