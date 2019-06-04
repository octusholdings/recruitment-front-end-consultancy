var Marionette = require('backbone.marionette');

module.exports = EmptyView = Marionette.ItemView.extend({
    template: require('../templates/emptyView.hbs'),
    serializeData: function() {
        return {
            "message": this.options.message
        }
    }
});