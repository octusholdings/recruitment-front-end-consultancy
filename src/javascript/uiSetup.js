var
    $ = require('jquery'),
    ui = require('jquery.ui'),
    bootstrap = require('bootstrap');

module.exports = UiSetup = {

    Setup: function() {
        // MAKE CODE PRETTY
        // ------------------------------------------------------------------------------------------------ * -->
        var $window = $(window)
        window.prettyPrint && prettyPrint();

        // CHANGE wrapper to table - ONLY DEMO
        // ------------------------------------------------------------------------------------------------ * -->
        $("#btnChangeWrapper1, #btnChangeWrapper2").click(function () {
            $('.widget').toggleClass('widget-simple widget-box');
        });

        // COLLAPSE - WIDGET HEADER
        // ------------------------------------------------------------------------------------------------ * -->
        // Collapsible widget
        $('.widget-content.collapse')
            .on('shown', function (e) {
                $(e.target)
                    .parent('.widget-collapsible')
                    .children('.widget-header')
                    .removeClass('collapsed');
                $(e.target)
                    .prev('.widget-header')
                    .find('.widget-toggle')
                    .toggleClass('fontello-icon-publish fontello-icon-window');
            });

        $('.widget-content.collapse')
            .on('hidden', function (e) {
                $(e.target)
                    .parent('.widget-collapsible')
                    .children('.widget-header')
                    .addClass('collapsed');
                $(e.target)
                    .prev('.widget-header')
                    .find('.widget-toggle')
                    .toggleClass('fontello-icon-window fontello-icon-publish');
            });


        // BOOTSTRAP BUTTON TOGGLE CHANGE COLOR ON ACTIVE
        // ------------------------------------------------------------------------------------------------ * -->
        // $('.btn-group > .btn, .btn[data-toggle="button"]').click(function () {

        //     if($(this).attr('class-toggle') != undefined && !$(this).hasClass('disabled')) {
        //         var btnGroup = $(this).parent('.btn-group');

        //         if(btnGroup.attr('data-toggle') == 'buttons-radio') {
        //             btnGroup.find('.btn').each(function () {
        //                 $(this).removeClass($(this).attr('class-toggle'));
        //             });
        //             $(this).addClass($(this).attr('class-toggle'));
        //         }

        //         if(btnGroup.attr('data-toggle') == 'buttons-checkbox' || $(this).attr('data-toggle') == 'button') {
        //             if($(this).hasClass('active')) {
        //                 $(this).removeClass($(this).attr('class-toggle'));
        //             } else {
        //                 $(this).addClass($(this).attr('class-toggle'));
        //             }
        //         }
        //     }
        // });


        // BOOTSTRAP TOOLTIP
        // ------------------------------------------------------------------------------------------------ * -->
        $("a[rel=tooltip], input[rel=tooltip] ").tooltip()

        $('.Ttip').tooltip({
            placement: 'top'
        });
        $('.Rtip').tooltip({
            placement: 'right'
        });
        $('.Btip').tooltip({
            placement: 'bottom'
        });
        $('.Ltip').tooltip({
            placement: 'left'
        });

        // GTIP - TOOLTIP
        // ------------------------------------------------------------------------------------------------ * -->
        var shared = {
            position: {
                viewport: $(window)
            },
            style: {
                tip: true,
                classes: 'ui-tooltip-shadow ui-tooltip-tipsy'
            }
        };

        // BOOTSTRAP POPOVER
        // ------------------------------------------------------------------------------------------------ * -->
        // popover demo
        $('.popover').popover()
        $("[rel=popover]")
            .popover({
                html: true
            });

        // popover hover
        $("[rel=popover-hover]")
            .popover({
                html: true,
                trigger: 'hover',
                delay: {
                    hide: 500
                }
            });

        // Popover hide click to element
        $('[rel=popover-click]')
            .popover({
                html: true,
                delay: {
                    show: 100,
                    hide: 300
                }
            })
            .click(function (e) {
                $(this).popover('toggle');
                e.stopPropagation();
            });

        // SPARKLINE
        // ------------------------------------------------------------------------------------------------ * -->
        // Change class for tooltip
        // $.fn.sparkline.defaults.common.tooltipClassname = 'sparktip';


        // Bootstrap Hack for button radio to hidden input
        // ------------------------------------------------------------------------------------------------ * -->
//        var _old_toggle = $.fn.button.prototype.constructor.Constructor.prototype.toggle;
//        $.fn.button.prototype.constructor.Constructor.prototype.toggle = function () {
//            _old_toggle.apply(this);
//            var $parent = this.$element.parent('[data-toggle="buttons-radio"]')
//            var target = $parent ? $parent.data('target') : undefined;
//            var value = this.$element.attr('value');
//            if(target && value) {
//                $('#' + target).val(value);
//            }
//        };
    },


    SetupCore: function() {
        var gbks = gbks || {};
        gbks.common = gbks.common || {};

        gbks.common.scroller = gbks.common.scroller || {};
        gbks.common.scroller.scrollToPosition = function (position) {
            gbks.common.scroller.scrollInfo = {
                startTime: new Date().getTime(),
                startValue: window.pageYOffset,
                endValue: position,
                duration: 1500,
                lastUpdate: new Date().getTime()
            };

            $(window).unbind('mousewheel', gbks.common.scroller.mousewheelFunction);
            $(window).bind('mousewheel', gbks.common.scroller.mousewheelFunction);

            clearTimeout(gbks.common.scroller.scrollInterval);
            gbks.common.scroller.scrollInterval = setTimeout($.proxy(gbks.common.scroller.onScrollInterval, gbks.common.scroller), 25);
        };

        gbks.common.scroller.onScrollInterval = function (event) {
            var info = gbks.common.scroller.scrollInfo;
            var delta = new Date().getTime() - info.startTime;
            delta = Math.min(delta, info.duration);
            var pos = gbks.common.scroller.easeInOutCubic(null, delta, info.startValue, info.endValue - info.startValue, info.duration);

            window.scrollTo(0, pos);

            if(Math.abs(delta) < info.duration) {
                var timePassed = new Date().getTime() - info.lastUpdate;
                var timer = Math.max(5, 25 - timePassed);

                clearTimeout(gbks.common.scroller.scrollInterval);
                gbks.common.scroller.scrollInterval = setTimeout($.proxy(gbks.common.scroller.onScrollInterval, gbks.common.scroller), timer);
            }
            else {
                $(window).unbind('mousewheel', gbks.common.scroller.mousewheelFunction);
            }

            info.lastUpdate = new Date().getTime();
        };
        gbks.common.scroller.onMouseWheel = function (event) {
            $(window).unbind('mousewheel', gbks.common.scroller.mousewheelFunction);
            clearInterval(gbks.common.scroller.scrollInterval);
        };
        gbks.common.scroller.easeInOutCubic = function (x, t, b, c, d) {
            if((t /= d / 2) < 1) return c / 2 * t * t * t + b;
            return c / 2 * ((t -= 2) * t * t + 2) + b;
        };
        gbks.common.scroller.mousewheelFunction = $.proxy(gbks.common.scroller.onMouseWheel, gbks.common.scroller);



            // REMOVE CSS FROM ELEMENT
            // ------------------------------------------------------------------------------------------------ * -->
            $.fn.extend({
                removeCss: function (cssName) {
                    return this.each(function () {
                        var curDom = $(this);
                        jQuery.grep(cssName.split(","),

                            function (cssToBeRemoved) {
                                curDom.css(cssToBeRemoved, '');
                            });
                        return curDom;
                    });
                }
            });

            // SIDEBAR RESIZE - CONVERT NAV
            // ------------------------------------------------------------------------------------------------ * -->
            $(window).resize(function () {
                if($(window).width() <= 767) {
                    $('.sidebar').addClass('collapse')
                    $('.sidebar').removeCss('display');
                }
                if($(window).width() > 767) {
                    $('.sidebar').removeClass('collapse');
                    $('.sidebar').removeCss('height');

                    if(!$('body').hasClass('sidebar-hidden')) {
                        $('.sidebar').css({
                            'display': 'block'
                        });
                    } else {
                        $('.sidebar').css({
                            'display': 'none'
                        });
                    }
                }
            });
            $(function () {
                if($(window).width() <= 767) {
                    $('.sidebar').addClass('collapse');
                }
                if($(window).width() > 767) {
                    $('.sidebar').removeClass('collapse');
                    $('.sidebar').removeCss('height');
                }
            });

            // SIDEBAR - SHOW OR HIDDEN
            // ------------------------------------------------------------------------------------------------ * -->
            function showSidebar() {
                $('body').removeClass('sidebar-hidden');
                // $.cookie('sidebar-pref', null, {
                //     expires: 30
                // });
            }

            function hideSidebar() {
                $('body').addClass('sidebar-hidden');
                // $.cookie('sidebar-pref', 'sidebar-hidden', {
                //     expires: 30
                // });
            }

            $("#btnToggleSidebar").click(function () {
                $(this).toggleClass('fontello-icon-resize-full-2 fontello-icon-resize-small-2');
                $(this).toggleClass('active');
                $('#main-sidebar').animate({
                    width: 'toggle'
                }, 0);
                //$('body').toggleClass('sidebar-display sidebar-hidden');
                if($('body').hasClass('sidebar-hidden')) {
                    showSidebar();
                } else {
                    hideSidebar();
                }
            });

            // auto-load preference
//            $('body').addClass($.cookie('sidebar-pref'));

            // SIDEBAR - CHANGE SIDEBAR
            // ------------------------------------------------------------------------------------------------ * -->
            $("#btnChangeSidebar").click(function () {
                $(this).toggleClass('fontello-icon-login fontello-icon-logout');
                $('body').toggleClass('sidebar-left sidebar-right');
                $('#mainSideMenu .chevron').toggleClass('fontello-icon-right-open-3 fontello-icon-left-open-3');
                $(this).toggleClass('active');
            });

            // SIDEBAR - CHANGE SIDEBAR COLOR
            // ------------------------------------------------------------------------------------------------ * -->
            $("#btnChangeSidebarColor").click(function () {
                $('#main-sidebar').toggleClass('sidebar-inverse');
            });

            // SCROLL TOP PAGE
            // ------------------------------------------------------------------------------------------------ * -->
            $(window).scroll(function () {
                if($(this).scrollTop() > 100) {
                    $('#btnScrollup').fadeIn('slow');
                } else {
                    $('#btnScrollup').fadeOut(600);
                }
            });

            $('#btnScrollup').click(function () {
                $("html, body").animate({
                    scrollTop: 0
                }, 500);
                return false;
            });

    }

};