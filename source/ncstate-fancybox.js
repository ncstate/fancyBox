$(document).ready(function() {

    $(".fancybox")
        .attr('rel', 'gallery')
        .fancybox({
            openEffect      : 'none',
            closeEffect     : 'none',
            nextEffect: 'fade',
            prevEffect: 'fade',
            padding : 0,
            tpl : {
                closeBtn : '<a title="Close" class="fancybox-item fancybox-close" href="javascript:;"><span class="glyphicon glyphicon-x"></span></a>',
                next     : '<a title="Next" class="fancybox-nav fancybox-next"><span class="glyphicon glyphicon-right-arrow"></span></a>',
                prev     : '<a title="Previous" class="fancybox-nav fancybox-prev"><span class="glyphicon glyphicon-left-arrow"></span></a>'
            },
            helpers : {
                title : {
                    type : 'inside'
                }
            }
        });

});