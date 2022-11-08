
// change page on page number click
var myRecipePageBtn = document.querySelectorAll('.my-recipes-page-button')
if (myRecipePageBtn){
    myRecipePageBtn.forEach(pagePElement =>{
        pagePElement.addEventListener('click', e=>{
            if (e.target == pagePElement){
                let pagePElementID = pagePElement.id
                let prefixlength = 'page'.length
                pagePElementID = pagePElementID.substring(prefixlength)
                currentUrl = window.location.href
                if (currentUrl.includes('?')){
                    modifiedUrl= currentUrl.split("?")[0]    
                    location.replace(modifiedUrl +  '?page=' + pagePElementID)
       
                }
                else{
                    location.replace(window.location.href +  '?page=' + pagePElementID)
                }
            }
        })
    })
}