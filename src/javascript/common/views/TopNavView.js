var Marionette = require('backbone.marionette'), stickit = require('backbone.stickit');

module.exports = TopNavView = Marionette.ItemView.extend({
    template: require('../templates/topNav.hbs'),
    bindings: {
        '.name' : 'name'
    },
    onRender: function() {
        this.stickit();
    }
});


