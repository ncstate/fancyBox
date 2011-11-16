/*! 
 * fancyBox 2.0
 * Copyright 2011, Janis Skarnelis (www.fancyapps.com)
 * License: www.fancyapps.com/fancybox/#license
 *	
*/
(function (window, document, $, f) {
	var	W = $(window),
		D = $(document),
		F = $.fancybox = function( group, opts ) {
			F.open( group, opts );
		},
		didResize	= false,
		resizeTimer	= null;

	$.extend(F, {
		// The current version of fancyBox
		version	: '2.0',

		defaults : {
			padding		: 15,
			margin		: 20,

			width		: 800,
			height		: 600,
			minWidth	: 200,
			minHeight	: 200,
			maxWidth	: 9999,
			maxHeight	: 9999,

			autoSize	: true,
			fitToView	: true,
			aspectRatio	: false,
			topRatio	: 0.5,

			fixed		: (!$.browser.msie || $.browser.version > 6) && $.support.boxModel, // Should set position to 'fixed' if content fits inside viewport
			scrolling	: 'auto',	// 'auto', 'yes' or 'no'
			wrapCSS		: 'fancybox-default',
			
			closeClick	: true,
			closeBtn	: true,
			arrows		: true,
			mouseWheel	: true,			

			loop	: true,
			ajax	: {},
			keys	: {
				next	: [13, 32, 34, 39, 40],	// enter, space, page down, right arrow, down arrow
				prev	: [8, 33, 37, 38],		// backspace, page up, left arrow, up arrow
				close	: [27]	// escape key
			},

			autoPlay	: false,
			playSpeed	: 3000,

			// Override some properties
			index		: 0,
			type		: null,
			url			: null,
			content		: null,
			title		: null,

			// HTML templates
			tpl : {
				wrap		: '<div class="fancybox-wrap"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div>',
				image		: '<img class="fancybox-image" src="{url}" alt="" />',
				iframe		: '<iframe class="fancybox-iframe" name="fancybox-frame{rnd}" frameborder="0" hspace="0" ' + ($.browser.msie ? 'allowtransparency="true""' : '') + ' scrolling="{scrolling}" src="{url}"></iframe>',
				swf			: '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%"><param name="wmode" value="transparent" /><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="{url}" /><embed src="{url}" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="100%" height="100%" wmode="transparent"></embed></object>',
				error		: '<p class="fancybox-error">The requested content cannot be loaded.<br/>Please try again later.</p>',
				closeBtn	: '<div title="Close" class="fancybox-item fancybox-close"></div>',
				next		: '<a title="Next" class="fancybox-item fancybox-next"><span></span></a>',
				prev		: '<a title="Previous" class="fancybox-item fancybox-prev"><span></span></a>'
			},

			// Properties for each animation type
			// Opening fancyBox
			openEffect		: 'fade',		// 'elastic', 'fade' or 'none'
			openSpeed		: 300,
			openEasing		: 'swing',
			openOpacity		: true,
			openMethod		: 'zoomIn',

			// Closing fancyBox
			closeEffect		: 'fade',		// 'elastic', 'fade' or 'none'
			closeSpeed		: 300,
			closeEasing		: 'swing',
			closeOpacity	: true,
			closeMethod		: 'zoomOut',

			// Changing next gallery item
			nextEffect	: 'elastic',	// 'elastic', 'fade' or 'none'
			nextSpeed		: 300,
			nextEasing	: 'swing',
			nextMethod	: 'changeIn',

			// Changing previous gallery item
			prevEffect		: 'elastic',	// 'elastic', 'fade' or 'none'
			prevSpeed		: 300,
			prevEasing		: 'swing',
			prevMethod		: 'changeOut',

			// Enabled helpers
			helpers : {
				overlay	: {
					speedIn		: 0,
					speedOut	: 0,
					opacity		: 0.85,
					css			: {
						cursor : 'pointer',
						'background-color' : 'rgba(0, 0, 0, 0.85)' //Browsers who don`t support rgba will fall back to default color value defined at CSS file
					},
					closeClick : true
				},
				title	: {
					type : 'float' // 'float', 'inside', 'outside' or 'over'
				}
			},

			// Callbacks
			onCancel	: $.noop,	// If canceling
			beforeLoad	: $.noop,	// Before loading
			afterLoad	: $.noop,	// After loading
			beforeShow	: $.noop,	// Before changing in current item
			afterShow	: $.noop,	// After opening
			beforeClose	: $.noop,	// Before closing
			afterClose	: $.noop	// After closing
		},

		group	: {},	// Selected group
		opts	: {},	// Group options
		coming	: null,	// Element being loaded
		current	: null,	// Currently loaded element

		isOpen		: false,	// Is currently open
		isOpened	: false,	// Have been fully opened at least once

		wrap	: null,
		outer	: null,
		inner	: null,

		player	: {
			timer		: null,
			isActive	: false
		},

		// Loaders
		ajaxLoad	: null,
		imgPreload	: null,

		// Some collections
		transitions	: {},
		helpers		: {},

		/*
		*	Static methods
		*/

		open : function( group, opts ) {
			// Normalize group
			if (!$.isArray(group)) {
				group = [ group ];
			}

			if (!group.length) {
				return;	
			}

			//Kill existing instances
			F.close( true );

			// Shortcut - $.fancybox('image.jpg'); or $.fancybox(['image1.jpg', 'image2.jpg']);
			$.each(group, function(key, el) {
				if (typeof el !== 'object') {
					group[ key ] = {href: el};
				}
			});

			//extend the defaults
			F.opts	= $.extend(true, {}, F.defaults, opts);
			F.group	= group;

			F._start( F.opts.index || 0 );
		},

		cancel : function() {
			if (F.coming && false === F.trigger( 'onCancel' )) {
				return;
			}

			F.coming = null;

			F.hideLoading();

			if (F.ajaxLoad) {
				F.ajaxLoad.abort();	
			}

			F.ajaxLoad = null;

			if (F.imgPreload) {
				F.imgPreload.onload = F.imgPreload.onabort = F.imgPreload.onerror = null;
			}
		},

		close : function(a) {
			F.cancel();

			if (!F.current || false === F.trigger( 'beforeClose' )) {
				return;	
			}

			//If forced or is still opening then remove immediately
			if (!F.isOpen || (a && a[0] === true)) {
				$(".fancybox-wrap").stop().trigger('onReset').remove();

				F._afterZoomOut();

			} else {	
				F.isOpen = F.isOpened = false;

				$(".fancybox-item").remove();

				F.wrap.stop(true).removeClass('fancybox-opened');
				F.inner.css('overflow', 'hidden');

				F.transitions[ F.current.closeMethod ]();
			}
		},

		play : function(a) {
			var clear = function() {
				clearTimeout(F.player.timer);

			},
			set = function() {
				clear();

				if (F.current && F.player.isActive) {
					F.player.timer = setTimeout(F.next, F.current.playSpeed);
				}
			},
			stop = function() {
				clear();

				D.unbind('.player');

				F.player.isActive = false;

				F.trigger('onPlayEnd');
			},
			start = function() {
				if (F.current && (F.current.loop || F.current.index < F.group.length - 1)) {
					F.player.isActive = true;

					set();

					D.bind({
						'onCancel.player onComplete.player onUpdate.player'	: set,
						'onClose.player'	: stop,
						'onStart.player'	: clear
					});

					F.trigger('onPlayStart');
				}
			};

			if (F.player.isActive || (a && a[0] === false)) {
				stop();	
			} else {
				start();
			}
		},

		next : function() {
			F.current && F.jumpto( F.current.index + 1 );
		},

		prev : function() {
			F.current && F.jumpto( F.current.index - 1 );
		},

		jumpto : function( index ) {
			if (!F.current) {
				return;	
			}

			index = parseInt( index, 10 );

			if (F.group.length > 1 && F.current.loop) {
				if (index >= F.group.length) {
					index = 0;

				} else if (index < 0) {
					index = F.group.length - 1;
				}
			}

			if (typeof F.group[ index ] !== 'undefined') {
				F.cancel();

				F._start( index );
			}
		},

		reposition : function(a) {
			if (F.isOpen) {
				F.wrap.css( F._getPosition(a) );
			}
		},

		update : function() {
			if (F.isOpen) {
	
				// It's a very bad idea to attach handlers to the window scroll event
				// so we run this code after a delay
				if (!didResize) {
					resizeTimer = setInterval(function() {
						if (didResize) {
							didResize = false;

							clearTimeout(resizeTimer);

							if (F.current) {
                                if (F.current.autoSize) {
                                    F.inner.height( 'auto' );
                                    F.current.height = F.inner.height();
                                }

								F._setDimension();

								if (F.current.canGrow) {
									F.inner.height( 'auto' );
								}

								F.reposition();

								F.trigger( 'onUpdate' );
							}
						}
					}, 100);
				}

				didResize = true;
			}
		},

		toggle : function() {
			if (F.isOpen) {
				F.current.fitToView = !F.current.fitToView;

				F.update();
			}
		},

		hideLoading : function() {
			$("#fancybox-loading").remove();
		},

		showLoading : function() {
			F.hideLoading();

			$('<div id="fancybox-loading"></div>').click(F.cancel).appendTo('body');
		},

		getViewport : function() {
			return {
				x : W.scrollLeft(),
				y : W.scrollTop(),
				w : W.width(),
				h : W.height()
			};
		},

		// unbind the keyboard / clicking actions
		unbindEvents : function() {
			D.unbind('.fb');
			W.unbind('.fb');
		},

		bindEvents : function() {
			if (!F.current) {
				return;
			}

			W.bind('resize.fb, orientationchange.fb', F.update);

			if (F.current.keys) {
				D.bind('keydown.fb', function(e) {
					// Ignore key events within form elements
					if ($.inArray(e.target.tagName.toLowerCase, ['input', 'textarea', 'select', 'button']) > -1) {
						return;
					}

					if ($.inArray(e.keyCode, F.current.keys.close) > -1) {
						F.close();
						e.preventDefault();

					} else if ($.inArray(e.keyCode, F.current.keys.next) > -1) {
						F.next();
						e.preventDefault();

					} else if ($.inArray(e.keyCode, F.current.keys.prev) > -1) {
						F.prev();
						e.preventDefault();
					}
				});
			}

			if ($.fn.mousewheel && F.current.mouseWheel && F.group.length > 1) {
				F.wrap.bind('mousewheel.fb', function(e, delta) {
					if ($(e.target).get(0).clientHeight === 0 || $(e.target).get(0).scrollHeight === $(e.target).get(0).clientHeight) {
						e.preventDefault();

						F[ delta > 0 ? 'prev' : 'next']();
					}
				});
			}
		},

		trigger : function(event) {
			var ret, obj = event === 'onCancel' || event === 'beforeLoad' ? 'coming' : 'current';

			if (!F[ obj ]) {
				return;
			}

			if ($.isFunction( F[ obj ][ event ] ) ) {
				ret = F[ obj ][ event ].apply( F[ obj ], Array.prototype.slice.call(arguments, 1) );
			}

			if (ret === false) {
				return false;	
			}

			if (F[ obj ].helpers) {
				$.each(F[ obj ].helpers, function(helper, opts) {
					if (opts && typeof F.helpers[ helper ] !== 'undefined' && $.isFunction( F.helpers[ helper ][ event ])) {
						F.helpers[ helper ][ event ]( opts );
					}
				});
			}

			$.event.trigger( event + '.fb' );
		},

		isImage : function( str ) {
			return str && str.match(/\.(jpg|gif|png|bmp|jpeg)(.*)?$/i);
		},

		isSWF : function( str ) {
			//return str && str.match(/[^\.]\.(swf)\s*$/i);
			return str && str.match(/\.(swf)(.*)?$/i);
		},

		_start : function( index ) {
			var element	= F.group[ index ] || null, 
				coming	= $.extend(true, {}, F.opts, (element && $.metadata ? $(element).metadata() : {})),
				isDom	= false,
				rez		= false;

			coming.index	= index;
			coming.element	= element;

			// Convert margin property to array - top, right, bottom, left
			if (typeof coming.margin === 'number') {
				coming.margin = [coming.margin, coming.margin, coming.margin, coming.margin]; 
			}

			F.coming = coming;

			//Give a chance for callback or helpers to update item (type, title, etc)
			if (false === F.trigger('beforeLoad')) {
				F.coming = null;
				return;	
			}

			//If custom content exists than use it as element
			if (F.coming.content) {
				element	= F.coming.content;
			}

			//If element is object than we can detect if it is DOM element, also get source path
			if (typeof element === 'object') {
				isDom = (element.nodeType  || element instanceof $);

				F.coming.url = $(element).attr('href') || null;	
			}

			//Check if content type is set, if not, try to get
			if (!F.coming.type) {

				//If we have source path we can use it to load content ... 
				if (F.coming.url) {
					if (isDom) {
						rez = $(element).data('fancybox-type');

						if (!rez) {
							rez = element.className.match(/fancybox\.(\w+)/);
							rez = rez ? rez[1] : false;
						}
					}

					if (rez) {
						F.coming.type = rez;

					} else if (F.isImage(F.coming.url)) {
						F.coming.type = 'image';

					} else if (F.isSWF(F.coming.url)) {
						F.coming.type = 'swf';

					} else if (F.coming.url.match(/^#/)) {
						F.coming.type = 'inline';

					} else {
						F.coming.content = F.coming.url;
					}

					if (F.coming.type === 'inline') {
						F.coming.content = $(F.coming.url);
					}
				}

				if (!F.coming.type) {
					// ...if not - we can display given DOM element itself ..
					if (isDom) {
						F.coming.type		= 'inline';
						F.coming.content	= element;

					// .. or assume that we have HTML 
					} else if (F.coming.content) {
						F.coming.type = 'html';
					}
				}
			}

			if (F.coming.type === 'image') {
				F._loadImage();

			} else if (F.coming.type === 'ajax') {
				F._loadAjax();

			} else if (F.coming.type) {
				F._afterLoad();

			} else {
				return F._error();
			}
		},

		_error : function() {
			F.coming.type		= 'html';
            F.coming.minHeight	= 0;
			F.coming.autoSize	= true;
			F.coming.content	= F.coming.tpl.error;

			F._afterLoad();
		},

		_loadImage : function() {
			// Reset preload image so it is later possible to check "complete" property
			F.imgPreload = new Image(); 

			F.imgPreload.onload = function () {
				this.onload = this.onerror = null;

				F.coming.width	= this.width;
				F.coming.height	= this.height;

				F._afterLoad();
			};

			F.imgPreload.onerror = function () {
				this.onload = this.onerror = null;

				F._error();
			};

			F.imgPreload.src = F.coming.url;

			if (!F.imgPreload.complete) {
				F.showLoading();
			}
		},

		_loadAjax : function() {
			F.showLoading();

			F.ajaxLoad = $.ajax($.extend({}, F.coming.ajax, {
				url		: F.coming.url,
				error	: function(jqXHR, textStatus, errorThrown) {
					if (textStatus !== 'abort' && jqXHR.status > 0) {
						F.coming.content = errorThrown;
						
						F._error();

					} else {
						F.hideLoading();
					}
				},
				success : function(data, textStatus, jqXHR) {
					if (textStatus === 'success') {
						F.coming.content = data;
						
						F._afterLoad();
					}
				}
			}));
		},

		_afterLoad : function() {
			F.hideLoading();

			if (F.current && false === F.trigger( 'afterLoad' )) {
				F.coming = false;

				return;
			}

			if ( F.isOpened ) {
				$(".fancybox-item").remove();

				F.wrap.stop(true).removeClass('fancybox-opened');

				F.transitions[ F.current.prevMethod ]();

			} else {
				$(".fancybox-wrap").stop().trigger('onReset').remove();	
			}

			F.isOpen	= false;
			F.current	= F.coming;
			F.coming	= false;
			
			//Build the neccessary markup
			F.wrap		= $(F.current.tpl.wrap).addClass( F.current.wrapCSS ).appendTo('body');
			F.outer		= $('.fancybox-outer',	F.wrap).css('padding', F.current.padding + 'px');
			F.inner		= $('.fancybox-inner',	F.wrap);

			F._setContent();

			F.unbindEvents();
			F.bindEvents();

			//Give a chance for helpers or callbacks to update elements
			F.trigger( 'beforeShow' );

			F._setDimension();

			if ( F.isOpened ) {
				F.transitions[ F.current.nextMethod ]();

			} else {
				F.transitions[ F.current.openMethod ]();
			}
		},

		_setContent : function() {
			var content, loadingBay;

			switch (F.current.type) {
				case 'inline' :
				case 'ajax' :
				case 'html' :

					if (F.current.type === 'inline') {
						content = F.current.content.show().detach();

						if (content.parent().hasClass('fancybox-inner')) {
							content.parents('.fancybox-wrap').trigger('onReset').remove();
						}

						$(F.wrap).bind('onReset', function() {
							content.appendTo('body').hide();
						});

					} else {
						content = F.current.content;
					}

					if (F.current.autoSize) {
						loadingBay = $('<div class="fancybox-tmp"></div>').appendTo( $("body") ).append( content );

						F.current.width		= loadingBay.outerWidth();
						F.current.height	= loadingBay.outerHeight(true);

						//Little cheat to fix 1px bug in some browsers
						loadingBay.width( F.current.width );

						if (loadingBay.height() > F.current.height) {
							loadingBay.width( ++F.current.width);

							F.current.width		= loadingBay.outerWidth();
							F.current.height	= loadingBay.height();
						}

						content = loadingBay.children().detach();

						loadingBay.remove();
					}

				break;

				case 'image' :
					content = F.current.tpl.image.replace('{url}', F.current.url);

					F.current.aspectRatio = true;
				break;

				case 'swf' :
					content = F.current.tpl.swf
						.replace(/\{width\}/g,	F.current.width )
						.replace(/\{height\}/g,	F.current.height )
						.replace(/\{url\}/g,	F.current.url);
				break;

				case 'iframe' :
					content = F.current.tpl.iframe
						.replace('{url}',		F.current.url)
						.replace('{scrolling}',	F.current.scrolling)
						.replace('{rnd}',		new Date().getTime());
				break;	
			}

			if ($.inArray(F.current.type, ['image', 'swf', 'iframe']) > -1) {
				F.current.autoSize	= false;
				F.current.scrolling	= false;
			}

			F.inner.append( content );
		},

		_setDimension : function() {
			var	viewport	= F.getViewport(),
				margin		= F.current.margin,
				padding2	= F.current.padding * 2,
				width		= F.current.width + padding2,
				height		= F.current.height + padding2,
				ratio		= F.current.width / F.current.height,

				maxWidth	= F.current.maxWidth,
				maxHeight	= F.current.maxHeight,
				minWidth	= F.current.minWidth,
				minHeight	= F.current.minHeight;

			viewport.w	-= (margin[1] + margin[3]);
			viewport.h	-= (margin[0] + margin[2]);

			if (width.toString().indexOf('%') > -1) {
				width = ((viewport.w * parseFloat(width)) / 100);
			}

			if (height.toString().indexOf('%') > -1) {
				height = ((viewport.h * parseFloat(height)) / 100);
			}

			if (F.current.fitToView) {
                maxWidth	= Math.min(viewport.w, maxWidth);
				maxHeight	= Math.min(viewport.h, maxHeight);
			}

			maxWidth	= Math.max(minWidth,	maxWidth);
			maxHeight	= Math.max(minHeight,	maxHeight);

			if (F.current.aspectRatio) {
				if (width > maxWidth) {
					width	= maxWidth;
					height	= ((width - padding2) / ratio) + padding2;
				}

				if (height > maxHeight) {
					height	= maxHeight;
					width	= ((height - padding2) * ratio) + padding2;
				}

				if (width < minWidth) {
					width	= minWidth;
					height	= ((width - padding2) / ratio) + padding2;
				}

				if (height < minHeight) {
					height	= minHeight;
					width	= ((height - padding2) * ratio) + padding2;
				}

			} else {
				width	= Math.max(minWidth, Math.min(width, maxWidth));
				height	= Math.max(minHeight, Math.min(height, maxHeight));
			}

			width	= Math.round( width );
			height	= Math.round( height );

			//Reset dimensions
			$( F.wrap.add( F.outer ).add( F.inner ) ).width( 'auto' ).height( 'auto' );

			F.inner.width( width - padding2 ).height( height - padding2);
			F.wrap.width( width  );

			//Fit wrapper inside
			if (width > maxWidth || F.wrap.height() > maxHeight) {
				while ((width > maxWidth || F.wrap.height() > maxHeight) && width > minWidth && F.wrap.height() > minHeight) {
					height = height - 10;

					if (F.current.aspectRatio) {
						width = Math.round( ((height - padding2) * ratio) + padding2 );

						if (width < minWidth) {
							width	= minWidth;
							height	= ((width - padding2) / ratio) + padding2;
						}

					} else {
						width = width - 10;
					}
		
					F.inner.width( width - padding2 ).height( height - padding2 );
					F.wrap.width( width );					
				}
			}

			F.current.dim = {
				width	: width,
				height	: F.wrap.height()
			};

			F.current.canGrow	= F.current.autoSize && height > minHeight && height < maxHeight;
			F.current.canShrink = false;
			F.current.canExpand = false;

			if ((width - padding2) < F.current.width || (height - padding2) < F.current.height) {
				F.current.canExpand = true;

			} else if ((width > viewport.w || F.current.dim.height > viewport.h) && width > minWidth && height > minHeight) {
				F.current.canShrink = true;
			}
		},

		_getPosition : function(a) {
			var	viewport	= F.getViewport(),
				margin		= F.current.margin,
				width		= F.wrap.width() + margin[1] + margin[3],
				height		= F.wrap.height() + margin[0] + margin[2],
				rez = {
					position	: 'absolute',
					top			: margin[0] + viewport.y,
					left		: margin[3] + viewport.x
				};

			if (F.current.fixed && (!a || a[0] === false) && height <= viewport.h && width <= viewport.w ) {
				rez = {
					position	: 'fixed',
					top			: margin[0],
					left		: margin[3]
				};
			}

			rez.top		= Math.ceil( Math.max(rez.top, rez.top + ((viewport.h - height) * F.current.topRatio))) + 'px';
			rez.left	= Math.ceil( Math.max(rez.left, rez.left + ((viewport.w - width) * 0.5))) + 'px';

			return rez;
		},

		_afterZoomIn : function() {
			F.isOpen = F.isOpened = true;

			F.wrap.addClass('fancybox-opened').css('overflow', 'visible');

            F.update();

			F.inner.css('overflow', F.current.scrolling === 'auto' ? 'auto' : (F.current.scrolling === 'yes' ? 'scroll' : 'hidden'));

			//Assign a click event
			if (F.current.closeClick) {
				F.inner.bind('click.fb', F.close);
			}

			//Create a close button
			if (F.current.closeBtn) {
				$(F.current.tpl.closeBtn).appendTo( F.wrap ).bind('click.fb', F.close);
			}

			//Create navigation arrows
			if (F.current.arrows && F.group.length > 1) {
				if (F.current.loop || F.current.index > 0) {
					$(F.current.tpl.prev).appendTo( F.wrap ).bind('click.fb', F.prev);
				}

				if (F.current.loop || F.current.index < F.group.length - 1) {
					$(F.current.tpl.next).appendTo( F.wrap ).bind('click.fb', F.next);
				}
			}

			F.trigger( 'afterShow' );

			if (F.opts.autoPlay && !F.player.isActive) {
				F.opts.autoPlay	= false;

				F.play();	
			}
		},

		_afterZoomOut : function() {
			F.unbindEvents();

			F.trigger( 'afterClose' );

			F.wrap.trigger('onReset').remove();

			$.extend(F, {
				group		: {},
				opts		: {},
				current		: null,
				isOpened	: false,
				isOpen		: false,
				wrap		: null,
				outer		: null,
				inner		: null
			});
		}
	});

	/*
	*	Default transitions
	*/
	
	F.transitions = {
		getOrigPosition : function() {
			var element	= F.current.element,
				pos		= {},
				width	= 50,
				height	= 50,
				image,
				viewport;

			if (element && element.nodeName && $(element).is(':visible')) {
				image = $(element).find('img:first');
				
				if (image.length) {
					pos		= image.offset();
					width	= image.outerWidth();
					height	= image.outerHeight();

				} else {
					pos = $(element).offset();
				}

			} else {
				viewport	= F.getViewport();
				pos.top		= viewport.y + ( viewport.h - height) * 0.5;
				pos.left	= viewport.x + ( viewport.w - width) * 0.5;
			}

			pos = {
				top		: Math.ceil( pos.top ) + 'px',
				left	: Math.ceil( pos.left ) + 'px',
				width	: Math.ceil( width ) + 'px',
				height	: Math.ceil( height ) + 'px'
			};

			return pos;
		},
		
		step : function(now, fx) {
			if (fx.prop === 'width' || fx.prop === 'height') {
				var ratio = fx.end > fx.start ? (now - fx.start) / ( fx.end - fx.start) : (now - fx.end) / ( fx.start - fx.end);

				if (fx.prop === 'height') {
					F.inner.height( Math.ceil(now - (F.current.padding * 2) - (F.innerSpace * ratio)));
					F.outer.height( Math.ceil(now - (F.current.padding * 2) - (F.outerSpace * ratio)));

				} else if (fx.prop === 'width') {
					F.outer.width( Math.ceil(now - (F.current.padding * 2)) );
					F.inner.width( Math.ceil(now - (F.current.padding * 2)) );
				}
			}
		},

		zoomIn : function() {
			var startPos, endPos;

			if (F.current.openEffect === 'elastic') {
				endPos = $.extend({}, F.current.dim, F._getPosition(true));

				//Remove "position" property
				delete endPos.position;

				F.innerSpace = F.wrap.height() - F.inner.height() - (F.current.padding * 2);
				F.outerSpace = F.wrap.height() - F.outer.height() - (F.current.padding * 2);

				startPos = this.getOrigPosition();

				if (F.current.openOpacity) {
					startPos.opacity	= 0;
					endPos.opacity		= 1;
				}

				F.wrap
					.css( startPos )
					.animate( endPos, {
						duration	: F.current.openSpeed,
						easing		: F.current.openEasing,
						step		: this.step,
						complete	: F._afterZoomIn
					});

			} else {
				F.wrap.css( $.extend({}, F.current.dim, F._getPosition()) );
				
				if (F.current.openEffect === 'fade') {
					F.wrap.hide().fadeIn( F.current.openSpeed, F._afterZoomIn);

				} else {
					F._afterZoomIn();
				}
			}
		},

		zoomOut : function() {
			var endPos;

			if (F.current.closeEffect === 'elastic') {
				if (F.wrap.css('position') === 'fixed') {
					F.wrap.css( F._getPosition(true) );
				}

				endPos = this.getOrigPosition();

				if (F.current.closeOpacity) {
					endPos.opacity = 0;
				}

				F.innerSpace = F.wrap.height() - F.inner.height() - (F.current.padding * 2);
				F.outerSpace = F.wrap.height() - F.outer.height() - (F.current.padding * 2);
				
				F.wrap.animate( endPos, {
					duration	: F.current.closeSpeed,
					easing		: F.current.closeEasing,
					step		: this.step,
					complete	: F._afterZoomOut
				});

			} else {
				F.wrap.fadeOut( F.current.closeEffect === 'fade' ? F.current.Speed : 0, F._afterZoomOut);
			}
		},

		changeIn : function() {
			var startPos;

			if (F.current.nextEffect === 'elastic') {
				startPos			= F._getPosition(true);
				startPos.opacity	= 0;
				startPos.top		= (parseInt(startPos.top, 10) - 200) + 'px';

				F.wrap.css( startPos ).animate({
					opacity	: 1,
					top		: '+=200px'
				}, {
					duration	: F.current.nextSpeed,
					complete	: F._afterZoomIn
				});

			} else {
				F.wrap.css( F._getPosition() );
				
				if (F.current.nextEffect === 'fade') {
					F.wrap.hide().fadeIn( F.current.nextSpeed, F._afterZoomIn);

				} else {
					F._afterZoomIn();
				}
			}
		},

		changeOut : function() {
			function cleanUp() {
				$(this).trigger('onReset').remove();	
			}

			F.wrap.removeClass('fancybox-opened');

			if (F.current.prevEffect === 'elastic') {
				F.wrap.animate( {'opacity' : 0, top : '+=200px' }, {
					duration	: F.current.prevSpeed,
					complete	: cleanUp
				});

			} else {
				F.wrap.fadeOut( F.current.prevEffect === 'fade' ? F.current.prevSpeed : 0, cleanUp);
			}
		}
	};

	/*
	*	Overlay helper
	*/

	F.helpers.overlay = {
		overlay	: null,

		update : function() {
			var width, scrollWidth, offsetWidth;

			//Reset width/height so it will not mess
			this.overlay.width(0).height(0);
			
			if ($.browser.msie) {
				scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
				offsetWidth = Math.max(document.documentElement.offsetWidth, document.body.offsetWidth);

				width = scrollWidth < offsetWidth ? W.width() : scrollWidth;

			} else {
				width = D.width();
			}

			this.overlay.width( width ).height( D.height() );
		},

		beforeShow	: function( opts ) {
			if (this.overlay) {
				return;
			}

			this.overlay = $('<div id="fancybox-overlay"></div>')
				.css( opts.css || {background : 'black'} )
				.appendTo('body');

			if (opts.closeClick) {
				this.overlay.bind('click.fb', F.close);
			}

			W.bind("resize.fb", $.proxy( this.update, this ) );

			this.update();

			this.overlay.fadeTo( opts.speedIn || "fast", opts.opacity || 1);
		},

		onUpdate : function() {
			//Update as content may change document dimensions
			this.update();
		},

		afterClose : function( opts ) {
			if (this.overlay) {
				this.overlay.fadeOut(opts.speedOut || "fast", function() {
					$(this).remove();
				});
			}

			this.overlay = null;
		}
	};

	/*
	*	Title helper
	*/

	F.helpers.title = {
		beforeShow : function( opts ) {
			var title, text = F.current.title || F.current.element.title || '';

			if (!text || !text.length) {
				return;	
			}

			title = $('<div class="fancybox-title fancybox-title-' + opts.type + '-wrap">' + text + '</div>').appendTo('body');

			if (opts.type === 'float') {
				//This helps for some browsers
				title.width( title.width() );

				title.wrapInner('<span class="child"></span>');

				//Increase bottom margin so title can also fit into viewport
				F.current.margin[2] += Math.abs( parseInt( title.css('margin-bottom'), 10 ) );
			}

			title.appendTo( opts.type === 'over' ? F.inner : (opts.type === 'outside' ? F.wrap : F.outer ));
		}
	};

	// jQuery plugin initialization
	$.fn.fancybox = function(options) {
		var opts = options || {}, selector = this.selector || '';

		function run(e) {
			var group = [];

			e.preventDefault();

			if (this.rel && this.rel !== '' && this.rel !== 'nofollow') {
				if (selector.length) {
					group = $(selector).filter('[rel="' + this.rel + '"]');

				} else {
					group = $('[rel="' + this.rel + '"]');
				}
			}

			if (group.length) {
				opts.index = group.index( this );

				F(group.get(), opts);

			} else {
				F(this, opts);
			}

			return false; 
		}

		if (selector.length) {
			D.undelegate(selector, 'click.fb-start').delegate(selector, 'click.fb-start', run);

		} else {
			$(this).unbind('click.fb-start').bind('click.fb-start', run);
		}
	};
}(window, document, jQuery));