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

// Sum Numbers

numbers = [1, 5.2, 4, 0, -1]
function sum (numbers) {

    var totalSum = numbers.reduce( (preV, n) => preV + n, 0);
    console.log(totalSum)
    console.log(totalSum/ numbers.length)
    if (numbers.length !== 0){   
      return totalSum/ numbers.length;
    }
    else {return 0}
      
  };

  sum(numbers);