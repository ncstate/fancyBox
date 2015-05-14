$(document).ready(function() {


    if ($(window).width() > 768) {
       $('.fancybox-media')
        .fancybox({
            openEffect : 'none',
            closeEffect : 'none',
            arrows : false,
            width: 800,
            height: 450,
            padding : 0,
            tpl : {
                closeBtn : '',
            },
            title: false,
            helpers : {
                media : {}
            }
        });
    }

});