var Marionette = require('backbone.marionette');

module.exports = RightMenuView = Marionette.ItemView.extend({
    template: require('../templates/rightMenu.hbs'),
    className: "right-stat-bar"
});

