var Marionette                 = require('backbone.marionette'),
    Backbone                   = require('backbone'),
    moment                     = require('moment-timezone'),
    _                          = require('underscore'),
    HeaderView                 = require('./views/HeaderView'),
    UserPreference             = require('../admin/user/models/UserPreference');

// private
var Layout = Marionette.Layout.extend({
    template : require('./templates/homeLayout.hbs'),
    className: "wrapper",
    tagName  : "section",
    regions  : {
        header              : "#home-header",
        pageControl         : "#page-control",
        contractorList      : "#contractor-list",
        networkUpdateList   : "#networkUpdateList",
        kpiList             : "#kpi-list",
        calendar            : "#homeCalendar",
        currentJobFlow      : "#currentJobFlow",
        taskList            : "#task-list",
        interviewList       : "#interviewList",
        activityLegends     : "#activity-legends",
        meetingList         : "#meetingList",
        activityContent     : "#activity-content",
        callBackList        : '#callBackList'
    },
    behaviors: {
        CheckPermissions: { view: "layout" }
    },
    onShow: function () {
        this.showBreadcrumbs();
        
    },
    
    showBreadcrumbs: function () {
        var breadcrumbsList = new Array();
        breadcrumbsList.push(RecruiterApp.polyglot.t('home'));

        RecruiterApp.core.vent.trigger('app:breadcrumbs:update', breadcrumbsList);
    }
});


module.exports = HomeController = Marionette.Controller.extend({
    _initializeLayout: function () {
        RecruiterApp.core.vent.trigger('app:log', ['HomeController', 'initializeLayout...'])
        HomeController.layout = new Layout();
        HomeController.layout.on("show", function () {
            RecruiterApp.core.vent.trigger("layout:rendered");
        });
        RecruiterApp.core.vent.trigger('app:show', HomeController.layout,true);
        RecruiterApp.core.vent.trigger('menu:highlight','home');
    },

    ShowHome: function () {

        RecruiterApp.core.vent.trigger('ga:send', { hitType: 'pageview', page: 'Home'});

        this._initializeLayout();

        RecruiterApp.core.vent.trigger('nav:toggle', "#homeTab");
        RecruiterApp.core.vent.trigger('domchange:title', RecruiterApp.polyglot.t('home'));

        var headerView = new HeaderView();
        HomeController.layout.header.show(headerView);
    }
});
