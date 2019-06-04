var Marionette = require('backbone.marionette');
module.exports = PeopleNavView = Marionette.ItemView.extend({
    template: require('../templates/titleView.hbs'),
    initialize: function (options) {
        var self = this;
        this.title = options.title ;
    },
    onShow: function () {
        $('#title').html(this.title);
    }
});