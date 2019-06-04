var Marionette = require('backbone.marionette');
module.exports = PeopleDashboardRouter = Marionette.AppRouter.extend({
    appRoutes: {
        "people/candidates": "ShowCandidates",
        "people/clients": "ShowClients"
    }
});