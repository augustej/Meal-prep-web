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

// save sessionStorage data about calendar, if /calendar loads, or if it the refferer
window.addEventListener( "load", event =>{
    if ((`${window.location.origin}/calendar` == window.location.href) || 
        (`${window.location.origin}/calendar` == document.referrer)) {

        let calendarName = 'currentCalendar'
        let jsonBody = {}
        jsonBody[calendarName] = sessionStorage.getItem('plan')
        // if user tries to save just emptied calendar - create an empty template
        if (jsonBody[calendarName] == null ){
            planValue = createSessionStorageTemplate()
            sessionStorage.setItem('plan', JSON.stringify(planValue))
            jsonBody[calendarName] = sessionStorage.getItem('plan')
        }
        loadCalendarToDb(jsonBody)
    }

    if ((`${window.location.origin}/groc_list` == window.location.href) || 
        (`${window.location.origin}/groc_list` == document.referrer)) {
        
        if (sessionStorage.getItem('groceriesDictForCheckboxes') != null ){
            let checkedGroceriesDict = sessionStorage.getItem('groceriesDictForCheckboxes')
            updateCheckStatus(checkedGroceriesDict)
        }
    }
})

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