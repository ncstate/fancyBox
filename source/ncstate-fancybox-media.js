$(document).ready(function() {


    if ($(window).width() > 768) {
       $('.fancybox-media')
        .fancybox({
            openEffect : 'none',
            closeEffect : 'none',
            arrows : false,
            padding : 0,
            tpl : {
                closeBtn : '',
            },
            helpers : {
                media : {}
            }
        });
    }

});