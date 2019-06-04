/*!
 xBreadcrumbs 2.1.0 jQuery Plugin
 (c) 2010-2014 w3Blender.com
 For any questions and support please visit www.w3blender.com.
 */(function(e,t,n,r){var i={collapsible:!1,collapsedWidth:20,showSpeed:"fast",showAction:"hover",hideSpeed:"",breadcrumbsHideSpeed:"fast",breadcrumbsShowSpeed:"normal",showEffect:"fade"};e.fn.xBreadcrumbs=function(t){var n=e.extend({},i,t),r=function(t){if(n.collapsible===!0){n.collapsedWidth=parseInt(n.collapsedWidth,10);n.collapsedWidth<1&&(n.collapsedWidth=1);var r=t.children("li").length;t.children("li").children("a").css({"white-space":"nowrap","float":"left"});t.children("li").children("a").each(function(t,i){r>t+1&&e(i).css({overflow:"hidden"}).data("initialWidth",parseInt(e(i).width(),10)).width(n.collapsedWidth)})}var i=function(){if(!0===e(this).hasClass("hover")){e(this).trigger("mouseleave");return!1}s(t);if(n.collapsible===!0&&!e(this).hasClass("current")){var r=e(this).children("a").data("initialWidth");r>0&&e(this).children("a").stop().animate({width:r},n.breadcrumbsHideSpeed)}u(e(this))&&o(e(this).children("ul"),!0);return!1};n.showAction==="hover"?t.children("li").unbind("mouseenter.xBreadcrumbs").bind("mouseenter.xBreadcrumbs",i):n.showAction==="click"?t.children("li").unbind("click.xBreadcrumbs").bind("click.xBreadcrumbs",i):typeof console!="undefined"&&console.error("xBreadcrumbs Error: Wrong 'showAction' setting. Accepted values are: 'hover' or 'click'.");t.children("li").mouseleave(function(){s(t);u(e(this))&&o(e(this).children("ul"),!1);n.collapsible===!0&&!1===e(this).hasClass("current")&&e(this).children("a").stop().animate({width:n.collapsedWidth},n.breadcrumbsShowSpeed)})},s=function(t){t.children("li").children("ul").each(function(){e(this).hide();e(this).parent().removeClass("hover")})},o=function(e,t){if(t===!0){e.parent().addClass("hover");n.showSpeed!==""?n.showEffect==="slide"?e.slideDown(n.showSpeed):e.fadeIn(n.showSpeed):e.show()}else{e.removeClass("hover");n.hideSpeed!==""?n.showEffect==="slide"?e.slideUp(n.hideSpeed):e.fadeOut(n.hideSpeed):e.hide()}},u=function(e){return e.children("ul").length>0};return this.each(function(){r(e(this))})}})(jQuery,window,document);