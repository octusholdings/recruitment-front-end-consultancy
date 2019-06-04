var Marionette = require('backbone.marionette'),


LeftMenuView = require('./common/views/LeftMenuView'),
    RightMenuView = require('./common/views/RightMenuView'),
    RightSearchView = require('./common/views/RightSearchView'),
    TopMenuView = require('./common/views/TopMenuView'),
    TopNavView = require('./common/views/TopNavView'),
    CurrentUser = require('./common/models/CurrentUser'),
    tpl = require('../template/layout.hbs');



module.exports = Marionette.Layout.extend({
    template: tpl,

    ui: {
        app: '#todoapp'
    },

    regions: {
        header:     '#header',
        main:       '#main',
        footer:     '#footer'
    },



    updateFilter: function(filter) {
        this.ui.app.attr('class', 'filter-' + filter);
    },



    onShow: function() {
        var options = {collection: this.options.todosCollection};

        this.header.show(new HeaderView(options));
        this.main.show(new TodosView(options));
        this.footer.show(new FooterView(options));
    }

});