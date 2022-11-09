// Creating navigation burger
function mobileNavTransformation() {
    var mobileNavItems = document.querySelectorAll('.web-mob, .mobile, .nav-ul');

    mobileNavItems.forEach( function (item) {
        if (item.classList.contains('responsive')) {
            item.classList.remove('responsive');

        } else {
            item.classList.add('responsive');
        }
    })
}

// Importing current date into HTML
var dateElementInHtml = document.querySelector('#date');
var date = new Date();
var year = date.getFullYear();
dateElementInHtml.textContent = year;

// Listening for fileInputs in all document, to style "Choose file" button
var fileInputs = document.querySelectorAll(".input")
fileInputs.forEach(input =>{
    input.addEventListener('change', e =>{
        let fileAdded = e.target
        let fileAddedID = fileAdded.id
        let buttonClicked = e.target.closest('label')
        let buttonClickedID=buttonClicked.id
        onFileAddShowName(buttonClickedID, fileAddedID)
    })
})
//style changes of "choose file" button
function onFileAddShowName(buttonClickedID, fileAddedID){
    let buttonClicked = document.getElementById(buttonClickedID)
    let fileInput = document.getElementById(fileAddedID);   
    let filename = fileInput.files[0].name;
    let p = document.createElement('p')
    p.setAttribute('class','addedFilename')
    p.appendChild(document.createTextNode(filename))
    if (buttonClicked.nextElementSibling){
        //delete sibliing
        let element =buttonClicked.nextElementSibling
        buttonClicked.parentNode.removeChild(element)
    }
    buttonClicked.parentNode.appendChild(p)
}

// go back button
var backBtn = document.querySelector('.back-btn')
if (backBtn){
    document.addEventListener('click', e =>{
        if (backBtn == e.target){
            go_back()
        }
    })
    
}
function go_back()
    {window.location.href = document.referrer};