var Marionette = require('backbone.marionette');

module.exports = RightSearchView = Marionette.ItemView.extend({
    template: require('../templates/rightSearch.hbs'),
    className: "search-row"
});


