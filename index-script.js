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