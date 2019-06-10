// UserProfileFormRouter.js
var Marionette = require('backbone.marionette');
module.exports = UserProfileFormRouter = Marionette.AppRouter.extend({
    appRoutes: {
        "user/profile": "ShowProfile",
        "user/settings": "ShowSettings",
        "user/locale": "ShowLocale",
        "user/email/setup": "SetupEmail",
        // "user/email/callback?:reason&:error": "ReceiveEmailCallbackError",
        "user/email/callback?:code": "ReceiveEmailCallback",
        "user/email/status": "ShowEmailStatus",
        "user/password": "ShowPasswordChange"
    }
});