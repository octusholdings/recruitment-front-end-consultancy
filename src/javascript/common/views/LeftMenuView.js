var Marionette                  = require('backbone.marionette'),
    Session                     = require("../../session/models/Session"),
    stickit                     = require('backbone.stickit'),
    CheckPermissionBehavior     = require('../../session/behaviors/CheckPermissionBehavior'),
    menuItemList                = require('../models/MenuItemList'),
    PermissionHelper            = require("../../session/models/PermissionHelper");

module.exports = LeftMenuItemView = Marionette.ItemView.extend({
template: require('../templates/leftMenuItem.hbs'),
    className: 'leftMenuItem wb',
    bindings: {
        '.name'  : 'name',
        '.url'   : 'url',
        '.title' : 'title'
    },
    events: {
        'click .noSub': 'highlight',
        'click .subItem': 'highlightSubMenu'
    },
    highlight: function(e){
        e.stopPropagation();
        $("#mainSideMenu .list-group-item, .subItem").removeClass('active');
        this.$el.find('.list-group-item').addClass('active');
        this.$el.siblings().find('.in').collapse('hide');
    },
    highlightSubMenu: function(e){
        e.stopPropagation();
        $("#mainSideMenu .list-group-item, .subItem").removeClass('active');
        this.$el.find('.list-group-item').addClass('active');
        this.$el.siblings().find('.in').collapse('hide');
        var currentSubMenu = $(e.currentTarget);
        currentSubMenu.addClass('active');
    },
    onRender: function() {
        this.stickit();
        this.$el.addClass(this.model.get('name'))
    }
});

module.exports = LeftMenuView = Marionette.CompositeView.extend({
    template: require('../templates/leftMenuNew.hbs'),
    className: 'list-group panel',
    itemView: LeftMenuItemView,
    itemViewContainer: '#leftMenuItems',
    onShow: function () {
        var permissionHelper = new PermissionHelper();
        permissionHelper.processSideMenu(this)
    }
});