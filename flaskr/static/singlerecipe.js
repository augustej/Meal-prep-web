var heartBtn = document.querySelector('.favorite-heart')
var deleteRecipeBtn = document.querySelector('.delete-recipe-btn')
var modifyRecipeBtn = document.querySelector('.modify-recipe-btn')

document.addEventListener('click', event =>{
    // delete recipe completely
    if (event.target == deleteRecipeBtn){
        if (confirm("Ar tikrai norite ištrinti šį receptą?") == true){
            let recipeIDItem =  deleteRecipeBtn.getAttribute('name')
            let recipeID = recipeIDItem.slice('recipeID='.length)
            fetch('/delete-recipe/' + recipeID, 
                {
                    method: 'DELETE',
                    headers: {
                        'Accept' : 'application/json',
                        'Content-Type': 'application/json'
                        }
                })
            window.location.replace("/");
        }
    }
    // modify recipe. Works together with recipes.js functions
    if (event.target == modifyRecipeBtn){

        let recipeToModifyName = modifyRecipeBtn.getAttribute('name')
        let recipeToModifyId = recipeToModifyName.slice('recipeID='.length)
        sendGetRequestAwaitforResponse('/create-ingredient-dictionary?recipeID=', recipeToModifyId).then(
        data =>{
            ingredientDictList = data
            let indexOfLastItem = ingredientDictList.length - 1
            let index = parseInt(ingredientDictList[indexOfLastItem]['index']) + 1
            sessionStorage.setItem("indexOfIngredient", index);
        })
    }
    if (heartBtn){
        // add recipe to favorites
        if (event.target == heartBtn){
            let prefixlength = 'heartID'.length
            let heartID = heartBtn.id
            let extractedRecipeID=heartID.substring(prefixlength)
            let response = ''
            heartBtn.classList.contains('favorited') ? response= 'NO' : response = 'YES'
            favoritesTableAddOrRemove(extractedRecipeID, response)
            heartBtn.classList.toggle('favorited')

        }
    }
})


async function sendGetRequestAwaitforResponse(url, data){
    let response = await fetch(url + data,
    {
        method: 'GET'
    })
    return response.json()
}

function favoritesTableAddOrRemove(recipeID, action){
    let dictionaryToSend = {}
    dictionaryToSend[recipeID] = action
    fetch('/check_if_favorite',
    {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json'
            },
        body: JSON.stringify(dictionaryToSend)
    }
   )
   return
}
