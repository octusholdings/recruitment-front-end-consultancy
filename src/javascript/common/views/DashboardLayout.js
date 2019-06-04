var Marionette = require('backbone.marionette');

module.exports = DashboardLayout = Marionette.Layout.extend({
    template: require('../templates/dashboardLayout.hbs'),
    regions: {
        pageHeader: ".page-head",
        pageContent: ".page-content"
    }
});