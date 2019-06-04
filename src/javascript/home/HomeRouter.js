var Marionette = require('backbone.marionette');

module.exports = HomeRouter = Marionette.AppRouter.extend({
    appRoutes: {
        ""      : "ShowHome", 
        "index" : "ShowHome", 
        "home"  : "ShowHome"
    }
});