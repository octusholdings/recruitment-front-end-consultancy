var Marionette = require('backbone.marionette');

module.exports = LoginView = Marionette.ItemView.extend({
    template: require('../templates/login.hbs'),
    initialize: function(options) {
        this.redirectFrom = options.redirectFrom;
    },
    events: {
        'click #sendLogin' : 'login'
    },
    onShow: function() {
        $('#username').focus();
        $('.currentYear').text(new Date().getFullYear());
    },
    onRender: function() {
        //hide the nice scroll bar
        $("div[id^=ascrail]").remove();
        RecruiterApp.core.vent.trigger('unBlockUI');
    },
    login: function(e) {
        e.preventDefault();
        var session = this.model;
        var username = $('#username').val();
        var password = $('#password').val();
        session.login(username, password);
    }
});