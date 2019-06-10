var Marionette = require('backbone.marionette');
module.exports = UserTitleView = Marionette.ItemView.extend({
    template: require('../templates/userTitleView.hbs'),
    initialize: function (options) {
        var self = this;
        this.title = options.title ;
    },
    onShow: function () {
        $('#title').html(this.title);
    }
});