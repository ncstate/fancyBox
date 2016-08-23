$(document).ready(function() {

    var fancybox_src = $('script[src*="ncstate-fancybox-min.js"]').attr('src'),
        fancybox_version = fancybox_src.indexOf('?v=') === -1 ? '' : fancybox_src.substr(fancybox_src.indexOf('?v=')),
        fancybox_url = fancybox_src.replace('ncstate-fancybox-min.js' + fancybox_version, '');


    $('head').append('<link rel="stylesheet" href="' + fancybox_url + 'ncstate-fancybox.css' + fancybox_version + '" type="text/css" />');

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

    $(".fancybox-expand").each(function(index, img) {
        $(img).fancybox({
            beforeLoad: function() {
                this.title = $(this.element).attr('data-caption');
            },
            openEffect : 'none',
            closeEffect : 'none',
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

});