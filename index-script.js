function mobileNavTransformation() {
    var mobileNavItems = document.querySelectorAll('.web-mob, .mobile, .nav-ul');
    console.log(mobileNavItems);

    mobileNavItems.forEach( function (item) {
        console.log(item);

        if (item.classList.contains('responsive')) {
            console.log('treu');
            item.classList.remove('responsive');

        } else {
            item.classList.add('responsive');

        }
    })
}