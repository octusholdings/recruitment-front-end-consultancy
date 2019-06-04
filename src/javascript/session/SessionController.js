// SessionController.js
var Marionette  = require('backbone.marionette'),
    Backbone = require('backbone'),
    LoginView   = require('./views/LoginView'),
    Session     = require('./models/Session'),
    ForgotPasswordView   = require('./views/ForgotPasswordView'),
    ForgotPassword = require('./models/ForgotPassword');

var Layout = Marionette.Layout.extend({
    template: require('./templates/sessionLayout.hbs'),
    regions: {
        content: ".signin-content"
    }
});

module.exports = SessionController = Marionette.Controller.extend({

    initializeLayout () {
        RecruiterApp.core.vent.trigger('app:log',['SessionController','initializeLayout...']);
        SessionController.layout = new Layout();
        SessionController.layout.on("show", function () {
            RecruiterApp.core.vent.trigger("sessionLayout:rendered");
        });
        RecruiterApp.core.vent.trigger('blank:show', SessionController.layout);
    },

    initialize () {
        var self = this;
        RecruiterApp.core.vent.on('app:login', function(windowHash) {
            console.log("windowHash in sessionController", windowHash);
            self.Login(windowHash);
        });
    },
    Login (windowHash) {
        this.initializeLayout();
        if (localStorage.getItem('authToken')) {
            Backbone.history.navigate('', { trigger : true});
            return;
        }
        var session = new Session();
        session.set("redirectFrom", windowHash);
        SessionController.layout.content.show(new LoginView({model: session }));
    },
    ForgotPassword () {
        this.initializeLayout();
        var forgotPasswordModel = new ForgotPassword();
        // session.set("redirectFrom", windowHash);
        SessionController.layout.content.show(new ForgotPasswordView({model: forgotPasswordModel }));
    },
    Logout () {
        this.initializeLayout();
        var session = new Session();     
        SessionController.layout.content.show(new LoginView({model: session }));
        session.logout();
        localStorage.removeItem('authToken');
    }

});