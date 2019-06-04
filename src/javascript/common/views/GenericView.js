var
    $ = require('jquery'),
    Backbone = require('backbone'),
    Marionette = require('backbone.marionette');
module.exports = FooterView = Marionette.ItemView.extend({
    initialize: function(options) {
        this.template = options.template;
    }
});