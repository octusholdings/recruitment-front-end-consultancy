// SessionRouter.js
var Marionette = require('backbone.marionette');
module.exports = SessionRouter = Marionette.AppRouter.extend({
    appRoutes: {
        "login"         : "Login",
        "logout"        : "Logout",
        'forgotPassword': 'ForgotPassword'
    }
});