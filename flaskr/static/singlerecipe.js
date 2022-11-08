// add recipe to favorites
var heartBtn = document.querySelector('.favorite-heart')
if (heartBtn){
heartBtn.addEventListener('click', e=>{
    console.log('clicked')
    let prefixlength = 'heartID'.length
    let heartID = heartBtn.id
    let extractedRecipeID=heartID.substring(prefixlength)
    if (heartBtn.classList.contains('favorited')){
        heartBtn.classList.remove('favorited')
        fetch('/check_if_favorite?recipeID='+extractedRecipeID+'&addToFavorites=NO')
    }
    else{
        heartBtn.classList.add('favorited')
        fetch('/check_if_favorite?recipeID='+extractedRecipeID+'&addToFavorites=YES')
    }
})
}
